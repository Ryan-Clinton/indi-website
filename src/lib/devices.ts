// Builds the device list for the home page search, at build time.
// Sources, read fresh on every build:
//   - indilib/indi drivers.xml (drivers in the INDI library)
//   - indilib/indi-3rdparty <driver>/*.xml(.cmake) (third party drivers)
//   - gphoto/libgphoto2 camlibs/ptp2/library.c (DSLR and mirrorless cameras; only those with remote capture)
// plus the hand-kept families and aliases in src/data/device-families.ts.
// If a source can't be read, the build fails, so the site never ships a short list.

import { CAMERA_ALIASES, FAMILIES } from "../data/device-families";

const RAW = "https://raw.githubusercontent.com";
const INDI_XML = `${RAW}/indilib/indi/master/drivers.xml`;
const THIRD_PARTY_TREE = "https://api.github.com/repos/indilib/indi-3rdparty/git/trees/master?recursive=1";
const THIRD_PARTY_RAW = `${RAW}/indilib/indi-3rdparty/master`;
const GPHOTO_PTP = `${RAW}/gphoto/libgphoto2/master/camlibs/ptp2/library.c`;

/** One row: [name, kind, driver, other names] */
export type DeviceRow = [string, string, string, string[]];
export type DeviceData = {
  updated: string;
  devices: DeviceRow[];
  families: { n: string; k: string; d: string; re: string }[];
};

const KINDS: Record<string, string> = {
  CCDs: "Camera",
  Telescopes: "Mount",
  Focusers: "Focuser",
  "Filter Wheels": "Filter wheel",
  Domes: "Dome",
  Weather: "Weather station",
  Rotators: "Rotator",
  Auxiliary: "Accessory",
  Power: "Power box",
  Spectrographs: "Spectrograph",
  Detectors: "Detector",
  "Adaptive Optics": "Adaptive optics",
  Receivers: "Radio receiver",
};
// Not hardware, so not offered in the search
const SKIP = /simulator|scripting gateway|^imager agent$|^astrometry$|^weather (meta|safety proxy)$|^watchdog$|^manual filter$|^safety monitor$|^skysafari$|^joystick$|^wake on lan$|^indi alpaca server$/i;

// Labels of the ToupTek based drivers, set in indi-toupbase/CMakeLists.txt, not in the XML
const TEMPLATE_LABELS = new Set(["Toupcam", "Altair", "Bresser", "Ogmacam", "Tscam", "SVbonycam", "StarShootG", "Nncam", "Mallincam", "OmegonPro", "Meadecam"]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string, headers: Record<string, string> = {}): Promise<string> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
      if (res.ok) return await res.text();
      last = new Error(`HTTP ${res.status}`);
    } catch (e) {
      last = e;
    }
    await sleep(1000 * (attempt + 1));
  }
  throw new Error(`Device search: could not read ${url} (${String(last)})`);
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim();

/** Reads <devGroup group=…><device label=…><driver name=…> from a drivers.xml file */
function parseDriversXml(xml: string): DeviceRow[] {
  const rows: DeviceRow[] = [];
  for (const g of xml.matchAll(/<devGroup\s+group="([^"]*)"\s*>([\s\S]*?)<\/devGroup>/g)) {
    const kind = KINDS[g[1]] ?? g[1];
    for (const d of g[2].matchAll(/<device\s[^>]*?label="([^"]*)"[^>]*>([\s\S]*?)<\/device>/g)) {
      const label = decode(d[1]);
      const driver = decode(/<driver\s[^>]*?name="([^"]*)"/.exec(d[2])?.[1] ?? label);
      // Template labels (@LABEL@) are filled in by CMake; FAMILIES covers those brands
      if (!label || label.includes("@") || SKIP.test(label)) continue;
      rows.push([label, kind, driver, []]);
    }
  }
  return rows;
}

async function thirdPartyXml(): Promise<string[]> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "indilib.org-build" };
  // GitHub Actions passes its token, which avoids the low anonymous rate limit
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const tree = JSON.parse(await get(THIRD_PARTY_TREE, headers)) as { tree: { path: string }[]; truncated: boolean };
  if (tree.truncated) throw new Error("Device search: the indi-3rdparty file list came back truncated");
  const paths = tree.tree
    .map((e) => e.path)
    // Top level driver folders only; _sk files are skeletons, not device lists
    .filter((p) => /^indi-[^/]+\/[^/]+\.xml(\.cmake)?$/.test(p) && !/_sk\.xml/.test(p));
  const out: string[] = [];
  for (let i = 0; i < paths.length; i += 8) {
    out.push(...(await Promise.all(paths.slice(i, i + 8).map((p) => get(`${THIRD_PARTY_RAW}/${p}`)))));
  }
  return out;
}

