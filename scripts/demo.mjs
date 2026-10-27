// Live end-to-end demo of FieldCall on GenLayer Studio, using real iNaturalist observations.
//
//   node scripts/demo.mjs <contract-address>
//
// The calls are DEMO calls funded by test wallets. The observations are real records by real
// naturalists; none of them has a wallet in their iNaturalist profile, so their rewards are held
// (never paid to anyone else) and return to the funders when the call closes.

import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { writeFileSync } from "fs";

const [CONTRACT] = process.argv.slice(2);
if (!CONTRACT) {
  console.error("usage: node scripts/demo.mjs <contract-address>");
  process.exit(1);
}
const RPC = "https://studio.genlayer.com/api";
const GEN = 10n ** 18n;
const WINDOW_MS = 600_000;

function client(account) {
  return createClient({ chain: studionet, endpoint: RPC, account });
}

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const TRANSIENT = /rate limit|Unexpected token '<'|not valid JSON|fetch failed|ECONNRESET|socket hang up|50[234]/i;

async function write(c, who, functionName, args, value = 0n, { expectError = false } = {}) {
  const from = c.account.address;
  for (let attempt = 1; ; attempt++) {
    const nonceBefore = BigInt(await rpc("eth_getTransactionCount", [from, "latest"]));
    try {
      let hash;
      try {
        hash = await c.writeContract({ address: CONTRACT, functionName, args, value });
      } catch (err) {
        // The RPC sometimes answers a send with an HTML error page. Only resend if the
        // nonce did not move; otherwise the first send went through and we pick it up.
        if (!TRANSIENT.test(String(err?.message || err))) throw err;
        await sleep(15000);
        const nonceAfter = BigInt(await rpc("eth_getTransactionCount", [from, "latest"]));
        if (nonceAfter === nonceBefore) throw err;
        const txs = await rpc("sim_getTransactionsForAddress", [from]);
        hash = txs.filter((t) => (t.from_address || "").toLowerCase() === from.toLowerCase()).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0].hash;
        console.log(`  send answered with an error page but the tx exists: ${hash}`);
      }
      // Once a hash exists, only the wait is retried; the transaction is never sent twice.
      let receipt;
      for (let wait = 1; ; wait++) {
        try {
          receipt = await c.waitForTransactionReceipt({ hash, status: "ACCEPTED", retries: 60, interval: 5000 });
          break;
        } catch (err) {
          if (!TRANSIENT.test(String(err?.message || err)) || wait >= 6) throw Object.assign(err, { sent: true });
          await sleep(10000 * wait);
        }
      }
      const lr = receipt?.consensus_data?.leader_receipt;
      const first = Array.isArray(lr) ? lr[0] : lr;
      const exec = first?.execution_result ?? "?";
      let returned = first?.result?.payload?.readable;
      try { returned = JSON.parse(returned); } catch {}
      const row = {
        who,
        call: `${functionName}(${args.map((a) => (typeof a === "bigint" ? `${Number(a) / 1e18} GEN` : JSON.stringify(a)).slice(0, 60)).join(", ")})`,
        value: (Number(value) / 1e18).toString(),
        hash,
        status: receipt.statusName ?? receipt.status_name ?? "ACCEPTED",
        exec,
        returned: typeof returned === "string" ? returned : undefined,
      };
      log.push(row);
      console.log(`${row.who.padEnd(11)} ${row.call.padEnd(58)} ${row.status.padEnd(9)} ${row.exec.padEnd(7)} ${hash}${row.returned ? "  -> " + row.returned.slice(0, 160) : ""}`);
      if (expectError) {
        if (exec !== "ERROR") throw new Error(`${functionName} was expected to be refused but executed with ${exec}`);
        const msg = typeof first?.result?.payload === "string" ? first.result.payload : "";
        row.refused = msg;
        console.log(`  -> refused as designed: ${msg}`);
        return row;
      }
      if (exec !== "SUCCESS") throw new Error(`${functionName} executed with ${exec}`);
      return row;
    } catch (err) {
      const msg = String(err?.message || err);
      if (TRANSIENT.test(msg) && attempt < 5 && !err?.sent) {
        console.log(`  transient RPC error (${msg.slice(0, 60)}), waiting ${15 * attempt}s`);
        await sleep(15000 * attempt);
        continue;
      }
      throw err;
    }
  }
}

async function read(c, functionName, args = []) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await c.readContract({ address: CONTRACT, functionName, args });
    } catch (err) {
      if (TRANSIENT.test(String(err?.message)) && attempt < 6) {
        await sleep(15000 * attempt);
        continue;
      }
      throw err;
    }
  }
}

