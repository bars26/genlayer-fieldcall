import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { createClient as createBradburyClient } from "genlayer-js-bradbury";
import { testnetBradbury } from "genlayer-js-bradbury/chains";
import { NETWORKS, networkFrom, type NetworkId } from "@/lib/network";

/**
 * Server-side snapshot of every call (with its funders) and sighting, cached at the CDN.
 *
 * GenLayer Studio rate-limits per IP and counts contract reads (`gen_call`) in the same
 * 30-per-minute bucket as `eth_sendRawTransaction`. Reading the registry from the visitor's
 * browser would spend the budget the visitor needs for their own transactions, so it is read
 * here, with one `get_calls` and one `get_sightings` call per 200 items (plus each call's funders),
 * and served from the CDN. On Bradbury, reads go to a GenLayer node RPC (the chain RPC does not answer gen_call).
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Snapshot = { calls: unknown[]; sightings: unknown[]; fetchedAt: string };
const memo: Partial<Record<NetworkId, { at: number; data: Snapshot }>> = {};
const MEMO_MS = 10_000;
const PAGE = 200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function read<T>(client: any, functionName: string, args: unknown[]): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return (await client.readContract({ address: client.fieldcall, functionName, args })) as T;
    } catch (err) {
      last = err;
      await sleep(1500 * 2 ** attempt);
    }
  }
  throw last;
}

function toJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v instanceof Map ? Object.fromEntries(v) : v)));
}

async function readAll(client: any, functionName: string): Promise<unknown[]> {
  const out: unknown[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await read<unknown[]>(client, functionName, [offset, PAGE]);
    out.push(...page.map(toJson));
    if (page.length < PAGE) return out;
  }
}

async function paged(client: any, fn: string, id: string, n: number): Promise<unknown[]> {
  const out: unknown[] = [];
  for (let offset = 0; offset < n; offset += PAGE) out.push(...JSON.parse(await read<string>(client, fn, [id, offset, PAGE])));
  return out;
}

async function load(id: NetworkId): Promise<Snapshot> {
  const net = NETWORKS[id];
  const client: any =
    id === "bradbury"
      ? createBradburyClient({ chain: testnetBradbury, endpoint: net.readRpc } as any)
      : createClient({ chain: studionet, endpoint: net.readRpc } as any);
  client.fieldcall = net.contract;
  const [calls, sightings] = (await Promise.all([readAll(client, "get_calls"), readAll(client, "get_sightings")])) as [any[], any[]];
  await Promise.all(calls.map(async (c) => (c.funders = await paged(client, "get_funders", c.id, Number(c.n_funders ?? 0))))); // funders live outside the call record
  return { calls, sightings, fetchedAt: new Date().toISOString() };
}

export async function GET(request: Request) {
  const id = networkFrom(new URL(request.url).searchParams.get("network"));
  const cached = memo[id];
  try {
    if (!cached || Date.now() - cached.at > MEMO_MS) {
      const data = await load(id);
      if (!cached || data.calls.length + data.sightings.length >= cached.data.calls.length + cached.data.sightings.length) memo[id] = { at: Date.now(), data };
    }
    return Response.json(memo[id]!.data, {
      // Short on purpose: a long stale-while-revalidate would show the first visitor after a
      // quiet period a registry from hours ago, with sightings that were settled meanwhile.
      headers: { "Cache-Control": id === "bradbury" ? "public, s-maxage=30, stale-while-revalidate=600" : "public, s-maxage=15, stale-while-revalidate=45" },
    });
  } catch (err) {
    if (memo[id]) return Response.json(memo[id]!.data, { headers: { "Cache-Control": "public, s-maxage=10" } });
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
