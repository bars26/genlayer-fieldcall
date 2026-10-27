"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check as CheckIcon, Eye, Loader2, Search, Wallet, X } from "lucide-react";
import { obsUrl, observationIdFrom, peopleUrl, taxonOf, todayUtc, wei, type Call, type Sighting } from "@/lib/contracts/types";
import { checkAgainst, getObservation, getProfile, rewardText, type Check } from "@/lib/inat";
import { useFieldCallWrite } from "@/lib/hooks/useFieldCall";
import { useWallet } from "@/lib/genlayer/wallet";
import { Button } from "./ui/button";

const EXAMPLES = [
  { id: "397236824", label: "a hornet nest in Romsey" },
  { id: "397236834", label: "an adult hornet" },
  { id: "411158753", label: "a European hornet (lookalike)" },
];

export function CheckList({ checks }: { checks: Check[] }) {
  return (
    <ul className="space-y-1.5">
      {checks.map((c) => (
        <li key={c.key} className="flex items-start gap-2 text-sm">
          <span
            className={`mt-0.5 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full ${
              c.state === "ok" ? "bg-[#DCEBD9] text-[#22512F]" : c.state === "fail" ? "bg-[#F3DDD5] text-[#8E3322]" : "bg-[#EFE7CF] text-[#6F5A16]"
            }`}
          >
            {c.state === "ok" ? <CheckIcon className="h-3 w-3" /> : c.state === "fail" ? <X className="h-3 w-3" /> : c.key === "wallet" ? <Wallet className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </span>
          <span>
            <span className={c.state === "fail" ? "font-medium" : ""}>{c.label}</span>
            <span className="text-muted-foreground"> · {c.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Wallet-free first step: paste any iNaturalist observation and see which open calls it would earn. */
export function ObservationCheck({ calls, sightings }: { calls: Call[]; sightings: Sighting[] }) {
  const [input, setInput] = useState("");
  const [id, setId] = useState<string | null>(null);
  const { isConnected } = useWallet();
  const { writeAsync, pending } = useFieldCallWrite();

  const lookup = useQuery({
    queryKey: ["observation-check", id],
    enabled: !!id,
    staleTime: 60_000,
    queryFn: async () => {
      const o = await getObservation(id!);
      if (!o) return { o: null, profile: null };
      const profile = o.userId ? await getProfile(o.userId).catch(() => null) : null;
      return { o, profile };
    },
  });

  const open = calls.filter((c) => c.state === "open" && todayUtc() <= c.collect_until);
  const parsed = observationIdFrom(input);
  const run = (value: string) => {
    const got = observationIdFrom(value);
    setInput(value);
    if (got) setId(got);
  };
  const o = lookup.data?.o;
  const results = o
    ? open
        .map((c) => {
          const checks = checkAgainst(c, o, lookup.data?.profile ?? null);
          const prior = sightings.find((s) => s.call_id === c.id && s.observation_id === o.id && (s.state === "pending" || s.ruling === "ELIGIBLE"));
          return { c, checks, ok: !checks.some((k) => k.state === "fail"), prior };
        })
        .sort((a, b) => Number(b.ok) - Number(a.ok))
    : [];

  return (
    <div className="brand-card p-5 sm:p-6 topo">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="display text-2xl">Would my sighting qualify?</h2>
        <span className="label-tag">no wallet needed</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">Paste an iNaturalist observation. We run the same checks as the contract against every open call.</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
      >
        <input
          className="field h-10 flex-1 mono text-[13px]"
          placeholder="https://www.inaturalist.org/observations/397236824"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="iNaturalist observation link or number"
        />
        <Button type="submit" disabled={!parsed || lookup.isFetching} className="h-10">
          {lookup.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Check
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        Try:{" "}
        {EXAMPLES.map((e, i) => (
          <span key={e.id}>
            <button type="button" className="underline decoration-dotted hover:text-foreground" onClick={() => run(e.id)}>
              {e.label}
            </button>
            {i < EXAMPLES.length - 1 ? " · " : ""}
          </span>
        ))}
      </p>

      {lookup.isError && <p className="mt-3 text-sm text-destructive">iNaturalist could not be read right now. Try again in a moment.</p>}
      {id && lookup.data && !o && <p className="mt-3 text-sm text-destructive">iNaturalist has no observation {id}.</p>}

      {o && (
        <div className="mt-4 grid gap-4 sm:grid-cols-[150px_1fr] animate-fade-in">
          <a href={obsUrl(o.id)} target="_blank" rel="noreferrer" className="print block self-start">
            {o.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.photos[0].url} alt={o.taxonName} className="aspect-square w-full object-cover rounded-[2px]" />
            ) : (
              <div className="aspect-square w-full bg-muted" />
            )}
            <p className="mt-1 text-[10px] leading-tight text-muted-foreground truncate" title={o.photos[0]?.attribution}>
              {o.photos[0]?.attribution || "no photo"}
            </p>
          </a>
          <div className="min-w-0 space-y-3">
            <div>
              <p className="label-tag">observation {o.id}</p>
              <p className="display text-xl leading-tight">
                <i>{o.taxonName}</i> {o.common && <span className="text-muted-foreground not-italic text-base">· {o.common}</span>}
              </p>
              <p className="text-sm text-muted-foreground">
                {o.observedOn} · {o.placeGuess || "unknown place"} · by{" "}
                <a className="underline" href={peopleUrl(o.login)} target="_blank" rel="noreferrer">
                  {o.login}
                </a>{" "}
                · {o.quality.replace("_", " ")}
                {o.annotations.length > 0 && <> · {o.annotations.join(", ")}</>}
              </p>
            </div>
            {open.length === 0 && <p className="text-sm text-muted-foreground">There is no open call right now.</p>}
            {results.map(({ c, checks, ok, prior }) => (
              <div key={c.id} className="rounded-lg border border-border bg-white/70 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">
                    <span className="label-tag mr-1">{c.id}</span> <strong>{c.title}</strong>
                  </p>
                  <span className={ok ? "chip-ok" : "chip-no"}>{ok ? `would earn ${rewardText(c)}` : "would not qualify"}</span>
                </div>
                <CheckList checks={checks} />
                {ok && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {prior ? (
                      <span className="text-xs text-muted-foreground">Already submitted to this call as {prior.id}.</span>
                    ) : wei(c.pot) < wei(c.reward) ? (
                      <span className="text-xs text-muted-foreground">This call&apos;s pot is empty.</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="gradient"
                        disabled={!isConnected || !!pending}
                        onClick={() => writeAsync({ kind: "submit", callId: c.id, observationId: o.id }).catch(() => {})}
                      >
                        {pending === `submit:${c.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isConnected ? `Submit to ${c.id}` : "Connect a wallet to submit"}
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {taxonOf(c).name} · anyone can submit; the reward goes to the observer.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
