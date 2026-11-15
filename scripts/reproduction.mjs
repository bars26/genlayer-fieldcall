// Builds docs/REPRODUCTION.md from docs/demo-run.json (GenLayer Studio, written by scripts/demo.mjs), and, when
// present, docs/bradbury/demo-run.json (Bradbury testnet, scripts/demo-bradbury.mjs) and docs/ui-test.json (a MetaMask
// run from the live app). The v1 run is kept in docs/v1/.
//
//   node scripts/reproduction.mjs

import { existsSync, readFileSync, writeFileSync } from "fs";

const run = JSON.parse(readFileSync(new URL("../docs/demo-run.json", import.meta.url), "utf8"));
const EXPLORER = "https://explorer-studio.genlayer.com";
const tx = (h) => (h ? `[\`${h.slice(0, 10)}…\`](${EXPLORER}/tx/${h})` : "");
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const gen = (wei) => `${(Number(BigInt(wei)) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 4 })} GEN`;
const obs = (id) => `[${id}](https://www.inaturalist.org/observations/${id})`;

const rows = Object.entries(run.sightings).map(([id, s]) => {
  const f = s.facts || {};
  const looked = (s.packets.at(-1)?.photos || []).map((p) => p.answer.replace("_", " ")).join(", ");
  return `| ${id} | ${s.call} | ${obs(s.observation)} | ${esc(f.taxon_name || "")} · ${esc(f.observed_on || "")} · ${esc(f.place_guess || "")} | **${s.ruling}** (${s.code})${looked ? `<br>photos looked at: ${looked}` : ""} | ${esc(s.outcome || s.state)} |`;
});

const reasons = Object.entries(run.sightings).map(([id, s]) => `- **${id}** (${s.ruling}): ${esc(s.why)}`);

const packets = Object.entries(run.sightings).flatMap(([id, s]) =>
  s.packets.map(
    (p, i) =>
      `| ${id} #${i + 1} | ${p.read_at} | ${p.ruling} | \`${p.packet_sha256}\` | \`${p.facts_sha256}\` | ${p.profile_bio_sha256 ? `\`${p.profile_bio_sha256.slice(0, 16)}…\`` : "—"} | ${(p.photos || []).map((x) => `\`${x.sha256.slice(0, 12)}…\` ${x.answer}`).join("<br>") || "—"} |`
  )
);

const timelines = Object.entries(run.sightings).map(
  ([id, s]) =>
    `- **${id}**: ` +
    s.timeline.map((t) => `${t.at} ${t.event}${t.ruling ? ` → ${t.ruling}` : ""}${t.by ? ` by ${t.by}` : ""}${t.amount ? ` ${gen(t.amount)}` : ""}${t.until ? ` until ${t.until}` : ""}`).join(" · ")
);

const pots = run.calls.map((id) => {
  const p = run.pots[id];
  return `| ${id} | ${gen(p.funded)} | ${gen(p.paid)} | ${gen(p.reserved)} | ${gen(p.pot)} | ${p.rewards_left} | ${p.state} | ${p.collect_until} |`;
});

// v2 checks, picked out of the transaction log.
const pick = (re) => run.log.find((r) => re.test(r.call));
const v11 = [
  ["Opening a call sends no GEN: it is funded from a deposit, and a refused call leaves the deposit untouched", pick(/create_call\(.*"999999999"/)],
  ["A call starting on 2026-02-31 (no such date) is refused, not crashed", pick(/create_call\(.*"2026-02-31"/)],
  ["A call asking for more than the deposit is refused", [...run.log].find((r) => /create_call\(.*20 GEN\)/.test(r.call))],
  ["A 0.05 GEN top-up (below the 0.1 GEN minimum) is credited back", run.log.find((r) => /^fund\(/.test(r.call) && r.value === "0.05")],
  ["A fourth submission of the same observation to the same call is refused", [...run.log].reverse().find((r) => /submit\(.*"411204951"\)/.test(r.call) && r.refused)],
  ["Only withdraw sends GEN out, to the caller", run.log.find((r) => /^withdraw\(/.test(r.call) && r.returned)],
].filter(([, r]) => r);
const v11Table = v11.length
  ? `## v2 checks, live

| Check | Result | Tx |
|---|---|---|
${v11.map(([what, r]) => `| ${what} | ${esc(r.returned || r.refused || r.exec)} | ${tx(r.hash)} |`).join("\n")}

Closing and refunding need a call past its collect date (call end + 30 days), so they are shown by the direct tests, including
\`test_stress_hundreds_of_funders_and_refused_sightings_still_close_and_repay_everyone\` (301 funders, 120 refused submissions).
`
  : "";

let uiTest = "";
const uiPath = new URL("../docs/ui-test.json", import.meta.url);
if (existsSync(uiPath)) {
  const ui = JSON.parse(readFileSync(uiPath, "utf8"));
  const utx = ui.network === "bradbury" ? (h) => (h ? `[\`${h.slice(0, 10)}…\`](https://explorer-bradbury.genlayer.com/tx/${h})` : "") : tx;
  uiTest = `## Wallet test from the live app

${ui.note} Wallet \`${ui.wallet}\`.

| Step | GEN sent | Result | Tx |
|---|---|---|---|
${ui.steps.map(([step, value, result, hash]) => `| ${esc(step)} | ${value} | ${esc(result)} | ${utx(hash)} |`).join("\n")}
`;
}

let bradbury = "";
const bPath = new URL("../docs/bradbury/demo-run.json", import.meta.url);
if (existsSync(bPath)) {
  const b = JSON.parse(readFileSync(bPath, "utf8"));
  const BX = "https://explorer-bradbury.genlayer.com";
  const btx = (h) => (h ? `[\`${h.slice(0, 10)}…\`](${BX}/tx/${h})` : "");
  bradbury = `## Bradbury testnet run

The same program (\`contracts/field_call.bradbury.py\`: the Studio source with the Bradbury header, checked by
\`python3 scripts/bradbury_source.py --check\`) at [\`${b.contract}\`](${BX}/address/${b.contract}), run by
\`scripts/demo-bradbury.mjs\`. Five Bradbury validators read iNaturalist and GBIF for every reading. Bradbury reports each
transaction's decision, execution result and votes; results were read back from the contract.

Call \`${b.call.id}\`: ${esc(b.call.title)} (GBIF required: ${b.call.gbif_required}), reward ${gen(b.call.reward)}.

| Sighting | Observation | Ruling | Reason |
|---|---|---|---|
${Object.entries(b.sightings).map(([id, s]) => `| ${id} | ${obs(s.observation_id)} | **${s.ruling}** (${s.code}) | ${esc(s.why)} |`).join("\n")}

| Who | Call | Status | Execution | Votes | Seconds | Tx |
|---|---|---|---|---|---|---|
${b.log.map((r) => `| ${r.who} | \`${esc(r.call)}\` | ${r.status} | ${r.execution} | ${r.votes.join("/")} | ${r.seconds} | ${btx(r.hash)} |`).join("\n")}

