/** Types and display helpers for the FieldCall contract. */

export type Ruling = "ELIGIBLE" | "INELIGIBLE" | "UNCLEAR";
type Num = string | number | bigint;

export interface Call {
  id: string;
  sponsor: string;
  title: string;
  taxon_id: string;
  taxon_json: string;
  place_id: string;
  place_name: string;
  starts: string;
  ends: string;
  collect_until: string;
  reward: Num;
  per_observer: Num;
  research_only: boolean;
  min_account_days: Num;
  max_accuracy_m: Num;
  condition: string;
  state: "open" | "closed";
  pot: Num;
  reserved: Num;
  funded_total: Num;
  paid_total: Num;
  returned_total: Num;
  funders_json: string;
  observers_json: string;
  sighting_ids_json: string;
  n_eligible: Num;
  n_paid: Num;
  n_pending: Num;
  created_at: string;
  history_json: string;
}

export interface Sighting {
  id: string;
  call_id: string;
  observation_id: string;
  submitter: string;
  observer_id: string;
  observer_login: string;
  payee: string;
  reward: Num;
  filed_at: string;
  window_from: string;
  state: "pending" | "awaiting_wallet" | "settled";
  ruling: Ruling;
  code: string;
  facts_json: string;
  evidence_json: string;
  why: string;
  funders_contested: boolean;
  submitter_contested: boolean;
  outcome: "" | "paid" | "awaiting_wallet" | "nothing_paid" | "expired";
  timeline_json: string;
}

/** The taxon as frozen when the call was made. */
export interface Taxon {
  name: string;
  common: string;
  rank: string;
  group: string;
}

/** What every validator read and agreed on for a ruling. */
export interface SightingFacts {
  observation_id?: string;
  taxon_id?: string;
  taxon_name?: string;
  taxon_common?: string;
  quality?: string;
  captive?: boolean;
  observed_on?: string;
  place_guess?: string;
  in_place?: boolean;
  accuracy_m?: number | null;
  geoprivacy?: string;
  observer_id?: string;
  observer_login?: string;
  observer_since?: string;
  wallet?: string;
  photos?: number;
  annotations?: string[];
  gbif?: string;
  photo_answer?: "MEETS" | "NOT_MEETS" | "UNCLEAR";
  call_taxon?: string;
  call_place?: string;
  condition?: string;
}

export interface PhotoLook {
  url: string;
  sha256: string;
  answer: "MEETS" | "NOT_MEETS" | "UNCLEAR";
}

/** One reading: where validators looked, what they saw, and hashes that pin it. */
export interface EvidencePacket {
  observation?: string;
  source?: string;
  profile?: string;
  profile_bio_sha256?: string;
  photos?: PhotoLook[];
  facts_sha256?: string;
  ruling?: Ruling;
  read_at?: string;
  packet_sha256?: string;
}

export interface TimelineStep {
  at: string;
  event: string;
  ruling?: Ruling;
  code?: string;
  by?: string;
  before?: Ruling;
  evidence?: string;
  to?: string;
  amount?: string;
  wallet?: string;
  until?: string;
  outcome?: string;
}

export const RESPONSE_WINDOW_SECONDS = 600;
export const COLLECT_DAYS = 30;
export const MIN_REWARD_WEI = 10n ** 17n;

/** Ready-made calls a sponsor can start from (real iNaturalist taxa and places). */
export const PRESETS = [
  {
    label: "Asian hornet nests, UK",
    taxonId: "119019",
    taxon: "Vespa velutina · Yellow-legged Hornet",
    placeId: "6857",
    place: "United Kingdom",
    condition: "The photo shows a hornet nest",
    why: "An invasive predator of honeybees. Finding nests early is what stops it spreading.",
  },
  {
    label: "Asian hornet sightings, UK",
    taxonId: "119019",
    taxon: "Vespa velutina · Yellow-legged Hornet",
    placeId: "6857",
    place: "United Kingdom",
    condition: "",
    why: "Every confirmed sighting outside known areas helps trackers find the next nest.",
  },
  {
    label: "Live hedgehogs, UK",
    taxonId: "43042",
    taxon: "Erinaceus europaeus · Common Hedgehog",
    placeId: "6857",
    place: "United Kingdom",
    condition: "The photo shows a living hedgehog",
    why: "Declining fast in Britain; records of live animals map where they still breed.",
  },
];

