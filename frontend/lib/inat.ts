/**
 * Browser-side reads of iNaturalist's public API (it allows cross-origin requests), and a
 * wallet-free preview that applies the same checks, in the same order, as the contract's
 * `_assess`. The photo condition is the one thing it cannot preview: validators look at the photos.
 */
import type { Call } from "./contracts/types";
import { taxonOf, wei } from "./contracts/types";

const API = "https://api.inaturalist.org";
const WALLET = /0x[0-9a-fA-F]{40}/g;

export interface Photo {
  url: string;
  attribution: string;
  license: string;
}

export interface Observation {
  id: string;
  taxonId: string;
  taxonName: string;
  common: string;
  lineage: string[];
  quality: string;
  captive: boolean;
  observedOn: string;
  placeGuess: string;
  placeIds: string[];
  accuracy: number | null;
  geoprivacy: string;
  userId: string;
  login: string;
  userSince: string;
  photos: Photo[];
  annotations: string[];
}

export interface Profile {
  login: string;
  since: string;
  wallet: string;
}

export interface Check {
  key: string;
  label: string;
  state: "ok" | "fail" | "later";
  detail: string;
}

const TERMS: Record<number, string> = {
  1: "Life Stage", 9: "Sex", 17: "Alive or Dead", 22: "Evidence of Presence", 33: "Established",
  2: "Adult", 3: "Teneral", 4: "Pupa", 5: "Nymph", 6: "Larva", 7: "Egg", 8: "Juvenile", 16: "Subimago",
  10: "Female", 11: "Male", 18: "Alive", 19: "Dead", 20: "Cannot Be Determined", 23: "Feather", 24: "Organism",
  25: "Scat", 26: "Track", 27: "Bone", 28: "Molt", 29: "Gall", 30: "Egg", 31: "Hair", 32: "Leafmine",
  35: "Construction", 34: "Not Established",
};

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`iNaturalist answered ${res.status}`);
  return res.json();
}

function toObservation(o: any): Observation {
  const taxon = o?.taxon ?? {};
  const user = o?.user ?? {};
  return {
    id: String(o.id),
    taxonId: String(taxon.id ?? ""),
    taxonName: String(taxon.name ?? ""),
    common: String(taxon.preferred_common_name ?? ""),
    lineage: [...(taxon.ancestor_ids ?? []), taxon.id].filter(Boolean).map(String),
    quality: String(o.quality_grade ?? ""),
    captive: !!o.captive,
    observedOn: String(o.observed_on ?? "").slice(0, 10),
    placeGuess: String(o.place_guess ?? ""),
    placeIds: (o.place_ids ?? []).map(String),
    accuracy: typeof o.positional_accuracy === "number" ? Math.round(o.positional_accuracy) : null,
    geoprivacy: String(o.geoprivacy ?? "open"),
    userId: String(user.id ?? ""),
    login: String(user.login ?? ""),
    userSince: String(user.created_at ?? "").slice(0, 10),
    photos: (o.photos ?? [])
      .filter((p: any) => p?.url)
      .map((p: any) => ({ url: String(p.url).replace("/square.", "/medium."), attribution: String(p.attribution ?? ""), license: String(p.license_code ?? "") })),
    annotations: (o.annotations ?? []).map(
      (a: any) => `${TERMS[a.controlled_attribute_id] ?? "?"}: ${TERMS[a.controlled_value_id] ?? "?"}`
    ),
  };
}

export async function getObservation(id: string): Promise<Observation | null> {
  const body = await getJson(`${API}/v1/observations/${id}`);
  const o = body?.results?.[0];
  return o ? toObservation(o) : null;
}

/** Many observations in one request (for sighting cards). */
export async function getObservations(ids: string[]): Promise<Record<string, Observation>> {
  const out: Record<string, Observation> = {};
  const unique = Array.from(new Set(ids)).filter((i) => /^\d+$/.test(i));
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const body = await getJson(`${API}/v1/observations?id=${chunk.join(",")}&per_page=50`);
    for (const o of body?.results ?? []) out[String(o.id)] = toObservation(o);
  }
  return out;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const body = await getJson(`${API}/v2/users/${userId}?fields=description,login,created_at`);
  const u = body?.results?.[0];
  if (!u) return null;
  const wallet = (String(u.description ?? "").match(WALLET) ?? []).find((m) => BigInt(m) !== 0n) ?? "";
  return { login: String(u.login ?? ""), since: String(u.created_at ?? "").slice(0, 10), wallet };
}