// ---------- libgphoto2 ----------

// For comparing camera names: "EOS Rebel T3i" and "Rebel T3i" are the same name
const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^eos(?=.)/, "");
const VENDOR_NAME: Record<string, string> = { Fuji: "Fujifilm" };
const VENDOR_DRIVER: Record<string, string> = { Canon: "Canon DSLR", Nikon: "Nikon DSLR", Sony: "Sony DSLR", Fuji: "Fuji DSLR" };

function cleanModel(vendor: string, model: string): string {
  let m = model.replace(/\s*\((PTP mode|PC Control|Control|PTP)\)\s*$/i, "").replace(/^DSC (?=[A-Z])/, "").trim();
  const v = VENDOR_NAME[vendor] ?? vendor;
  if (m.toLowerCase().startsWith(v.toLowerCase())) m = m.slice(v.length).trim();
  return m;
}

/** Cameras with remote capture (PTP_CAP), grouped by USB id so regional names become one entry */
function parseGphoto(src: string): DeviceRow[] {
  const start = src.indexOf("} models[] = {");
  if (start < 0) throw new Error("Device search: libgphoto2 models[] table not found");
  const table = src.slice(start, src.indexOf("\n};", start));
  const groups = new Map<string, { vendor: string; models: string[] }>();
  const row = /\{\s*"([^":]+):([^"]+)"\s*,\s*(\w+)\s*,\s*(\w+)\s*,\s*([^}]*)\}/g;
  for (const m of table.matchAll(row)) {
    if (!/\bPTP_CAP\b/.test(m[5])) continue;
    const key = `${m[3]}:${m[4]}`.toLowerCase();
    const g = groups.get(key) ?? { vendor: m[1], models: [] };
    const model = cleanModel(m[1], m[2]);
    if (model && !g.models.some((x) => compact(x) === compact(model))) g.models.push(model);
    groups.set(key, g);
  }

  const aliasSets = CAMERA_ALIASES.map((set) => set.map(compact));
  const rows: DeviceRow[] = [];
  const seen = new Set<string>();
  for (const { vendor, models } of groups.values()) {
    const names = [...models];
    for (const [i, set] of aliasSets.entries()) {
      if (names.some((n) => set.includes(compact(n)))) {
        for (const extra of CAMERA_ALIASES[i]) if (!names.some((n) => compact(n) === compact(extra))) names.push(extra);
        // Lead with the first name of the alias line (EOS 800D, not Rebel T7i)
        const lead = names.findIndex((n) => compact(n) === set[0]);
        if (lead > 0) names.unshift(...names.splice(lead, 1));
      }
    }
    const brand = VENDOR_NAME[vendor] ?? vendor;
    const name = `${brand} ${names[0]}`;
    if (seen.has(compact(name))) continue;
    seen.add(compact(name));
    rows.push([name, "DSLR / mirrorless camera", VENDOR_DRIVER[vendor] ?? "GPhoto CCD", names.slice(1)]);
  }
  return rows;
}

// ---------- all together ----------

async function build(): Promise<DeviceData> {
  const [indi, third, gphoto] = await Promise.all([get(INDI_XML), thirdPartyXml(), get(GPHOTO_PTP)]);

  const drivers = [indi, ...third].flatMap(parseDriversXml);
  const byName = new Map<string, DeviceRow>();
  for (const r of drivers) if (!byName.has(compact(r[0]))) byName.set(compact(r[0]), r);
  const cameras = parseGphoto(gphoto);

  // A big drop means a source changed format; stop rather than tell people their gear is unsupported
  if (byName.size < 250) throw new Error(`Device search: only ${byName.size} INDI drivers found, expected 250 or more`);
  if (cameras.length < 250) throw new Error(`Device search: only ${cameras.length} gphoto cameras found, expected 250 or more`);

  // Family drivers should be labels people can pick in their client; flag the ones that are not
  for (const f of FAMILIES) {
    const missing = f.driver.split(" or ").filter((d) => !byName.has(compact(d)) && !TEMPLATE_LABELS.has(d));
    if (missing.length) console.warn(`Device search: "${f.name}" names driver ${missing.join(", ")}, which is not in the driver lists`);
  }

  const devices = [...byName.values(), ...cameras].sort((a, b) => a[0].localeCompare(b[0], "en"));
  return {
    updated: new Date().toISOString().slice(0, 10),
    devices,
    families: FAMILIES.map((f) => ({ n: f.name, k: f.kind, d: f.driver, re: f.match.source })),
  };
}

let cached: Promise<DeviceData> | undefined;
/** Fetches once per build (and once per dev server run) */
export function loadDevices(): Promise<DeviceData> {
  cached ??= build();
  return cached;
}