export function wei(v: Num | undefined): bigint {
  try {
    return BigInt(String(v ?? "0").split(".")[0]);
  } catch {
    return 0n;
  }
}

export function formatGen(v: Num | undefined, digits = 2): string {
  const n = Number(wei(v)) / 1e18;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function parseGen(input: string): bigint | null {
  const t = input.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt((frac + "0".repeat(18)).slice(0, 18));
}

export function parseJson<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const sameAddress = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
export const isZero = (a?: string | null) => !a || /^0x0{40}$/i.test(a);

export function utcMs(iso: string): number {
  if (!iso) return NaN;
  const t = iso.trim();
  return Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(t) ? t : `${t}Z`);
}

export function windowLeftSeconds(s: Sighting, now = Date.now()): number {
  if (s.state !== "pending") return 0;
  return Math.max(0, Math.ceil(RESPONSE_WINDOW_SECONDS - (now - utcMs(s.window_from)) / 1000));
}

export const todayUtc = () => new Date().toISOString().slice(0, 10);
export const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
export const taxonOf = (c: Call) => parseJson<Taxon>(c.taxon_json, { name: c.taxon_id, common: "", rank: "", group: "" });
export const factsOf = (s: Sighting) => parseJson<SightingFacts>(s.facts_json, {});
export const timelineOf = (s: Sighting) => parseJson<TimelineStep[]>(s.timeline_json, []);
export const evidenceOf = (s: Sighting) => parseJson<EvidencePacket[]>(s.evidence_json, []);
export const fundersOf = (c: Call) => parseJson<Record<string, string>>(c.funders_json, {});
export const isFunder = (c: Call, a?: string | null) => !!a && Object.keys(fundersOf(c)).some((k) => sameAddress(k, a));
export const rewardsLeft = (c: Call) => (wei(c.reward) > 0n ? Number(wei(c.pot) / wei(c.reward)) : 0);
export const obsUrl = (id: string) => `https://www.inaturalist.org/observations/${id}`;
export const taxonUrl = (id: string) => `https://www.inaturalist.org/taxa/${id}`;
export const placeUrl = (id: string) => `https://www.inaturalist.org/places/${id}`;
export const peopleUrl = (login: string) => `https://www.inaturalist.org/people/${login}`;

/** Accepts "411242797" or any iNaturalist observation link. */
export function observationIdFrom(input: string): string | null {
  const t = input.trim();
  const m = t.match(/observations\/(\d{1,12})/) || t.match(/^(\d{1,12})$/);
  return m ? m[1] : null;
}

export const RULING_STYLE: Record<Ruling, { label: string; cls: string; help: string }> = {
  ELIGIBLE: { label: "Qualifies", cls: "chip-ok", help: "Meets every term of the call; the reward is reserved for the observer." },
  INELIGIBLE: { label: "Does not qualify", cls: "chip-no", help: "Fails one of the call's terms; nothing is reserved." },
  UNCLEAR: { label: "Undecided", cls: "chip-maybe", help: "iNaturalist or a photo could not be read clearly; nothing is reserved and it can be submitted again." },
};

export const OUTCOME_TEXT: Record<string, string> = {
  paid: "Paid to the observer's wallet",
  awaiting_wallet: "Held until the observer links a wallet",
  nothing_paid: "Closed, nothing paid",
  expired: "Not collected in time; returned to the pot",
};

export const CODE_LABEL: Record<string, string> = {
  eligible: "all terms met",
  wrong_taxon: "different species",
  not_research_grade: "not research grade yet",
  captive: "captive or cultivated",
  outside_dates: "outside the dates",
  outside_place: "outside the area",
  location_private: "location hidden",
  imprecise: "location too vague",
  new_account: "account too new",
  no_photo: "no photo",
  not_found: "no such observation",
  condition_not_met: "photos don't show it",
  photo_unclear: "photos unclear",
  observer_cap: "observer limit reached",
  payee_is_funder: "funder's own wallet",
  unreachable: "iNaturalist unreachable",
};
