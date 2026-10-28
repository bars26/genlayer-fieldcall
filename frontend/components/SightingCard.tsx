"use client";

import { Loader2 } from "lucide-react";
import {
  CODE_LABEL,
  OUTCOME_TEXT,
  RULING_STYLE,
  evidenceOf,
  factsOf,
  formatGen,
  isExpired,
  isFunder,
  isZero,
  obsUrl,
  peopleUrl,
  sameAddress,
  timelineOf,
  windowLeftSeconds,
  type Call,
  type Sighting,
} from "@/lib/contracts/types";
import type { Observation } from "@/lib/inat";
import { useFieldCallWrite } from "@/lib/hooks/useFieldCall";
import { useNow } from "@/lib/hooks/useNow";
import { useWallet } from "@/lib/genlayer/wallet";
import { Button } from "./ui/button";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function SightingCard({ s, call, obs }: { s: Sighting; call: Call; obs?: Observation }) {
  const now = useNow(5_000);
  const { address, isConnected } = useWallet();
  const { writeAsync, pending } = useFieldCallWrite();
  const facts = factsOf(s);
  const packets = evidenceOf(s);
  const timeline = timelineOf(s);
  const style = RULING_STYLE[s.ruling] ?? RULING_STYLE.UNCLEAR;
  const left = windowLeftSeconds(s, now);
  const funder = isFunder(call, address);
  const mineToAnswer = sameAddress(s.submitter, address) || sameAddress(facts.wallet, address);
  const canContest =
    isConnected && s.state === "pending" && left > 0 && (s.ruling === "ELIGIBLE" ? funder && !s.funders_contested : mineToAnswer && !s.submitter_contested);
  const canSettle = isConnected && s.state === "pending" && (left === 0 || (s.ruling === "ELIGIBLE" ? funder : sameAddress(s.submitter, address)));
  const busy = (k: string) => pending === `${k}:${s.id}`;
  const expired = isExpired(s, call);
  const held = s.state === "awaiting_wallet" && !expired;
  const lastLook = [...packets].reverse().find((p) => p.photos?.length)?.photos ?? [];
  const photo = obs?.photos[0];

  return (
    <article className="rounded-xl border border-border bg-white/80 p-3 sm:p-4 flex gap-3 sm:gap-4">
      <a href={obsUrl(s.observation_id)} target="_blank" rel="noreferrer" className="print block w-24 sm:w-28 shrink-0 self-start" title={photo?.attribution}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url} alt={facts.taxon_name || "observation photo"} className="aspect-square w-full object-cover rounded-[2px]" loading="lazy" />
        ) : (
          <div className="aspect-square w-full bg-muted rounded-[2px]" />
        )}
        <p className="mt-1 text-[9px] leading-tight text-muted-foreground truncate">{photo?.attribution || `obs ${s.observation_id}`}</p>
      </a>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={style.cls}>{style.label}</span>
          <span className="text-xs text-muted-foreground">{CODE_LABEL[s.code] ?? s.code}</span>
          <span className="label-tag ml-auto">{s.id}</span>
        </div>
        <p className="text-sm leading-snug">
          <a className="font-medium underline decoration-dotted" href={obsUrl(s.observation_id)} target="_blank" rel="noreferrer">
            Observation {s.observation_id}
          </a>{" "}
          {facts.taxon_name && (
            <>
              · <i>{facts.taxon_name}</i>
            </>
          )}{" "}
          {facts.observed_on && <>· {facts.observed_on}</>}{" "}
          {s.observer_login && (
            <>
              · by{" "}
              <a className="underline" href={peopleUrl(s.observer_login)} target="_blank" rel="noreferrer">
                {s.observer_login}
              </a>
            </>
          )}
        </p>
        <p className="text-sm text-muted-foreground leading-snug">{s.why}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {s.ruling === "ELIGIBLE" && wei0(s) && (
            <span className="tape text-[11px] font-semibold">
              {formatGen(s.reward, 4)} GEN {s.outcome === "paid" ? "paid" : expired ? "returned to the funders" : "reserved"}
            </span>
          )}
          {s.outcome && <span className="font-medium">{expired ? "Expired: nobody collected it before the call closed" : OUTCOME_TEXT[s.outcome] ?? s.outcome}</span>}
          {!isZero(s.payee) && <span className="mono">to {short(s.payee)}</span>}
          {s.state === "pending" && (
            <span className="text-muted-foreground">
              {left > 0 ? `window ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} left` : "window closed: anyone can settle"}
            </span>
          )}
        </div>

        {(canContest || canSettle || held) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {canSettle && (
              <Button size="sm" variant="gradient" disabled={!!pending} onClick={() => writeAsync({ kind: "settle", sightingId: s.id }).catch(() => {})}>
                {busy("settle") && <Loader2 className="h-4 w-4 animate-spin" />}
                {left > 0 ? (s.ruling === "ELIGIBLE" ? "Pay now" : "Accept the ruling") : "Settle"}
              </Button>
            )}
            {canContest && (
              <Button size="sm" variant="outline" disabled={!!pending} onClick={() => writeAsync({ kind: "contest", sightingId: s.id }).catch(() => {})}>
                {busy("contest") && <Loader2 className="h-4 w-4 animate-spin" />}
                Ask for a fresh reading
              </Button>
            )}
            {held && (
              <Button size="sm" variant="outline" disabled={!isConnected || !!pending} onClick={() => writeAsync({ kind: "collect", sightingId: s.id }).catch(() => {})}>
                {busy("collect") && <Loader2 className="h-4 w-4 animate-spin" />}
                Collect for {s.observer_login || "the observer"}
              </Button>
            )}
          </div>
        )}
        {held && (
          <p className="text-xs text-muted-foreground">
            Held until {call.collect_until}. {s.observer_login || "The observer"} adds a 0x wallet address to their iNaturalist profile, then anyone presses
            Collect and validators read the profile again.
          </p>
        )}

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">What the validators read</summary>
          <div className="mt-2 space-y-2">
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
              <Fact k="Identified as" v={facts.taxon_name ? `${facts.taxon_name}${facts.taxon_common ? ` (${facts.taxon_common})` : ""}` : "—"} />
              <Fact k="Quality grade" v={facts.quality?.replace("_", " ") || "—"} />
              <Fact k="Seen on" v={facts.observed_on || "—"} />
              <Fact k="Where" v={facts.place_guess || "—"} />
              <Fact k="Inside the area" v={facts.in_place === undefined ? "—" : facts.in_place ? "yes" : "no"} />
              <Fact k="Accuracy" v={facts.accuracy_m == null ? "not recorded" : `${facts.accuracy_m} m`} />
              <Fact k="Observer since" v={facts.observer_since || "—"} />
              <Fact k="Wallet in profile" v={facts.wallet ? short(facts.wallet) : "none"} />
              <Fact k="Annotations" v={facts.annotations?.length ? facts.annotations.join(", ") : "none"} />
            </dl>
            {lastLook.length > 0 && (
              <div>
                <p className="label-tag mb-1">photos the validators looked at</p>
                <div className="flex flex-wrap gap-2">
                  {lastLook.map((p) => (
                    <a key={p.sha256} href={p.url} target="_blank" rel="noreferrer" className="block w-20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="aspect-square w-full object-cover rounded" loading="lazy" />
                      <span className={`mt-1 block text-center text-[10px] font-semibold ${p.answer === "MEETS" ? "text-[#22512F]" : p.answer === "NOT_MEETS" ? "text-[#8E3322]" : "text-[#6F5A16]"}`}>
                        {p.answer.replace("_", " ")}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="label-tag mb-1">evidence packets (one per reading, stored on-chain)</p>
              {packets.map((p, i) => (
                <p key={p.packet_sha256 ?? i} className="mono text-[11px] text-muted-foreground break-all">
                  #{i + 1} {p.read_at} UTC · {p.ruling} · packet {p.packet_sha256?.slice(0, 16)}… · facts {p.facts_sha256?.slice(0, 12)}…
                  {p.profile_bio_sha256 && <> · profile {p.profile_bio_sha256.slice(0, 12)}…</>}
                  {facts.gbif && i === 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <a className="underline" href={facts.gbif} target="_blank" rel="noreferrer">
                        GBIF copy
                      </a>
                    </>
                  )}
                </p>
              ))}
            </div>
            <ol className="space-y-0.5">
              {timeline.map((t, i) => (
                <li key={i} className="text-muted-foreground">
                  <span className="mono">{t.at.slice(5, 16).replace("T", " ")}</span> {t.event.replace("_", " ")}
                  {t.ruling && <> → {t.ruling}</>}
                  {t.by && <> by {t.by}</>}
                  {t.amount && <> · {formatGen(t.amount, 4)} GEN</>}
                  {t.to && <> to {short(t.to)}</>}
                </li>
              ))}
            </ol>
          </div>
        </details>
      </div>
    </article>
  );
}

function wei0(s: Sighting) {
  try {
    return BigInt(String(s.reward)) > 0n;
  } catch {
    return false;
  }
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate" title={v}>
        {v}
      </dd>
    </div>
  );
}