const balance = async (addr) => BigInt(await rpc("eth_getBalance", [addr, "latest"]));
const fmt = (wei) => (Number(wei) / 1e18).toFixed(2);
const fund = async (addr, gen) => rpc("sim_fundAccount", [addr, Number(gen * GEN)]);
const field = (obj, name) => (obj instanceof Map ? obj.get(name) : obj[name]);

const keys = { sponsor: generatePrivateKey(), cofunder: generatePrivateKey(), scout: generatePrivateKey(), bystander: generatePrivateKey() };
const acct = Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, createAccount(v)]));
const A = client(acct.sponsor);
const B = client(acct.cofunder);
const S = client(acct.scout);
const X = client(acct.bystander);
if (process.env.DEMO_KEYS) writeFileSync(process.env.DEMO_KEYS, JSON.stringify(keys));

console.log("contract  ", CONTRACT);
for (const [k, a] of Object.entries(acct)) console.log(k.padEnd(10), a.address);
await fund(acct.sponsor.address, 20n);
await fund(acct.cofunder.address, 5n);
await fund(acct.scout.address, 1n);
await fund(acct.bystander.address, 1n);
await sleep(3000);

const firstCall = (await read(A, "get_calls", [0, 200])).length;
let nextSighting = (await read(A, "get_sightings", [0, 200])).length;
const cid = (n) => `call_${firstCall + n}`;
const sightings = [];
const rulingOf = async (id, label) => {
  const s = await read(A, "get_sighting", [id]);
  console.log(`  -> ${label}: ${field(s, "ruling")} (${field(s, "code")}) ${field(s, "why")}`);
  return field(s, "ruling");
};
const submit = async (who, c, callId, obs, label) => {
  await write(c, who, "submit", [callId, obs]);
  const id = `sighting_${nextSighting++}`;
  sightings.push(id);
  await rulingOf(id, `${label} (observation ${obs})`);
  return id;
};

// Transfers out of the contract run as their own transactions once the call that emitted them is
// finalized, so balances are compared only when nothing touching the contract is in flight.
const quiet = async () => {
  let last = -1;
  for (let i = 0; i < 60; i++) {
    const txs = await rpc("sim_getTransactionsForAddress", [CONTRACT]);
    const busy = txs.filter((t) => t.status !== "FINALIZED" && t.status !== "CANCELED" && t.status !== "UNDETERMINED").length;
    if (busy === 0 && txs.length === last) return txs.length;
    last = busy === 0 ? txs.length : -1;
    await sleep(10000);
  }
  throw new Error("transactions did not finalize");
};
const reconciliations = [];
const reconcile = async (label) => {
  await quiet();
  const t = JSON.parse(await read(A, "totals"));
  const onChain = await balance(CONTRACT);
  const ok = BigInt(t.expected_balance) === onChain;
  reconciliations.push({ label, expected: t.expected_balance, balance: onChain.toString(), ok });
  console.log(`  reconcile (${label}): open pots + reserved rewards = ${fmt(t.expected_balance)} GEN; contract balance ${fmt(onChain)} GEN ${ok ? "OK" : "MISMATCH"}`);
  if (!ok) throw new Error("balance mismatch");
};

const HORNET = "119019"; // Vespa velutina, yellow-legged (Asian) hornet
const UK = "6857"; // United Kingdom
const ENDS = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
const NEST = "The photo shows a hornet nest";
const open = (c, who, title, taxon, place, starts, ends, reward, perObserver, research, minDays, maxAcc, condition, value) =>
  write(c, who, "create_call", [title, taxon, place, starts, ends, reward, perObserver, research, minDays, maxAcc, condition], value);

// Refused at creation: the GEN comes straight back.
await open(A, "sponsor", "Asian hornet nests, UK", "Vespa velutina", UK, "2026-08-01", ENDS, GEN / 2n, 2, true, 30, 100, NEST, 2n * GEN); // a name, not a taxon id
await open(A, "sponsor", "Asian hornet nests, UK", "999999999", UK, "2026-08-01", ENDS, GEN / 2n, 2, true, 30, 100, NEST, 2n * GEN); // iNaturalist has no such taxon
await open(A, "sponsor", "Asian hornet nests, UK", HORNET, "999999999", "2026-08-01", ENDS, GEN / 2n, 2, true, 30, 100, NEST, 2n * GEN); // no such place
await open(A, "sponsor", "Asian hornet nests, UK", HORNET, UK, "2026-08-01", "2026-09-30", GEN / 2n, 2, true, 30, 100, NEST, 2n * GEN); // already ended
await open(A, "sponsor", "Asian hornet nests, UK", HORNET, UK, "2026-08-01", ENDS, GEN / 20n, 2, true, 30, 100, NEST, 2n * GEN); // reward below 0.1 GEN
await open(A, "sponsor", "Asian hornet nests, UK", HORNET, UK, "2026-08-01", ENDS, GEN, 2, true, 30, 100, NEST, GEN / 2n); // pot smaller than one reward

