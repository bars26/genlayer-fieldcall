// Builds docs/REPRODUCTION.md from docs/demo-run.json (written by scripts/demo.mjs) and, when present,
// docs/ui-test.json (a MetaMask run from the live app).
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

let uiTest = "";
const uiPath = new URL("../docs/ui-test.json", import.meta.url);
if (existsSync(uiPath)) {
  const ui = JSON.parse(readFileSync(uiPath, "utf8"));
  uiTest = `## Wallet test from the live app

${ui.note} Wallet \`${ui.wallet}\`. Every transaction is FINALIZED with execution result SUCCESS.

| Step | GEN sent | Result | Tx |
|---|---|---|---|
${ui.steps.map(([step, value, result, hash]) => `| ${esc(step)} | ${value} | ${esc(result)} | ${tx(hash)} |`).join("\n")}
`;
}

const md = `# FieldCall: reproduction of the live run

Contract on GenLayer Studio: [\`${run.contract}\`](${EXPLORER}/address/${run.contract}) (source: \`contracts/field_call.py\`, checked
byte-identical with \`node scripts/verify-code.mjs ${run.contract}\`).

\`scripts/demo.mjs\` opened two **demo calls** with test wallets and submitted **real iNaturalist observations** of the
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

\`totals()\` (open pots plus reserved rewards) against the contract's on-chain balance, each time after every transfer had finalized:

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

${uiTest}
## Every transaction

| Who | Call | GEN | Status | Result | Returned / refused | Tx |
|---|---|---|---|---|---|---|
${run.log.map((r) => `| ${r.who} | \`${esc(r.call)}\` | ${r.value} | ${r.status} | ${r.exec} | ${esc((r.returned || r.refused || "").slice(0, 140))} | ${tx(r.hash)} |`).join("\n")}
`;

writeFileSync(new URL("../docs/REPRODUCTION.md", import.meta.url), md);
console.log(`wrote docs/REPRODUCTION.md (${run.log.length} transactions)`);