export interface TaxonHit {
  id: string;
  name: string;
  common: string;
  rank: string;
  photo: string;
}

export async function searchTaxa(q: string): Promise<TaxonHit[]> {
  if (q.trim().length < 2) return [];
  const body = await getJson(`${API}/v1/taxa/autocomplete?q=${encodeURIComponent(q.trim())}&per_page=6`);
  return (body?.results ?? []).map((t: any) => ({
    id: String(t.id),
    name: String(t.name ?? ""),
    common: String(t.preferred_common_name ?? ""),
    rank: String(t.rank ?? ""),
    photo: String(t.default_photo?.square_url ?? ""),
  }));
}

export interface PlaceHit {
  id: string;
  name: string;
}

export async function searchPlaces(q: string): Promise<PlaceHit[]> {
  if (q.trim().length < 2) return [];
  const body = await getJson(`${API}/v1/places/autocomplete?q=${encodeURIComponent(q.trim())}&per_page=6`);
  return (body?.results ?? []).map((p: any) => ({ id: String(p.id), name: String(p.display_name ?? p.name ?? "") }));
}

const daysBetween = (a: string, b: string) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000;

/** The contract's checks, in its order, for one observation against one call. */
export function checkAgainst(call: Call, o: Observation, profile: Profile | null): Check[] {
  const taxon = taxonOf(call);
  const maxAcc = Number(call.max_accuracy_m);
  const minDays = Number(call.min_account_days);
  const since = profile?.since || o.userSince;
  const checks: Check[] = [
    { key: "photo", label: "Has a photo", state: o.photos.length ? "ok" : "fail", detail: `${o.photos.length} photo${o.photos.length === 1 ? "" : "s"}` },
    {
      key: "taxon",
      label: `Is ${taxon.common || taxon.name}`,
      state: o.lineage.includes(call.taxon_id) ? "ok" : "fail",
      detail: `identified as ${o.taxonName}${o.common ? ` (${o.common})` : ""}`,
    },
    {
      key: "grade",
      label: call.research_only ? "Research grade" : "Any quality grade",
      state: !call.research_only || o.quality === "research" ? "ok" : "fail",
      detail: o.quality.replace("_", " ") || "unknown",
    },
    { key: "wild", label: "Wild, not captive", state: o.captive ? "fail" : "ok", detail: o.captive ? "marked captive or cultivated" : "wild" },
    {
      key: "dates",
      label: `Seen ${call.starts} to ${call.ends}`,
      state: o.observedOn && call.starts <= o.observedOn && o.observedOn <= call.ends ? "ok" : "fail",
      detail: o.observedOn || "no date",
    },
    {
      key: "place",
      label: `Inside ${call.place_name}`,
      state: o.geoprivacy !== "private" && o.placeIds.includes(call.place_id) ? "ok" : "fail",
      detail: o.geoprivacy === "private" ? "location hidden" : o.placeGuess || "unknown place",
    },
  ];
  if (maxAcc)
    checks.push({
      key: "accuracy",
      label: `Located to ${maxAcc} m or better`,
      state: o.accuracy !== null && o.accuracy <= maxAcc ? "ok" : "fail",
      detail: o.accuracy === null ? "no accuracy recorded" : `${o.accuracy} m`,
    });
  if (minDays)
    checks.push({
      key: "account",
      label: `Account ${minDays}+ days old at the sighting`,
      state: since && o.observedOn && daysBetween(since, o.observedOn) >= minDays ? "ok" : "fail",
      detail: since ? `joined ${since}` : "unknown",
    });
  if (call.condition)
    checks.push({ key: "condition", label: call.condition, state: "later", detail: "validators look at up to 3 photos when it is submitted" });
  checks.push({
    key: "wallet",
    label: "Wallet in the observer's profile",
    state: profile?.wallet ? "ok" : "later",
    detail: profile?.wallet ? `pays ${profile.wallet.slice(0, 6)}…${profile.wallet.slice(-4)}` : "none yet: the reward is held until they add one",
  });
  return checks;
}

export const rewardText = (call: Call) => `${(Number(wei(call.reward)) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 4 })} GEN`;
