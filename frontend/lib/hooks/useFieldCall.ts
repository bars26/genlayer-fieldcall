"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import FieldCall, { type CreateCallInput, type TxProgress, type TxResult } from "../contracts/FieldCall";
import { isFunder, sameAddress, todayUtc, wei, windowLeftSeconds, RULING_STYLE, factsOf, type Call, type Ruling, type Sighting } from "../contracts/types";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { TxError, classifyError } from "../utils/errors";
import { error, success } from "../utils/toast";
import { startTx, updateTx, type TxKind } from "./useTxLog";

export function useFieldCallContract(): FieldCall | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();
  return useMemo(
    () => (contractAddress ? new FieldCall(contractAddress, address, studioUrl) : null),
    [contractAddress, address, studioUrl]
  );
}

type Registry = { calls: Call[]; sightings: Sighting[]; fetchedAt?: string };

async function fetchJson(url: string, timeoutMs = 25_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const res = await fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body;
}

/**
 * Every call and sighting, from the CDN-cached server snapshot (app/api/registry), so page
 * loads spend none of the visitor's Studio rate-limit budget. Falls back to two direct reads.
 */
export function useRegistry() {
  const contract = useFieldCallContract();
  const query = useQuery<Registry, Error>({
    queryKey: ["registry"],
    queryFn: async () => {
      try {
        const body = await fetchJson("/api/registry");
        if (!Array.isArray(body.calls) || !Array.isArray(body.sightings)) throw new Error("Malformed snapshot");
        return body as Registry;
      } catch (snapshotErr) {
        if (!contract) throw classifyError(snapshotErr, "read");
        const [calls, sightings] = await Promise.all([contract.getCalls(), contract.getSightings()]);
        return { calls, sightings, fetchedAt: new Date().toISOString() };
      }
    },
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
  return {
    calls: query.data?.calls ?? [],
    sightings: query.data?.sightings ?? [],
    fetchedAt: query.data?.fetchedAt,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Re-read what a write touched and merge it into the cached registry. */
async function mergeFresh(qc: ReturnType<typeof useQueryClient>, contract: FieldCall, callId?: string, sightingId?: string) {
  try {
    const [call, sighting] = await Promise.all([
      callId ? contract.getCall(callId) : Promise.resolve(null),
      sightingId ? contract.getSighting(sightingId) : Promise.resolve(null),
    ]);
    qc.setQueryData<Registry>(["registry"], (prev) => {
      let calls = prev?.calls ?? [];
      let sightings = prev?.sightings ?? [];
      if (call) calls = calls.some((c) => c.id === call.id) ? calls.map((c) => (c.id === call.id ? call : c)) : [...calls, call];
      if (sighting)
        sightings = sightings.some((s) => s.id === sighting.id) ? sightings.map((s) => (s.id === sighting.id ? sighting : s)) : [...sightings, sighting];
      return { calls, sightings, fetchedAt: prev?.fetchedAt };
    });
  } catch {
    // Already confirmed on chain; the next snapshot refresh picks it up.
  }
}

export type WriteVars =
  | { kind: "create"; input: CreateCallInput; fund: bigint }
  | { kind: "fund"; callId: string; value: bigint }
  | { kind: "submit"; callId: string; observationId: string }
  | { kind: "contest"; sightingId: string }
  | { kind: "settle"; sightingId: string }
  | { kind: "collect"; sightingId: string }
  | { kind: "close"; callId: string };

export const WRITE_LABEL: Record<TxKind, string> = {
  create: "Open a call",
  fund: "Add to the pot",
  submit: "Submit a sighting",
  contest: "Ask for a fresh reading",
  settle: "Settle",
  collect: "Collect a held reward",
  close: "Close the call",
};

const rulingNote = (v: unknown, s?: Sighting) => {
  const style = RULING_STYLE[String(v) as Ruling];
  if (!style) return "Recorded.";
  return `${style.label}. ${s?.why ?? style.help}`;
};

/** One mutation for every FieldCall write, with a transaction log entry and typed errors. */
export function useFieldCallWrite() {
  const contract = useFieldCallContract();
  const { address } = useWallet();
  const qc = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (vars: WriteVars) => {
      const target =
        vars.kind === "create"
          ? vars.input.title
          : vars.kind === "submit"
            ? `${vars.callId} ← observation ${vars.observationId}`
            : "sightingId" in vars
              ? vars.sightingId
              : vars.callId;
      const logId = startTx(vars.kind, target);
      setPending(vars.kind === "create" ? "create" : `${vars.kind}:${"sightingId" in vars ? vars.sightingId : vars.callId}`);
      const onProgress = (p: TxProgress) =>
        updateTx(logId, {
          state: p.step === "awaiting_wallet" ? "awaiting_wallet" : p.step === "accepted" ? "accepted" : "confirming",
          txHash: p.txHash,
          progress: p.message,
        });
      const refuse = (message: string): never => {
        throw new TxError({ kind: "contract_revert", phase: "estimate", message, hint: "The data was refreshed; nothing was sent." });
      };
      try {
        if (!contract) throw new TxError({ kind: "unknown", phase: "send", message: "The contract address is not configured." });
        if (!address) throw new TxError({ kind: "wallet_missing", phase: "send", message: "No wallet is connected." });

        let result: TxResult;
        let callId = "callId" in vars ? vars.callId : undefined;
        let sightingId = "sightingId" in vars ? vars.sightingId : undefined;
        let note = "Done.";
        // Re-read right before sending, so a stale list never sends a call the contract would refuse.
        switch (vars.kind) {
          case "create":
            result = await contract.createCall(vars.input, vars.fund, onProgress);
            callId = typeof result.returned === "string" ? result.returned : undefined;
            note = callId ? `${callId} is open for sightings.` : "Call opened.";
            break;
          case "fund": {
            const c = await contract.getCall(vars.callId);
            if (c.state !== "open" || todayUtc() > c.ends) refuse("This call no longer takes funding.");
            result = await contract.fund(vars.callId, vars.value, onProgress);
            note = "Added to the pot. Whatever is left when the call closes returns to funders in proportion.";
            break;
          }
          case "submit": {
            const c = await contract.getCall(vars.callId);
            if (c.state !== "open" || todayUtc() > c.collect_until) refuse(`This call closed to sightings on ${c.collect_until}.`);
            if (wei(c.pot) < wei(c.reward)) refuse("This call's pot is empty.");
            const prior = await contract.sightingFor(vars.callId, vars.observationId);
            if (prior) {
              const s = await contract.getSighting(prior);
              if (s.state === "pending") refuse(`${s.id} for this observation is still open.`);
              if (s.ruling === "ELIGIBLE") refuse(`This observation has already earned its reward (${s.id}).`);
            }
            result = await contract.submit(vars.callId, vars.observationId, onProgress);
            sightingId = typeof result.returned === "string" ? result.returned : undefined;
            if (sightingId) {
              const s = await contract.getSighting(sightingId);
              note = `${sightingId}: ${rulingNote(s.ruling, s)}`;
            }
            break;
          }
          case "contest": {
            const s = await contract.getSighting(vars.sightingId);
            const c = await contract.getCall(s.call_id);
            callId = c.id;
            if (s.state !== "pending") refuse("This sighting is already settled.");
            if (windowLeftSeconds(s) === 0) refuse("The response window has closed; the sighting can only be settled now.");
            const wallet = factsOf(s).wallet;
            const mine =
              s.ruling === "ELIGIBLE"
                ? isFunder(c, address) && !s.funders_contested
                : (sameAddress(s.submitter, address) || sameAddress(wallet, address)) && !s.submitter_contested;
            if (!mine) refuse("This ruling does not go against you, or your side has already asked for a fresh reading.");
            result = await contract.contest(vars.sightingId, onProgress);
            const fresh = await contract.getSighting(vars.sightingId);
            note = `Read again: ${rulingNote(result.returned, fresh)} The response window restarted.`;
            break;
          }
          case "settle": {
            const s = await contract.getSighting(vars.sightingId);
            const c = await contract.getCall(s.call_id);
            callId = c.id;
            if (s.state !== "pending") refuse("This sighting is already settled.");
            if (windowLeftSeconds(s) > 0) {
              if (s.ruling === "ELIGIBLE" && !isFunder(c, address)) refuse("Until the window ends, only a funder can pay early.");
              if (s.ruling !== "ELIGIBLE" && !sameAddress(s.submitter, address)) refuse("Until the window ends, only the submitter can accept this ruling.");
            }
            result = await contract.settle(vars.sightingId, onProgress);
            note =
              result.returned === "paid"
                ? "The reward was paid to the wallet in the observer's iNaturalist profile."
                : result.returned === "awaiting_wallet"
                  ? `The reward is held until ${c.collect_until}: once the observer adds a wallet to their iNaturalist profile, anyone can press Collect.`
                  : "Closed; nothing was reserved.";
            break;
          }
          case "collect": {
            const s = await contract.getSighting(vars.sightingId);
            callId = s.call_id;
            if (s.state !== "awaiting_wallet") refuse("Only a held reward can be collected.");
            result = await contract.collect(vars.sightingId, onProgress);
            note = "Paid to the wallet now in the observer's iNaturalist profile.";
            break;
          }
          case "close": {
            const c = await contract.getCall(vars.callId);
            if (c.state !== "open") refuse("This call is already closed.");
            if (todayUtc() <= c.collect_until) refuse(`Sightings can be submitted and rewards collected until ${c.collect_until}.`);
            if (wei(c.n_pending) > 0n) refuse("Settle the open sightings first.");
            result = await contract.close(vars.callId, onProgress);
            note = "The pot went back to the funders in proportion to what each put in.";
            break;
          }
        }
        updateTx(logId, { state: "accepted", txHash: result.txHash, status: result.status, executionResult: result.executionResult, progress: note });
        return { callId, sightingId, txHash: result.txHash, kind: vars.kind, note };
      } catch (err) {
        const e = classifyError(err, "send");
        if (contract) mergeFresh(qc, contract, "callId" in vars ? vars.callId : undefined, "sightingId" in vars ? vars.sightingId : undefined);
        updateTx(logId, {
          state: "failed",
          txHash: e.txHash,
          error: { kind: e.kind, message: e.message, hint: e.hint, detail: e.detail, phase: e.phase },
        });
        error(`${WRITE_LABEL[vars.kind]} failed`, { description: [e.message, e.hint].filter(Boolean).join(" "), duration: 12000 });
        throw err;
      } finally {
        setPending(null);
      }
    },
    onSuccess: ({ callId, sightingId, txHash, kind, note }) => {
      if (contract) mergeFresh(qc, contract, callId, sightingId);
      qc.invalidateQueries({ queryKey: ["genBalance"] });
      success(`${WRITE_LABEL[kind]} confirmed`, {
        description: `${note} Tx ${txHash.slice(0, 10)}... is ACCEPTED by validator consensus.`,
        duration: 10000,
      });
    },
  });

  return { write: mutation.mutate, writeAsync: mutation.mutateAsync, pending, isPending: mutation.isPending };
}
