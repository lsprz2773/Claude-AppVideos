// Graba la app (APP_URL) con Playwright siguiendo los pasos de grabaciones/pasos.ts.
// Uso: npm run record -- --nombre flujo-principal
// Salidas: assets/capturas/<nombre>.mp4 (listo para la edición) y grabaciones/raw/<nombre>.marcas.json
// Los marcas indican en qué segundo ocurrió cada paso, para sincronizar con la voz.

import "dotenv/config";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";
import { pasos } from "./pasos.ts";

const raiz = resolve(import.meta.dirname, "..");
const appUrl = process.env.APP_URL?.trim();
if (!appUrl) {
  console.error("Falta APP_URL en .env (por ejemplo http://localhost:3000). Pausa de recursos: ver la fase 3.");
  process.exit(1);
}
const idx = process.argv.indexOf("--nombre");
const nombre = idx >= 0 ? process.argv[idx + 1] : undefined;
if (!nombre || !/^[a-z0-9-]+$/.test(nombre)) {
  console.error("Usa --nombre con letras minúsculas, números y guiones. Ejemplo: --nombre flujo-principal");
  process.exit(2);
}

const rawDir = join(raiz, "grabaciones", "raw");
const capturas = join(raiz, "assets", "capturas");
mkdirSync(rawDir, { recursive: true });
mkdirSync(capturas, { recursive: true });

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: rawDir, size: { width: 1920, height: 1080 } },
});
const pagina = await contexto.newPage();
const inicio = Date.now();
const marcas: { paso: string; segundo: number }[] = [];

try {
  for (const paso of pasos) {
    marcas.push({ paso: paso.nombre, segundo: Number(((Date.now() - inicio) / 1000).toFixed(2)) });
    console.log(`→ ${paso.nombre}`);
    await paso.ejecutar(pagina, appUrl);
  }
} catch (e) {
  console.error(`Falló la grabación: ${(e as Error).message}`);
  await navegador.close();
  process.exit(1);
}

const videoGrabado = pagina.video();
await contexto.close();
const rutaVideo = await videoGrabado?.path();
await navegador.close();
if (!rutaVideo || !existsSync(rutaVideo)) {
  console.error("Playwright no entregó el video de la grabación.");
  process.exit(1);
}

const webm = join(rawDir, `${nombre}.webm`);
renameSync(rutaVideo, webm);
writeFileSync(join(rawDir, `${nombre}.marcas.json`), JSON.stringify(marcas, null, 2));

const destino = join(capturas, `${nombre}.mp4`);
const conv = spawnSync(
  "ffmpeg",
  ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", "-an", destino],
  { encoding: "utf8" },
);
if (conv.status !== 0) {
  console.error("FFmpeg no pudo convertir la grabación. Revisa que esté instalado.");
  process.exit(1);
}
console.log(`✔ Captura lista: assets/capturas/${nombre}.mp4`);
console.log(`  Marcas de tiempo: grabaciones/raw/${nombre}.marcas.json`);