// Call 0: nests only. Validators look at the photos.
console.log("");
await open(A, "sponsor", "Asian hornet nests, UK", HORNET, UK, "2026-08-01", ENDS, GEN / 2n, 2, true, 30, 100, NEST, 2n * GEN);
await write(B, "cofunder", "fund", [cid(0)], GEN);
const nest = await submit("scout", S, cid(0), "397236824", "a nest in a tree, Romsey");
const adult = await submit("scout", S, cid(0), "397236834", "an adult hornet on a branch");
const crabro = await submit("scout", S, cid(0), "411158753", "a European hornet, the native lookalike");
const france = await submit("scout", S, cid(0), "411204951", "an Asian hornet in France");
const old = await submit("scout", S, cid(0), "182971213", "an Asian hornet in Hull, 2023");
await write(S, "scout", "submit", [cid(0), "397236824"], 0n, { expectError: true }); // already open for this observation
await write(S, "scout", "settle", [nest], 0n, { expectError: true }); // only a funder pays early
await write(B, "cofunder", "contest", [nest]); // a co-funder asks for a fresh reading of the nest
await rulingOf(nest, "nest after the co-funder's contest");
await write(S, "scout", "contest", [crabro]); // the scout answers back on the lookalike
await rulingOf(crabro, "European hornet after the scout's contest");
await write(S, "scout", "settle", [adult]); // the scout accepts the adult's ruling at once
await reconcile("call 0 open, the nest's reward reserved");

// Call 1: any sighting, at most two per observer.
console.log("");
await open(A, "sponsor", "Asian hornet sightings, UK", HORNET, UK, "2026-08-01", ENDS, GEN / 4n, 2, true, 30, 100, "", GEN);
const s1 = await submit("scout", S, cid(1), "397236834", "adult, simoncolenutt's 1st");
const s2 = await submit("scout", S, cid(1), "397236811", "adult, simoncolenutt's 2nd");
const s3 = await submit("scout", S, cid(1), "392140551", "adult, simoncolenutt's 3rd");
await write(A, "sponsor", "settle", [s1]); // the sponsor pays at once: no wallet in the profile, so it is held
await write(X, "bystander", "collect", [s1], 0n, { expectError: true }); // nothing to collect until a wallet is linked
await write(X, "bystander", "close", [cid(1)], 0n, { expectError: true }); // submissions and collection stay open 30 days after the end
await reconcile("both calls open");

console.log("\nwaiting 10 minutes for the response windows...");
await sleep(630_000);
for (const id of [nest, crabro, france, old, s2, s3]) await write(X, "bystander", "settle", [id]);
await write(S, "scout", "submit", [cid(0), "397236824"], 0n, { expectError: true }); // already earned its reward
await reconcile("end of run");

const calls = [cid(0), cid(1)];
console.log("\nfinal calls:");
const pots = {};
for (const id of calls) {
  pots[id] = JSON.parse(await read(A, "pot", [id]));
  console.log(`  ${id} ${JSON.stringify(pots[id])}`);
}
const evidence = {};
for (const id of sightings) {
  console.log(`  explain_sighting(${id}) = ${await read(A, "explain_sighting", [id])}`);
  const s = await read(A, "get_sighting", [id]);
  evidence[id] = {
    observation: field(s, "observation_id"), call: field(s, "call_id"), ruling: field(s, "ruling"), code: field(s, "code"),
    outcome: field(s, "outcome"), state: field(s, "state"), why: field(s, "why"), facts: JSON.parse(field(s, "facts_json")),
    timeline: JSON.parse(field(s, "timeline_json")), packets: JSON.parse(field(s, "evidence_json")),
  };
}
const balances = {};
for (const [k, a] of Object.entries(acct)) balances[k] = (await balance(a.address)).toString();
const out = { contract: CONTRACT, accounts: Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, a.address])), calls, pots, sightings: evidence, reconciliations, balances, log };
writeFileSync(new URL("../docs/demo-run.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("\nwrote docs/demo-run.json");
