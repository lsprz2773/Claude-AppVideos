// Busca y descarga sonidos abiertos de Openverse, con registro de licencia.
// Uso:
//   npm run openverse -- buscar "whoosh corto" [--n 10] [--licencia cc0,by]
//   npm run openverse -- descargar <id> [--nombre whoosh-1]
// Descargas: assets/sonidos/<nombre>.<ext>, y una fila nueva en assets/sonidos/LICENSES.md.
// Nota: los campos de la respuesta siguen la documentación de Openverse; verifícalos la primera vez.

import "dotenv/config";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

interface Resultado {
  id: string;
  title?: string;
  creator?: string;
  license: string;
  license_version?: string;
  url: string;
  foreign_landing_url?: string;
  duration?: number;
}

const raiz = resolve(import.meta.dirname, "..");
const carpeta = join(raiz, "assets", "sonidos");
const API = "https://api.openverse.org/v1";
const [comando, ...resto] = process.argv.slice(2);

function opcion(nombre: string, def?: string): string | undefined {
  const i = resto.indexOf(`--${nombre}`);
  return i >= 0 ? resto[i + 1] : def;
}

async function token(): Promise<string | null> {
  const id = process.env.OPENVERSE_CLIENT_ID?.trim();
  const secreto = process.env.OPENVERSE_CLIENT_SECRET?.trim();
  if (!id || !secreto) return null; // acceso anónimo, con límite de peticiones
  const res = await fetch(`${API}/auth_tokens/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secreto }),
  });
  if (!res.ok) throw new Error(`No se pudo obtener el token de Openverse (${res.status}).`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function api<T>(ruta: string, params: Record<string, string> = {}): Promise<T> {
  const t = await token();
  const url = new URL(`${API}${ruta}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
  if (!res.ok) throw new Error(`Openverse respondió ${res.status} en ${ruta}.`);
  return (await res.json()) as T;
}

async function buscar(): Promise<void> {
  const q = resto[0];
  if (!q || q.startsWith("--")) {
    console.error('Uso: npm run openverse -- buscar "texto" [--n 10] [--licencia cc0,by]');
    process.exit(2);
  }
  const params: Record<string, string> = { q, page_size: opcion("n", "10") ?? "10" };
  const licencia = opcion("licencia");
  if (licencia) params.license = licencia;
  const data = await api<{ result_count: number; results: Resultado[] }>("/audio/", params);

  console.log(`Resultados para "${q}": ${data.result_count} en total, mostrando ${data.results.length}\n`);
  for (const r of data.results) {
    const seg = r.duration ? `${(r.duration / 1000).toFixed(1)}s` : "?";
    console.log(`${r.id}  [${r.license.toUpperCase()} ${r.license_version ?? ""}]  ${seg}  ${r.title ?? "(sin título)"}  — ${r.creator ?? "autor desconocido"}`);
  }
  mkdirSync(join(carpeta, "busquedas"), { recursive: true });
  const nombreBusqueda = q.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  writeFileSync(join(carpeta, "busquedas", `${nombreBusqueda}.json`), JSON.stringify(data.results, null, 2));
  console.log("\nGuardado en assets/sonidos/busquedas/. Elige un id y descárgalo con: npm run openverse -- descargar <id>");
}

async function descargar(): Promise<void> {
  const id = resto[0];
  if (!id || id.startsWith("--")) {
    console.error("Uso: npm run openverse -- descargar <id> [--nombre nombre-del-archivo]");
    process.exit(2);
  }
  const r = await api<Resultado>(`/audio/${id}/`);
  const base = (opcion("nombre") ?? (r.title ?? id).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)).replace(/\.[a-z0-9]+$/i, "");
  const ext = extname(new URL(r.url).pathname) || ".mp3";
  mkdirSync(carpeta, { recursive: true });
  const destino = join(carpeta, `${base}${ext}`);
  if (existsSync(destino)) {
    console.error(`Ya existe ${destino}. Usa --nombre para otro nombre.`);
    process.exit(1);
  }
  const res = await fetch(r.url);
  if (!res.ok) throw new Error(`No se pudo descargar el audio (${res.status}).`);
  writeFileSync(destino, Buffer.from(await res.arrayBuffer()));

  const licenciaTxt = `CC ${r.license.toUpperCase()} ${r.license_version ?? ""}`.trim();
  const ruta = `assets/sonidos/${base}${ext}`;
  const licencias = join(carpeta, "LICENSES.md");
  if (!existsSync(licencias)) writeFileSync(licencias, "# Licencias de sonidos\n\n| Archivo | Fuente | Licencia | Atribución requerida |\n|---|---|---|---|\n");
  if (!readFileSync(licencias, "utf8").endsWith("\n")) appendFileSync(licencias, "\n");
  appendFileSync(licencias, `| ${ruta} | ${r.foreign_landing_url ?? r.url} | ${licenciaTxt} | ${r.creator ?? "autor"}: ${r.title ?? id} |\n`);
  console.log(`✔ Descargado ${ruta} (${licenciaTxt}). Registrado en assets/sonidos/LICENSES.md.`);
}

if (comando === "buscar") await buscar();
else if (comando === "descargar") await descargar();
else {
  console.log("Uso:");
  console.log('  npm run openverse -- buscar "texto" [--n 10] [--licencia cc0,by]');
  console.log("  npm run openverse -- descargar <id> [--nombre nombre-del-archivo]");
  process.exit(comando ? 2 : 0);
}
