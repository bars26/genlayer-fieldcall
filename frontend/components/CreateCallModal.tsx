"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { MIN_REWARD_WEI, PRESETS, addDays, formatGen, parseGen, todayUtc } from "@/lib/contracts/types";
import { searchPlaces, searchTaxa } from "@/lib/inat";
import { useFieldCallWrite } from "@/lib/hooks/useFieldCall";
import { useWallet } from "@/lib/genlayer/wallet";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Pick = { id: string; label: string };

function useDebounced(value: string, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Picker({
  label,
  value,
  onPick,
  search,
  placeholder,
}: {
  label: string;
  value: Pick | null;
  onPick: (p: Pick) => void;
  search: (q: string) => Promise<Pick[]>;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const debounced = useDebounced(q);
  const hits = useQuery({ queryKey: ["picker", label, debounced], enabled: debounced.trim().length >= 2, queryFn: () => search(debounced), staleTime: 300_000 });
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {value && (
        <p className="text-sm">
          <span className="chip-ok mr-2">{value.label}</span>
          <span className="label-tag">id {value.id}</span>
        </p>
      )}
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      {hits.data && hits.data.length > 0 && q.trim().length >= 2 && (
        <ul className="rounded-md border border-border bg-white text-sm max-h-44 overflow-auto">
          {hits.data.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 hover:bg-[#F1F4EC]"
                onClick={() => {
                  onPick(h);
                  setQ("");
                }}
              >
                {h.label} <span className="label-tag">· {h.id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Open a call: pick a taxon and a place on iNaturalist, set the terms, fund the pot. */
export function CreateCallModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { isConnected } = useWallet();
  const { writeAsync, pending } = useFieldCallWrite();
  const first = PRESETS[0];
  const [taxon, setTaxon] = useState<Pick | null>({ id: first.taxonId, label: first.taxon });
  const [place, setPlace] = useState<Pick | null>({ id: first.placeId, label: first.place });
  const [f, setF] = useState({
    title: first.label,
    starts: "2026-08-01",
    ends: addDays(todayUtc(), 60),
    reward: "0.5",
    fund: "2",
    perObserver: "2",
    researchOnly: true,
    minAccountDays: "30",
    maxAccuracy: "100",
    condition: first.condition,
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const reward = parseGen(f.reward);
  const fund = parseGen(f.fund);
  const rewards = reward && fund && reward > 0n ? Number(fund / reward) : 0;
  const days = (Date.parse(`${f.ends}T00:00:00Z`) - Date.parse(`${f.starts}T00:00:00Z`)) / 86_400_000;
  const problems = [
    !(f.title.trim().length >= 3 && f.title.trim().length <= 80) && "Give the call a title (3 to 80 characters).",
    !taxon && "Pick what to look for.",
    !place && "Pick where.",
    !(f.starts && f.ends && f.ends >= f.starts && f.ends >= todayUtc()) && "The end date must be after the start, and not in the past.",
    days > 366 && "A call covers at most 366 days of sightings.",
    !(reward && reward >= MIN_REWARD_WEI) && "The reward must be at least 0.1 GEN.",
    !(fund && reward && fund >= reward) && "Fund the call with at least one reward.",
    !(/^\d+$/.test(f.perObserver) && +f.perObserver >= 1 && +f.perObserver <= 50) && "Per observer: 1 to 50.",
    !(/^\d+$/.test(f.minAccountDays) && +f.minAccountDays <= 3650) && "Account age: 0 to 3650 days.",
    !(/^\d+$/.test(f.maxAccuracy) && +f.maxAccuracy <= 100000) && "Accuracy: 0 (any) to 100000 metres.",
    f.condition.length > 200 && "The photo condition is at most 200 characters.",
  ].filter(Boolean) as string[];

  const submit = async () => {
    if (!taxon || !place || !reward || !fund) return;
    try {
      await writeAsync({
        kind: "create",
        input: {
          title: f.title.trim(),
          taxonId: taxon.id,
          placeId: place.id,
          starts: f.starts,
          ends: f.ends,
          reward,
          perObserver: +f.perObserver,
          researchOnly: f.researchOnly,
          minAccountDays: +f.minAccountDays,
          maxAccuracyM: +f.maxAccuracy,
          condition: f.condition.trim(),
        },
        fund,
      });
      onOpenChange(false);
    } catch {
      // shown in the toast and the transactions panel
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display text-2xl">Open a call for sightings</DialogTitle>
          <DialogDescription>
            Every iNaturalist observation that meets your terms earns its observer the reward, paid to the wallet in their iNaturalist profile.
            Validators read the taxon and place now, and each observation when it is submitted. What is left when the call closes comes back to the
            funders.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              title={p.why}
              className="rounded-full border border-border bg-white px-3 py-1 text-xs hover:border-[#1F3B2D]"
              onClick={() => {
                setTaxon({ id: p.taxonId, label: p.taxon });
                setPlace({ id: p.placeId, label: p.place });
                setF({ ...f, title: p.label, condition: p.condition });
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={f.title} onChange={set("title")} maxLength={80} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Picker
              label="Look for (species, genus, family...)"
              value={taxon}
              onPick={setTaxon}
              placeholder="search iNaturalist, e.g. Vespa velutina"
              search={async (q) => (await searchTaxa(q)).map((t) => ({ id: t.id, label: `${t.name}${t.common ? ` · ${t.common}` : ""}${t.rank !== "species" ? ` (${t.rank})` : ""}` }))}
            />
            <Picker
              label="Where"
              value={place}
              onPick={setPlace}
              placeholder="search iNaturalist places, e.g. Jersey"
              search={async (q) => (await searchPlaces(q)).map((p) => ({ id: p.id, label: p.name }))}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Seen from</Label>
              <Input type="date" value={f.starts} onChange={set("starts")} />
            </div>
            <div className="space-y-1">
              <Label>Seen until</Label>
              <Input type="date" value={f.ends} onChange={set("ends")} />
            </div>
            <div className="space-y-1">
              <Label>Reward (GEN)</Label>
              <Input value={f.reward} onChange={set("reward")} inputMode="decimal" />
            </div>
            <div className="space-y-1">
              <Label>Fund now (GEN)</Label>
              <Input value={f.fund} onChange={set("fund")} inputMode="decimal" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Per observer</Label>
              <Input value={f.perObserver} onChange={set("perObserver")} inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label>Account age (days)</Label>
              <Input value={f.minAccountDays} onChange={set("minAccountDays")} inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label>Accuracy (m, 0 = any)</Label>
              <Input value={f.maxAccuracy} onChange={set("maxAccuracy")} inputMode="numeric" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.researchOnly} onChange={set("researchOnly")} className="h-4 w-4 accent-[#1F3B2D]" />
            Research grade only (the iNaturalist community agreed on the identification)
          </label>
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-[#E8662C]" /> Photo condition (optional): validators look at the photos
            </Label>
            <Input value={f.condition} onChange={set("condition")} maxLength={200} placeholder="e.g. The photo shows a hornet nest" />
            <p className="text-[11px] text-muted-foreground">
              Up to three photos are looked at, one by one; the first that clearly shows it qualifies the sighting. Leave empty to pay for any qualifying
              sighting.
            </p>
          </div>
          <p className="text-sm rounded-lg bg-[#F1F4EC] p-3">
            Pays up to <strong>{rewards}</strong> sighting{rewards === 1 ? "" : "s"} of {reward ? formatGen(reward, 4) : "?"} GEN. Submissions and
            collection stay open until <strong>{f.ends ? addDays(f.ends, 30) : "?"}</strong> (30 days after the last day, for identifications to settle);
            then anyone can close the call and the rest returns to the funders.
          </p>
          {problems.length > 0 && (
            <ul className="text-sm text-destructive list-disc pl-5">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <Button className="w-full" onClick={submit} disabled={!isConnected || problems.length > 0 || pending === "create"}>
            {pending === "create" && <Loader2 className="h-4 w-4 animate-spin" />}
            {isConnected ? `Fund ${fund ? formatGen(fund, 4) : "?"} GEN and open the call` : "Connect a wallet to open a call"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
