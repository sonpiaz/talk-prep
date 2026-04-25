#!/usr/bin/env bun
/**
 * gen-images.ts — pluggable image generation for talk-prep.
 *
 * Tier chain (preferred → fallback):
 *   1. Kyma (KYMA_API_KEY) — POST https://api.kymaapi.com/v1/images/generations
 *      Returns 202 + job id; we poll GET /v1/jobs/{id} until succeeded, then
 *      download output.url. Models discovered via the public registry JSON.
 *   2. fal.ai direct (FAL_KEY) — POST https://queue.fal.run/{model}, then poll
 *      status_url until COMPLETED, then fetch response_url.
 *   3. Unsplash placeholder — no key required; emits placeholder URLs only.
 *
 * Reads: an image-map markdown file with a table. Rows where Source is
 * "fal" or "kyma" are generated. Rows tagged SCREENSHOT are skipped.
 *
 * Intent tags inside a prompt (e.g. `[cinematic_photo]`) route to the right
 * model via INTENT_ROUTING below.
 *
 * Usage:
 *   bun scripts/gen-images.ts --map ./my-talk/06-image-map.md --out ./my-talk/images
 *   bun scripts/gen-images.ts --help
 *   bun scripts/gen-images.ts --map ./my-talk/06-image-map.md --dry-run
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Tier = "kyma" | "fal" | "unsplash";

type RegistryModel = {
  id: string;
  name: string;
  description?: string;
  best_for?: string | null;
  capability: string;
  input_modalities: string[];
  output_modalities: string[];
  pricing: { mode: string; per_image_usd: number; currency: string };
  hot?: boolean;
  recommended?: boolean;
};

type Registry = {
  object: string;
  updated_at: string;
  models: RegistryModel[];
};

type ImageRow = {
  slideNumber: string;
  title: string;
  source: string;
  file: string;
  prompt: string;
  intent: string;
};

const KYMA_BASE = "https://api.kymaapi.com";
const REGISTRY_URL = `${KYMA_BASE}/registry/image-models.json`;

const INTENT_TAG = /\[(cinematic_photo|vietnamese_text_in_image|logo_wordmark|flat_illustration|image_edit)\]/i;

// Intent → canonical model id. Model ids match the Kyma registry; the fal
// tier maps each id to a queue.fal.run endpoint via FAL_ENDPOINTS below.
const INTENT_ROUTING: Record<string, string> = {
  cinematic_photo: "flux-1.1-ultra",
  vietnamese_text_in_image: "ideogram-v3",
  logo_wordmark: "ideogram-v3",
  flat_illustration: "recraft-v3",
  image_edit: "flux-kontext-pro",
  default: "flux-1.1-ultra",
};

const FAL_ENDPOINTS: Record<string, string> = {
  "flux-1.1-ultra": "https://queue.fal.run/fal-ai/flux-pro/v1.1-ultra",
  "flux-kontext-pro": "https://queue.fal.run/fal-ai/flux-pro/kontext",
  "ideogram-v3": "https://queue.fal.run/fal-ai/ideogram/v3",
  "recraft-v3": "https://queue.fal.run/fal-ai/recraft-v3",
};

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function printHelp(): void {
  console.log(`gen-images.ts — pluggable image generation

Usage:
  bun scripts/gen-images.ts --map <image-map.md> --out <dir> [options]

Options:
  --map <path>       Path to the image-map markdown file (required)
  --out <dir>        Output directory for generated JPGs (default: ./images)
  --dry-run          Parse and route but do not call APIs
  --force-tier <t>   Force tier (kyma | fal | unsplash)
  --help             Show this help

Env:
  KYMA_API_KEY       Preferred — uses Kyma async multimodal API
  FAL_KEY            Fallback — direct fal.ai queue API
  (none)             Unsplash placeholder URLs

Intent routing (inferred from [tag] in prompt; falls back to cinematic_photo):
  cinematic_photo            → flux-1.1-ultra
  vietnamese_text_in_image   → ideogram-v3
  logo_wordmark              → ideogram-v3
  flat_illustration          → recraft-v3
  image_edit                 → flux-kontext-pro
`);
}

async function loadRegistry(): Promise<Registry> {
  try {
    const r = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(4000) });
    if (r.ok) {
      const data = (await r.json()) as Registry;
      console.log(`  registry: live (${REGISTRY_URL}, ${data.models.length} models, updated ${data.updated_at})`);
      return data;
    }
    console.log(`  registry: live fetch returned ${r.status}, falling back to bundled`);
  } catch (e) {
    console.log(`  registry: live unreachable (${(e as Error).message}), falling back to bundled`);
  }
  const hereFile = fileURLToPath(import.meta.url);
  const bundled = resolve(dirname(hereFile), "../config/kyma-registry-fallback.json");
  const raw = await readFile(bundled, "utf8");
  const data = JSON.parse(raw) as Registry;
  console.log(`  registry: bundled (${bundled}, ${data.models.length} models, snapshot ${data.updated_at})`);
  return data;
}

function pickTier(forced?: string): Tier {
  if (forced === "kyma" || forced === "fal" || forced === "unsplash") return forced;
  if (process.env.KYMA_API_KEY) return "kyma";
  if (process.env.FAL_KEY) return "fal";
  return "unsplash";
}

function routeIntent(intent: string, registry: Registry): string {
  const id = INTENT_ROUTING[intent] ?? INTENT_ROUTING.default!;
  const known = registry.models.find((m) => m.id === id);
  if (!known) {
    throw new Error(
      `routed model "${id}" for intent "${intent}" not found in registry — ` +
        `update INTENT_ROUTING or refresh the registry snapshot`,
    );
  }
  return id;
}

function parseImageMap(md: string): ImageRow[] {
  const rows: ImageRow[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    if (/^\|\s*#/.test(line)) continue;
    if (/^\|\s*-+\s*\|/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) continue;
    const [slideNumber, title, source, file, promptRaw] = cells;
    if (!slideNumber || !/^\d+$/.test(slideNumber)) continue;
    const prompt = promptRaw ?? "";
    const match = prompt.match(INTENT_TAG);
    const intent = match ? match[1]!.toLowerCase() : "cinematic_photo";
    rows.push({
      slideNumber,
      title: title ?? "",
      source: (source ?? "").toLowerCase(),
      file: file ?? "",
      prompt: prompt.replace(INTENT_TAG, "").trim().replace(/^`|`$/g, ""),
      intent,
    });
  }
  return rows;
}

function resolveFilePath(raw: string, outDir: string): string {
  const clean = raw.replace(/^`|`$/g, "").trim();
  if (clean.startsWith("images/")) return join(outDir, clean.replace(/^images\//, ""));
  return join(outDir, clean);
}

// ── Kyma tier ────────────────────────────────────────────────────
//
// Kyma multimodal jobs are async:
//   POST /v1/images/generations  → 202 { id, status: "pending", ... }
//   GET  /v1/jobs/{id}           → 200 { status, output: { url } | null, ... }
//
// We poll until status is "succeeded" (download output.url) or "failed".

type KymaJob = {
  id: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded" | "expired";
  output: { url: string; metadata?: unknown } | null;
  error: { message: string; code?: string } | null;
  estimated_cost: number | null;
  charged_amount: number | null;
};

async function genKyma(row: ImageRow, registry: Registry, outFile: string, key: string): Promise<void> {
  const modelId = routeIntent(row.intent, registry);
  const t0 = Date.now();
  console.log(`  [${row.slideNumber}] kyma submit → ${modelId} (intent: ${row.intent})`);

  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "Idempotency-Key": `talk-prep-${row.slideNumber}-${Date.now()}`,
  };

  const sub = await fetch(`${KYMA_BASE}/v1/images/generations`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: modelId,
      prompt: row.prompt,
      n: 1,
      size: "1920x1080",
    }),
  });
  if (sub.status !== 202 && sub.status !== 200) {
    throw new Error(`kyma submit ${sub.status}: ${await sub.text()}`);
  }
  const job0 = (await sub.json()) as KymaJob;
  if (!job0.id) throw new Error(`kyma submit returned no job id`);

  // Cap at 90s. fal models complete in 10-20s; this leaves headroom for
  // Supabase replica lag where status flips to "succeeded" a beat before
  // output.url propagates.
  const maxPollMs = 90_000;
  while (Date.now() - t0 < maxPollMs) {
    await Bun.sleep(2000);
    const st = await fetch(`${KYMA_BASE}/v1/jobs/${job0.id}`, { headers });
    if (!st.ok) throw new Error(`kyma poll ${st.status}: ${await st.text()}`);
    const job = (await st.json()) as KymaJob;
    if (job.status === "succeeded" && job.output?.url) {
      const buf = await (await fetch(job.output.url)).arrayBuffer();
      await Bun.write(outFile, buf);
      const sec = ((Date.now() - t0) / 1000).toFixed(1);
      const cost = job.charged_amount != null ? `$${job.charged_amount.toFixed(3)}` : "—";
      console.log(`  [${row.slideNumber}] done in ${sec}s · ${cost} → ${outFile}`);
      return;
    }
    if (job.status === "failed" || job.status === "refunded" || job.status === "expired") {
      throw new Error(`kyma job ${job.status}: ${job.error?.message ?? "(no message)"}`);
    }
  }
  throw new Error(`kyma job ${job0.id} timed out after ${maxPollMs / 1000}s`);
}

// ── fal.ai direct tier ───────────────────────────────────────────

async function genFal(row: ImageRow, registry: Registry, outFile: string, key: string): Promise<void> {
  const modelId = routeIntent(row.intent, registry);
  const endpoint = FAL_ENDPOINTS[modelId];
  if (!endpoint) throw new Error(`no fal endpoint mapped for model "${modelId}"`);

  const t0 = Date.now();
  console.log(`  [${row.slideNumber}] fal submit → ${modelId} (intent: ${row.intent})`);

  const headers = { Authorization: `Key ${key}`, "Content-Type": "application/json" };
  const body: Record<string, unknown> = {
    prompt: row.prompt,
    aspect_ratio: "16:9",
    num_images: 1,
    output_format: "jpeg",
  };
  if (modelId === "flux-1.1-ultra") body.safety_tolerance = "2";

  const sub = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
  if (!sub.ok) throw new Error(`fal submit ${sub.status}: ${await sub.text()}`);
  const subData = (await sub.json()) as { status_url?: string };
  if (!subData.status_url) throw new Error(`fal: no status_url in submit response`);

  while (true) {
    await Bun.sleep(2000);
    const st = await fetch(subData.status_url, { headers });
    const sd = (await st.json()) as { status: string; response_url?: string };
    if (sd.status === "COMPLETED" && sd.response_url) {
      const r = await fetch(sd.response_url, { headers });
      const out = (await r.json()) as { images?: { url: string }[] };
      const first = out.images?.[0];
      if (!first) throw new Error(`fal: no images in response`);
      const buf = await (await fetch(first.url)).arrayBuffer();
      await Bun.write(outFile, buf);
      const sec = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  [${row.slideNumber}] done in ${sec}s → ${outFile}`);
      return;
    }
    if (sd.status === "FAILED") throw new Error(`fal returned FAILED: ${JSON.stringify(sd)}`);
  }
}

function unsplashPlaceholder(row: ImageRow): string {
  const keywords = encodeURIComponent(row.intent.replace(/_/g, ","));
  return `https://source.unsplash.com/1920x1080/?${keywords}`;
}

async function main(): Promise<void> {
  if (hasFlag("help")) { printHelp(); return; }

  const mapPath = arg("map");
  const outDir = arg("out") ?? "./images";
  const dryRun = hasFlag("dry-run");
  const forced = arg("force-tier");

  if (!mapPath) {
    printHelp();
    process.exit(1);
  }

  const md = await readFile(mapPath, "utf8");
  const rows = parseImageMap(md).filter((r) => r.source === "fal" || r.source === "kyma");
  console.log(`Parsed ${rows.length} rows from ${mapPath}`);
  for (const r of rows) {
    console.log(`  [${r.slideNumber}] ${r.source} · ${r.intent} · ${r.file}`);
  }
  if (rows.length === 0) {
    console.log(`No rows to generate. Exiting.`);
    return;
  }

  const tier = pickTier(forced);
  console.log(`\nTier: ${tier}`);
  const registry = await loadRegistry();

  for (const r of rows) {
    try {
      const id = routeIntent(r.intent, registry);
      console.log(`  route [${r.slideNumber}] ${r.intent} → ${id}`);
    } catch (e) {
      console.log(`  route [${r.slideNumber}] FAILED: ${(e as Error).message}`);
    }
  }

  if (dryRun) {
    console.log(`\n(dry-run) would generate ${rows.length} images via tier "${tier}". Exiting.`);
    return;
  }

  await mkdir(outDir, { recursive: true });

  if (tier === "kyma" || tier === "fal") {
    const key = tier === "kyma" ? process.env.KYMA_API_KEY : process.env.FAL_KEY;
    if (!key) throw new Error(`tier ${tier} requires ${tier === "kyma" ? "KYMA_API_KEY" : "FAL_KEY"}`);
    const generator = tier === "kyma" ? genKyma : genFal;

    console.log(`\nGenerating ${rows.length} images in parallel...`);
    const t0 = Date.now();
    const results = await Promise.allSettled(
      rows.map((r) => generator(r, registry, resolveFilePath(r.file, outDir), key)),
    );
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    console.log(`\nDone in ${sec}s. ${ok}/${rows.length} succeeded.`);
    const fails = results
      .map((r, i) => ({ r, row: rows[i]! }))
      .filter((x) => x.r.status === "rejected");
    for (const f of fails) {
      console.log(`  FAILED [${f.row.slideNumber}]: ${(f.r as PromiseRejectedResult).reason}`);
    }
    return;
  }

  console.log(`\nUsing Unsplash placeholders (no API key set).`);
  const mapOut: Record<string, string> = {};
  for (const r of rows) {
    mapOut[r.file] = unsplashPlaceholder(r);
    console.log(`  [${r.slideNumber}] ${r.file} → ${mapOut[r.file]}`);
  }
  const writePath = join(outDir, "placeholders.json");
  await mkdir(outDir, { recursive: true });
  await writeFile(writePath, JSON.stringify(mapOut, null, 2));
  console.log(`\nWrote ${writePath}. Use these URLs as src in your HTML scaffold.`);
}

main().catch((e) => {
  console.error((e as Error).stack ?? String(e));
  process.exit(1);
});
