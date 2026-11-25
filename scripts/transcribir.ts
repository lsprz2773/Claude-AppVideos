// Transcribe la voz de cada escena con Whisper (vía `hyperframes transcribe`) y guarda el tiempo de cada palabra.
// Uso: npm run transcribir [-- --escena e01] [--idioma es] [--modelo small]
// Entrada: assets/voz/<id>.mp3 (o .wav / .m4a) de cada escena con texto_voz en storyboard.json.
// Salida: assets/voz/<id>.palabras.json con las palabras, su tiempo dentro del audio y su tiempo en el video.
// En Windows necesita HYPERFRAMES_WHISPER_PATH en .env (ver docs/instalacion.md).

import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

interface Escena {
  id: string;
  inicio: number;
  duracion: number;
  texto_voz?: string;
  voz?: string;
}
interface PalabraWhisper {
  text: string;
  start: number;
  end: number;
}

const raiz = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const opcion = (nombre: string) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 ? args[i + 1] : undefined;
};

// 1. Storyboard y escenas con voz
const rutaStory = join(raiz, "storyboard.json");
if (!existsSync(rutaStory)) {
  console.error("Falta storyboard.json. Se crea en la fase 1.");
  process.exit(1);
}
const escenas = (JSON.parse(readFileSync(rutaStory, "utf8")) as { escenas: Escena[] }).escenas.filter(
  (e) => (e.texto_voz ?? "").trim() !== "" && e.voz !== "no",
);
const soloEscena = opcion("escena");
const objetivo = soloEscena ? escenas.filter((e) => e.id === soloEscena) : escenas;
if (objetivo.length === 0) {
  console.error(soloEscena ? `No hay escena con voz llamada ${soloEscena}.` : "Ninguna escena tiene texto_voz.");
  process.exit(1);
}

// 2. Idioma: --idioma, o el que dice brief.md
const idiomaBrief = (() => {
  const brief = existsSync(join(raiz, "brief.md")) ? readFileSync(join(raiz, "brief.md"), "utf8") : "";
  const linea = brief.match(/^- Idioma de narración y subtítulos:(.*)$/m)?.[1].toLowerCase() ?? "";
  if (/espa|spanish|\bes\b/.test(linea)) return "es";
  if (/ingl|english|\ben\b/.test(linea)) return "en";
  if (/portug|\bpt\b/.test(linea)) return "pt";
  return undefined;
})();
const idioma = opcion("idioma") ?? idiomaBrief;
if (!idioma) {
  console.error("No sé el idioma de la voz. Llénalo en brief.md o usa --idioma es (en, pt, ...).");
  process.exit(2);
}
// Los modelos .en solo sirven para inglés.
const modelo = opcion("modelo") ?? "small";
if (modelo.endsWith(".en") && idioma !== "en") {
  console.error(`El modelo ${modelo} solo transcribe inglés. Usa small, medium o large-v3 para "${idioma}".`);
  process.exit(2);
}

// 3. Whisper
if (process.platform === "win32") {
  const ruta = process.env.HYPERFRAMES_WHISPER_PATH?.trim();
  if (!ruta || !existsSync(ruta)) {
    console.error("Falta whisper-cli.exe. Define HYPERFRAMES_WHISPER_PATH en .env (ver docs/instalacion.md).");
    process.exit(1);
  }
}
const cli = join(raiz, "node_modules", "hyperframes", "bin", "hyperframes.mjs");
if (!existsSync(cli)) {
  console.error("Falta HyperFrames. Ejecuta npm install.");
  process.exit(1);
}

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

// Porcentaje de palabras del guion que Whisper escuchó, en orden (subsecuencia común más larga).
const coincidencia = (guion: string[], oido: string[]) => {
  if (guion.length === 0) return 1;
  const fila = new Array(oido.length + 1).fill(0);
  for (const g of guion) {
    let previo = 0;
    for (let j = 1; j <= oido.length; j++) {
      const tmp = fila[j];
      fila[j] = g === oido[j - 1] ? previo + 1 : Math.max(fila[j], fila[j - 1]);
      previo = tmp;
    }
  }
  return fila[oido.length] / guion.length;
};

let fallos = 0;
for (const e of objetivo) {
  const audio = [".mp3", ".wav", ".m4a"].map((x) => join(raiz, "assets", "voz", e.id + x)).find((r) => existsSync(r));
  if (!audio) {
    console.log(`✖ ${e.id}: falta assets/voz/${e.id}.mp3`);
    fallos++;
    continue;
  }
  // hyperframes escribe transcript.json en --dir; cada escena usa su carpeta temporal.
  const tmp = join(raiz, ".hyperframes", "transcripciones", e.id);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  const r = spawnSync(
    process.execPath,
    [cli, "transcribe", audio, "--engine", "whisper", "--model", modelo, "--language", idioma, "--json", "--dir", tmp],
    { encoding: "utf8", env: process.env },
  );
  const transcript = join(tmp, "transcript.json");
  if (r.status !== 0 || !existsSync(transcript)) {
    const ultima = (r.stdout || r.stderr).trim().split("\n").pop();
    console.log(`✖ ${e.id}: Whisper no pudo transcribir (${ultima})`);
    fallos++;
    continue;
  }
  const palabras = (JSON.parse(readFileSync(transcript, "utf8")) as PalabraWhisper[]).map((p) => ({
    texto: p.text,
    inicio: p.start,
    fin: p.end,
    inicio_video: Number((e.inicio + p.start).toFixed(3)),
    fin_video: Number((e.inicio + p.end).toFixed(3)),
  }));
  const pct = coincidencia(normalizar(e.texto_voz ?? ""), normalizar(palabras.map((p) => p.texto).join(" ")));
  const fin = palabras.at(-1)?.fin ?? 0;
  writeFileSync(
    join(raiz, "assets", "voz", `${e.id}.palabras.json`),
    JSON.stringify({ id: e.id, inicio_escena: e.inicio, idioma, modelo, coincidencia_guion: Number(pct.toFixed(2)), palabras }, null, 2) + "\n",
  );
  rmSync(tmp, { recursive: true, force: true });

  const avisos: string[] = [];
  if (pct < 0.85) avisos.push(`solo ${Math.round(pct * 100)}% de las palabras coincide con texto_voz; revisa si la grabación dice otra cosa`);
  if (fin > e.duracion + 0.05) avisos.push(`la última palabra termina en ${fin.toFixed(2)} s y la escena dura ${e.duracion} s`);
  console.log(`${avisos.length ? "!" : "✔"} ${e.id}: ${palabras.length} palabras → assets/voz/${e.id}.palabras.json${avisos.length ? ` (${avisos.join("; ")})` : ""}`);
}

process.exit(fallos ? 1 : 0);
