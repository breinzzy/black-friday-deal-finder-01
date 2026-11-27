// DealHunt 2026 — the hand-in program (Node 22, standard library only).
// The site is this directory's app/ folder: plain static files, no build
// step, deals held in its own data file, nothing loaded over the network.
// This program hands it in: it copies app/ and screenshots/ from beside
// this file into /output (or $MAKEFUN_OUTPUT_DIR outside the grader) and
// writes /output/dossier.json with the vendored make.fun library — the
// summary the judge reads (screenshots, first-load bytes, source outline).
// Leave vendor/makefun-frontend.ts untouched: the scorer rebuilds the
// dossier with its own copy and the two must match byte for byte.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

if (!existsSync(join(here, "app"))) throw new Error("app/ is missing: nothing to hand in");
mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// The gate's caps, as the starter states them: at most 4 screenshots of at
// most 256 KiB each; app/ at most 993 files and directories and 16 MiB;
// the dossier text at most 160 KiB.
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