| Point | Expected | Contract balance | Match |
|---|---|---|---|
${b.reconciliations.map((r) => `| ${r.label} | ${gen(r.expected)} | ${gen(r.balance)} | ${r.ok ? "yes" : "**no**"} |`).join("\n")}
`;
}

const md = `# FieldCall v2: reproduction of the live runs

Contract on GenLayer Studio: [\`${run.contract}\`](${EXPLORER}/address/${run.contract}) (source: \`contracts/field_call.py\`, checked
byte-identical with \`node scripts/verify-code.mjs ${run.contract}\`).

\`scripts/demo.mjs\` opened three **demo calls** with test wallets and submitted **real iNaturalist observations** of the
yellow-legged (Asian) hornet, *Vespa velutina*, an invasive predator of honeybees that the UK asks the public to report. Every
reading below is real validator consensus over iNaturalist's live API; where a call has a photo condition, the validators
looked at the photos themselves. None of these observers has a wallet address in their iNaturalist profile, so their rewards
are **held for them** (and return to the funders if nobody collects); nothing was paid to anyone else.

Accounts: ${Object.entries(run.accounts).map(([k, a]) => `${k} \`${a}\``).join(", ")}.

## Rulings

| Sighting | Call | Observation | What iNaturalist records | Ruling | Outcome |
|---|---|---|---|---|---|
${rows.join("\n")}

### The reason stored with each ruling

${reasons.join("\n")}

## Pots at the end of the run

| Call | Funded | Paid | Reserved (held) | Free | Rewards left | State | Submissions and collection until |
|---|---|---|---|---|---|---|---|
${pots.join("\n")}

## Balance reconciliation

\`totals()\` (running totals of open pots, reserved rewards, unreturned shares of closed calls, and GEN credited but not yet
withdrawn) against the contract's on-chain balance, each time after every transfer had finalized:

| Point | Expected | Contract balance | Match |
|---|---|---|---|
${run.reconciliations.map((r) => `| ${r.label} | ${gen(r.expected)} | ${gen(r.balance)} | ${r.ok ? "yes" : "**no**"} |`).join("\n")}

Final wallet balances: ${Object.entries(run.balances).map(([k, b]) => `${k} ${gen(b)}`).join(", ")}.

## Evidence packets

One packet per reading, stored on-chain with the sighting: the facts every validator agreed on (hashed), the hash of the
observer's profile text (where the wallet address is read), and for photo conditions each photo's sha256 with the answer.

| Reading | At (UTC) | Ruling | packet_sha256 | facts_sha256 | profile | photos |
|---|---|---|---|---|---|---|
${packets.join("\n")}

## Timelines

${timelines.join("\n")}

${v11Table}
${bradbury}
${uiTest}
## Every transaction

| Who | Call | GEN | Status | Result | Returned / refused | Tx |
|---|---|---|---|---|---|---|
${run.log.map((r) => `| ${r.who} | \`${esc(r.call)}\` | ${r.value} | ${r.status} | ${r.exec} | ${esc((r.returned || r.refused || "").slice(0, 140))} | ${tx(r.hash)} |`).join("\n")}
`;

writeFileSync(new URL("../docs/REPRODUCTION.md", import.meta.url), md);
console.log(`wrote docs/REPRODUCTION.md (${run.log.length} transactions)`);
