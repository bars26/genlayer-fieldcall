"use client";

import { useState } from "react";
import { CalendarDays, Camera, Eye, Loader2, MapPin, ShieldCheck, Users } from "lucide-react";
import {
  formatGen,
  fundersOf,
  observationIdFrom,
  parseGen,
  placeUrl,
  rewardsLeft,
  taxonOf,
  taxonUrl,
  todayUtc,
  wei,
  type Call,
  type Sighting,
} from "@/lib/contracts/types";
import type { Observation } from "@/lib/inat";
import { useFieldCallWrite } from "@/lib/hooks/useFieldCall";
import { useWallet } from "@/lib/genlayer/wallet";
import { SightingCard } from "./SightingCard";
import { Button } from "./ui/button";

export function CallCard({ call, sightings, observations }: { call: Call; sightings: Sighting[]; observations: Record<string, Observation> }) {
  const { isConnected } = useWallet();
  const { writeAsync, pending } = useFieldCallWrite();
  const [obsInput, setObsInput] = useState("");
  const [fundInput, setFundInput] = useState("1");
  const taxon = taxonOf(call);
  const funded = wei(call.funded_total);
  const paid = wei(call.paid_total);
  const reserved = wei(call.reserved);
  const pot = wei(call.pot);
  const pct = (n: bigint) => (funded > 0n ? Number((n * 10000n) / funded) / 100 : 0);
  const today = todayUtc();
  const open = call.state === "open";
  const takesSightings = open && today <= call.collect_until;
  const takesFunding = open && today <= call.ends;
  const canClose = open && today > call.collect_until && wei(call.n_pending) === 0n;
  const obsId = observationIdFrom(obsInput);
  const fundWei = parseGen(fundInput);
  const funders = Object.keys(fundersOf(call)).length;
  const mine = sightings.filter((s) => s.call_id === call.id).sort((a, b) => Number(b.id.split("_")[1]) - Number(a.id.split("_")[1]));

  return (
    <section id={call.id} className="brand-card overflow-hidden animate-fade-in">
      <div className="grid sm:grid-cols-[1fr_auto] gap-4 p-5 sm:p-6 border-b border-border">
        <div className="min-w-0 space-y-2">
          <p className="label-tag">
            {call.id} · {open ? "open" : "closed"} · {funders} funder{funders === 1 ? "" : "s"}
          </p>
          <h3 className="display text-2xl sm:text-[28px] leading-tight">{call.title}</h3>
          <p className="text-[15px]">
            <a className="hover:underline" href={taxonUrl(call.taxon_id)} target="_blank" rel="noreferrer">
              <i>{taxon.name}</i>
              {taxon.common && <span className="text-muted-foreground"> · {taxon.common}</span>}
            </a>
            {taxon.rank && taxon.rank !== "species" && <span className="text-muted-foreground"> (any species in this {taxon.rank})</span>}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <a className="inline-flex items-center gap-1 hover:text-foreground" href={placeUrl(call.place_id)} target="_blank" rel="noreferrer">
              <MapPin className="h-3.5 w-3.5" /> {call.place_name}
            </a>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> seen {call.starts} to {call.ends}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> up to {String(call.per_observer)} per observer
            </span>
          </div>
        </div>
        <div className="sm:text-right space-y-1">
          <span className="tape inline-block text-sm font-semibold">{formatGen(call.reward, 4)} GEN per sighting</span>
          <p className="text-sm">
            <strong>{rewardsLeft(call)}</strong> reward{rewardsLeft(call) === 1 ? "" : "s"} left
          </p>
          <p className="text-xs text-muted-foreground">submissions until {call.collect_until}</p>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-[#E4EADD]" role="img" aria-label={`${formatGen(paid)} paid, ${formatGen(reserved)} reserved, ${formatGen(pot)} free`}>
            <div className="bg-[#3D7A4E]" style={{ width: `${pct(paid)}%` }} />
            <div className="bg-[#E8662C]" style={{ width: `${pct(reserved)}%` }} />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
            <span>
              <i className="inline-block h-2 w-2 rounded-full bg-[#3D7A4E] mr-1" />
              {formatGen(paid, 4)} GEN paid
            </span>
            <span>
              <i className="inline-block h-2 w-2 rounded-full bg-[#E8662C] mr-1" />
              {formatGen(reserved, 4)} reserved
            </span>
            <span>
              <i className="inline-block h-2 w-2 rounded-full bg-[#C9D4C1] mr-1" />
              {formatGen(pot, 4)} free of {formatGen(funded, 4)} funded
            </span>
            {wei(call.returned_total) > 0n && <span>{formatGen(call.returned_total, 4)} returned to funders</span>}
          </div>
        </div>

        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          <Term icon={<ShieldCheck className="h-4 w-4" />}>
            {call.research_only ? "Research grade only: the iNaturalist community agreed on the identification" : "Any quality grade"}
          </Term>
          <Term icon={<Camera className="h-4 w-4" />}>
            With a photo; wild, not captive{Number(call.max_accuracy_m) ? `; located to ${String(call.max_accuracy_m)} m or better` : ""}
          </Term>
          {Number(call.min_account_days) > 0 && (
            <Term icon={<Users className="h-4 w-4" />}>Observer&apos;s account at least {String(call.min_account_days)} days old at the sighting</Term>
          )}
          {call.condition && (
            <Term icon={<Eye className="h-4 w-4 text-[#E8662C]" />} strong>
              Validators look at the photos: “{call.condition}”
            </Term>
          )}
        </ul>

        <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
          <form
            className="space-y-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (obsId) writeAsync({ kind: "submit", callId: call.id, observationId: obsId }).then(() => setObsInput("")).catch(() => {});
            }}
          >
            <label className="label-tag" htmlFor={`obs-${call.id}`}>
              submit an iNaturalist observation
            </label>
            <div className="flex gap-2">
              <input
                id={`obs-${call.id}`}
                className="field h-9 flex-1 mono text-[13px]"
                placeholder="observation link or number"
                value={obsInput}
                onChange={(e) => setObsInput(e.target.value)}
                disabled={!takesSightings}
              />
              <Button type="submit" size="sm" className="h-9" disabled={!isConnected || !obsId || !takesSightings || pot < wei(call.reward) || !!pending}>
                {pending === `submit:${call.id}` && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Yours or anyone&apos;s: the reward always goes to the wallet in the observer&apos;s profile.</p>
          </form>
          <div className="flex gap-2 items-end md:pb-[22px]">
            {takesFunding && (
              <form
                className="flex gap-2 items-end"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (fundWei && fundWei > 0n) writeAsync({ kind: "fund", callId: call.id, value: fundWei }).catch(() => {});
                }}
              >
                <div className="space-y-1">
                  <label className="label-tag" htmlFor={`fund-${call.id}`}>
                    add GEN
                  </label>
                  <input id={`fund-${call.id}`} className="field h-9" style={{ width: 72 }} inputMode="decimal" value={fundInput} onChange={(e) => setFundInput(e.target.value)} />
                </div>
                <Button type="submit" size="sm" variant="outline" className="h-9" disabled={!isConnected || !fundWei || !!pending}>
                  {pending === `fund:${call.id}` && <Loader2 className="h-4 w-4 animate-spin" />}
                  Fund
                </Button>
              </form>
            )}
            {canClose && (
              <Button size="sm" variant="outline" className="h-9" disabled={!isConnected || !!pending} onClick={() => writeAsync({ kind: "close", callId: call.id }).catch(() => {})}>
                Close and return the pot
              </Button>
            )}
          </div>
        </div>
        {!takesSightings && open && <p className="text-xs text-muted-foreground">Submissions closed on {call.collect_until}; anyone can now close the call and return the pot.</p>}

        {mine.length > 0 && (
          <div className="space-y-2">
            <p className="label-tag">
              sightings · {mine.length} submitted · {String(call.n_paid)} paid
            </p>
            <div className="space-y-2">
              {mine.map((s) => (
                <SightingCard key={s.id} s={s} call={call} obs={observations[s.observation_id]} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Term({ icon, children, strong }: { icon: React.ReactNode; children: React.ReactNode; strong?: boolean }) {
  return (
    <li className={`flex items-start gap-2 rounded-lg px-3 py-2 ${strong ? "bg-[#FBE7DC]" : "bg-[#F1F4EC]"}`}>
      <span className="mt-0.5 text-[#1F3B2D]">{icon}</span>
      <span className={strong ? "font-medium" : ""}>{children}</span>
    </li>
  );
}
