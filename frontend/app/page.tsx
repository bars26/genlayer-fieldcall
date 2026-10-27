"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Binoculars, Coins, Eye, Loader2, Megaphone, RefreshCw } from "lucide-react";
import { CallCard } from "@/components/CallCard";
import { CreateCallModal } from "@/components/CreateCallModal";
import { Navbar } from "@/components/Navbar";
import { ObservationCheck } from "@/components/ObservationCheck";
import { TransactionPanel } from "@/components/TransactionPanel";
import { Button } from "@/components/ui/button";
import { formatGen, wei } from "@/lib/contracts/types";
import { getObservations } from "@/lib/inat";
import { useRegistry } from "@/lib/hooks/useFieldCall";

const STEPS = [
  { icon: Megaphone, title: "A call goes out", body: "A conservation group funds a call: this species, in this place, between these dates, so much GEN per sighting." },
  { icon: Binoculars, title: "Naturalists observe", body: "People post photos on iNaturalist as they always do. The community identifies them; the observer adds a wallet to their profile." },
  { icon: Eye, title: "Validators check", body: "Anyone submits an observation. Validators read iNaturalist in code, and look at the photos when the call asks for something specific." },
  { icon: Coins, title: "The observer is paid", body: "A qualifying sighting pays the wallet in the observer's profile, once. No wallet yet? The reward is held for them." },
];

export default function HomePage() {
  const { calls, sightings, isLoading, isError, error, isFetching, refetch, fetchedAt } = useRegistry();
  const [creating, setCreating] = useState(false);
  const ordered = [...calls].sort((a, b) => Number(b.id.split("_")[1]) - Number(a.id.split("_")[1]));
  const openPots = calls.filter((c) => c.state === "open").reduce((t, c) => t + wei(c.pot) + wei(c.reserved), 0n);
  const paid = calls.reduce((t, c) => t + wei(c.paid_total), 0n);
  const qualified = sightings.filter((s) => s.ruling === "ELIGIBLE").length;
  const ids = sightings.map((s) => s.observation_id);
  const observations = useQuery({
    queryKey: ["observations", ids.join(",")],
    enabled: ids.length > 0,
    staleTime: 300_000,
    queryFn: () => getObservations(ids),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onCreate={() => setCreating(true)} />
      <main className="flex-grow pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4 lg:pt-4">
              <p className="label-tag text-[#C4521F]">bounties for wildlife records</p>
              <h1 className="display text-5xl md:text-[64px] leading-[0.98] font-semibold">
                Get paid for
                <br />
                the sighting
                <br />
                that matters.
              </h1>
              <p className="text-lg text-muted-foreground">
                An invasive hornet nest, a rare orchid, a hedgehog in a new street. FieldCall lets anyone fund a call for exactly that record, and pays the
                naturalist who posts it on iNaturalist. GenLayer validators check every sighting, and look at the photos when the call asks.
              </p>
              <dl className="flex gap-8 pt-1">
                <div>
                  <dt className="label-tag">GEN in open calls</dt>
                  <dd className="display text-3xl">{formatGen(openPots, 2)}</dd>
                </div>
                <div>
                  <dt className="label-tag">sightings qualified</dt>
                  <dd className="display text-3xl">{qualified}</dd>
                </div>
                <div>
                  <dt className="label-tag">GEN paid out</dt>
                  <dd className="display text-3xl">{formatGen(paid, 2)}</dd>
                </div>
              </dl>
            </div>
            <div className="lg:col-span-7">
              <ObservationCheck calls={calls} sightings={sightings} />
            </div>
          </section>

          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-xl border border-border bg-[#F6F8F2] p-4">
                <p className="flex items-center gap-2">
                  <span className="label-tag">0{i + 1}</span>
                  <s.icon className="h-4 w-4 text-[#C4521F]" />
                  <strong className="display text-lg">{s.title}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">{s.body}</p>
              </div>
            ))}
          </section>
          <p className="text-xs text-muted-foreground -mt-6">
            Checking needs no wallet. To fund or submit, connect MetaMask and press Test GEN for free GenLayer Studio tokens. The calls below are demo calls
            funded by test wallets; the observations are real iNaturalist records, and their observers are only paid if they link a wallet.
          </p>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex items-end justify-between gap-3">
                <h2 className="display text-3xl">Calls</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {fetchedAt && <span>updated {new Date(fetchedAt).toLocaleTimeString()}</span>}
                  <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
                    <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
              {isLoading && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading the calls from GenLayer Studio…
                </p>
              )}
              {isError && <p className="text-destructive text-sm">Could not read the contract: {error?.message}</p>}
              {!isLoading && ordered.length === 0 && (
                <div className="brand-card p-6 text-center space-y-3">
                  <p className="text-muted-foreground">No calls yet.</p>
                  <Button onClick={() => setCreating(true)}>Open the first call</Button>
                </div>
              )}
              {ordered.map((c) => (
                <CallCard key={c.id} call={c} sightings={sightings} observations={observations.data ?? {}} />
              ))}
            </div>
            <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
              <div className="brand-card p-5 space-y-3 text-sm">
                <h3 className="display text-xl">How a sighting is ruled</h3>
                <p>
                  <strong>Read in code.</strong> Every validator reads the observation and the observer&apos;s public profile on iNaturalist: the
                  community identification (any species under the call&apos;s taxon), quality grade, captive flag, date, the places it falls inside,
                  location accuracy, account age.
                </p>
                <p>
                  <strong>Looked at, when asked.</strong> If the call has a photo condition, each validator looks at up to three photos, one at a time,
                  and answers MEETS, NOT_MEETS or UNCLEAR. They must agree. They never re-identify the species.
                </p>
                <p>
                  <strong>Paid to the observer.</strong> The reward goes to the 0x address in the observer&apos;s iNaturalist profile, which only they can
                  edit. Anyone can submit; nobody can redirect the money. One payout per observation, a per-observer cap, and funders are never paid by
                  their own call.
                </p>
                <p>
                  <strong>Ten minutes to answer.</strong> Funders can ask once for a fresh reading of a qualifying sighting (an identification may change);
                  the submitter or observer once for one that was refused. Outages decide nothing.
                </p>
              </div>
              <TransactionPanel />
            </aside>
          </section>
        </div>
      </main>
      <footer className="border-t border-border py-6 px-4 text-center text-xs text-muted-foreground space-y-1">
        <p>
          FieldCall on GenLayer Studio · observations and photos from{" "}
          <a className="underline" href="https://www.inaturalist.org" target="_blank" rel="noreferrer">
            iNaturalist
          </a>
          , shown with their authors&apos; attribution and licences.
        </p>
        <p>
          <a className="underline" href="https://github.com/bars26/genlayer-fieldcall" target="_blank" rel="noreferrer">
            Source and reproduction on GitHub
          </a>
        </p>
      </footer>
      <CreateCallModal open={creating} onOpenChange={setCreating} />
    </div>
  );
}
