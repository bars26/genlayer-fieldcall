// Live run of FieldCall v2 on Bradbury testnet (Phase 2): five independent validators read iNaturalist and GBIF.
//
//   node scripts/demo-bradbury.mjs <contract-address>      # writes docs/bradbury/demo-run.json
//
// Test wallets (keys outside the repo, in ~/.config/genlayer-demos/): a sponsor and a scout, funded from the GenLayer
// testnet faucet. The call is a demo; the observations, profiles and GBIF records are real.
//
// The call has no photo condition: in November 2026 Bradbury validators often run out of time on image prompts, so
// photo calls stay on Studio. Bradbury reports each transaction's decision, execution result and votes, not the
// contract's return value, so every result below is read back from the contract. A round where the leader ran out
// of time changes nothing and is sent again (up to three times).

import { mkdirSync, writeFileSync } from "fs";
import { accountFrom, balance, clientFor, gen, keyFile, read, write } from "./bradbury.mjs";

const [CONTRACT] = process.argv.slice(2);
if (!CONTRACT) {
  console.error("usage: node scripts/demo-bradbury.mjs <contract-address>");
  process.exit(1);
}
const GEN = 10n ** 18n;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wallets = {
  sponsor: accountFrom(keyFile("fieldcall-bradbury-sponsor.json")),
  scout: accountFrom(keyFile("payclear-bradbury-auditor-a.json")),
};
const C = Object.fromEntries(Object.entries(wallets).map(([k, a]) => [k, clientFor(a)]));
const log = [];
const plain = (o) => JSON.parse(JSON.stringify(o instanceof Map ? Object.fromEntries(o) : o, (k, v) => (typeof v === "bigint" ? v.toString() : v instanceof Map ? Object.fromEntries(v) : v)));

async function send(who, functionName, args = [], opts = {}) {
  const { expect = "ok", ...rest } = opts;
  const extra = functionName === "withdraw" ? { payee: wallets[who].address, leader: 120n, validator: 120n } : {};
  const r = await write(C[who], CONTRACT, functionName, args, { ...extra, ...rest });
  const row = { who, call: `${functionName}(${args.map((a) => JSON.stringify(typeof a === "bigint" ? a.toString() : a)).join(", ")})`, value: gen(rest.value ?? 0n), ...r };
  log.push(row);
  console.log(`${who.padEnd(8)} ${row.call.slice(0, 74).padEnd(74)} ${r.status} ${r.execution} [${r.votes.join("/")}] ${r.seconds}s ${r.hash}`);
  if (expect === "ok" && !r.ok) throw new Error(`${functionName} did not complete: ${r.status} ${r.execution}`);
  if (expect === "refused" && r.execution !== "FINISHED_WITH_ERROR") throw new Error(`${functionName} was expected to be refused, got ${r.status} ${r.execution}`);
  return r;
}

const reconciliations = [];
async function reconcile(label) {
  // A withdraw's transfer leaves the contract about a minute after the withdraw finalizes.
  for (let i = 0; i < 12; i++) {
    const t = JSON.parse(await read(CONTRACT, "totals"));
    const onChain = await balance(C.sponsor, CONTRACT);
    if (BigInt(t.expected_balance) === onChain || i === 11) {
      const ok = BigInt(t.expected_balance) === onChain;
      reconciliations.push({ label, expected: t.expected_balance, owed: t.owed, balance: onChain.toString(), ok });
      console.log(`  reconcile (${label}): pots + reserved + credited ${gen(t.expected_balance)} GEN; contract balance ${gen(onChain)} GEN ${ok ? "OK" : "MISMATCH"}`);
      if (!ok) throw new Error("balance mismatch");
      return;
    }
    await sleep(15000);
  }
}

const ENDS = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
const HORNET = "119019", UK = "6857";
const first = (await read(CONTRACT, "get_calls", [0, 200])).length;
let next = (await read(CONTRACT, "get_sightings", [0, 200])).length;
const cid = `call_${first}`;
console.log("contract", CONTRACT);
for (const [k, a] of Object.entries(wallets)) console.log(k.padEnd(8), a.address, gen(await balance(C.sponsor, a.address)), "GEN");

await send("sponsor", "deposit", [], { value: 3n * GEN / 2n, leader: 120n, validator: 120n });
// Refused: iNaturalist has no such taxon. Nothing was sent with the call, so the deposit is untouched.
await send("sponsor", "create_call", ["Asian hornet sightings, UK", "999999999", UK, "2026-08-01", ENDS, GEN / 4n, 2, true, 30, 100, "", true, GEN], { expect: "refused", tries: 1 });
await send("sponsor", "create_call", ["Asian hornet sightings, UK (checked against GBIF)", HORNET, UK, "2026-08-01", ENDS, GEN / 4n, 2, true, 30, 100, "", true, GEN]);
await reconcile("call open, 0.5 GEN of the deposit still credited");

const cases = [
  ["397236834", "an adult Asian hornet, Romsey, 2026-08-20 (published by GBIF)"],
  ["411158753", "a European hornet, the native lookalike"],
];
const ids = {};
for (const [obs, what] of cases) {
  await send("scout", "submit", [cid, obs]);
  const id = `sighting_${next++}`;
  ids[obs] = id;
  const s = plain(await read(CONTRACT, "get_sighting", [id]));
  console.log(`  -> ${id} ${what}: ${s.ruling} (${s.code}) ${s.why}`);
}
await send("sponsor", "settle", [ids["397236834"]]); // a funder settles an eligible sighting at once: held, no wallet in the profile
await send("scout", "settle", [ids["411158753"]]); // the scout accepts the lookalike's refusal at once
await send("sponsor", "collect", [ids["397236834"]], { expect: "refused", tries: 1 }); // nothing to collect until a wallet is linked
await reconcile("both sightings settled");
await send("sponsor", "withdraw", []);
await reconcile("end of run, after the sponsor withdrew the unused deposit");

const out = { network: "bradbury", contract: CONTRACT, accounts: Object.fromEntries(Object.entries(wallets).map(([k, a]) => [k, a.address])),
  call: plain(await read(CONTRACT, "get_call", [cid])), sightings: {}, reconciliations, log };
for (const [obs, id] of Object.entries(ids)) out.sightings[id] = plain(await read(CONTRACT, "get_sighting", [id]));
mkdirSync(new URL("../docs/bradbury/", import.meta.url), { recursive: true });
writeFileSync(new URL("../docs/bradbury/demo-run.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("wrote docs/bradbury/demo-run.json");
