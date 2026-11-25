// Preflight de la plantilla: revisa lo necesario antes de cada fase y dice qué falta.
// Uso: npm run preparar -- --fase N   (N = 0 a 7; sin --fase revisa todo)
// Código de salida: 0 si no hay bloqueos para la fase; 1 si falta algo que bloquea.

import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

type Nivel = "bloquea" | "aviso";
interface Hallazgo {
  nivel: Nivel;
  ok: boolean;
  texto: string;
  // Fases en las que este punto bloquea (si falla). Si es aviso, solo informa.
  fases: number[];
}

const raiz = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const idxFase = args.indexOf("--fase");
const fase = idxFase >= 0 ? Number(args[idxFase + 1]) : null;
if (fase !== null && (!Number.isInteger(fase) || fase < 0 || fase > 7)) {
  console.error("Usa --fase con un número del 0 al 7.");
  process.exit(2);
}

const hallazgos: Hallazgo[] = [];
const add = (h: Hallazgo) => hallazgos.push(h);
const archivo = (ruta: string) => join(raiz, ruta);
const leer = (ruta: string) => (existsSync(archivo(ruta)) ? readFileSync(archivo(ruta), "utf8") : "");

// 1. Herramientas del sistema
const [mayor] = process.versions.node.split(".").map(Number);
add({ nivel: "bloquea", ok: mayor >= 22, texto: `Node.js 22 o superior (tienes ${process.versions.node})`, fases: [0, 1, 2, 3, 4, 5, 6, 7] });

const ff = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
add({ nivel: "bloquea", ok: ff.status === 0, texto: "FFmpeg instalado y en el PATH", fases: [3, 5, 6, 7] });

const ffp = spawnSync("ffprobe", ["-version"], { encoding: "utf8" });
add({ nivel: "bloquea", ok: ffp.status === 0, texto: "ffprobe instalado (viene con FFmpeg)", fases: [6, 7] });

const git = spawnSync("git", ["--version"], { encoding: "utf8" });
add({ nivel: "bloquea", ok: git.status === 0, texto: "Git instalado", fases: [0] });

// 2. Dependencias del proyecto
add({ nivel: "bloquea", ok: existsSync(archivo("node_modules/hyperframes")), texto: "Dependencias instaladas (npm install)", fases: [0, 1, 2, 3, 4, 5, 6, 7] });

let chromiumOk = false;
try {
  const { chromium } = await import("playwright");
  chromiumOk = existsSync(chromium.executablePath());
} catch {
  chromiumOk = false;
}
add({ nivel: "bloquea", ok: chromiumOk, texto: "Navegador de Playwright (npx playwright install chromium)", fases: [3] });

// 3. Archivo .env y claves
const env = (k: string) => (process.env[k] ?? "").trim() !== "";
add({ nivel: "bloquea", ok: existsSync(archivo(".env")), texto: "Archivo .env creado a partir de .env.example", fases: [3, 5] });
add({ nivel: "bloquea", ok: env("APP_URL"), texto: "APP_URL definido (la URL de la app a grabar)", fases: [3] });
add({ nivel: "aviso", ok: env("OPENVERSE_CLIENT_ID") || env("OPENVERSE_CLIENT_SECRET"), texto: "Credenciales de Openverse (opcional; sin ellas hay acceso anónimo con límite)", fases: [2] });

// 4. Brief
const brief = leer("brief.md");
const formatoElegido = /^- \[[xX]\] (16:9|9:16|1:1|Varios)/m.test(brief);
add({ nivel: "bloquea", ok: formatoElegido, texto: "Formato marcado en brief.md (16:9, 9:16, 1:1 o varios)", fases: [0] });

const camposObligatorios = ["Producto o app", "Objetivo del video", "Público", "Plataforma de publicación", "Idioma de narración y subtítulos", "Tono"];
const camposVacios = camposObligatorios.filter((c) => new RegExp(`^- ${c}:\\s*$`, "m").test(brief));
add({
  nivel: "bloquea",
  ok: camposVacios.length === 0,
  texto: camposVacios.length === 0 ? "Campos obligatorios del brief llenos" : `Campos del brief sin llenar: ${camposVacios.join(", ")}`,
  fases: [0],
});

const vozElegida = /^- \[[xX]\] (Mi voz|Grabación propia|Sin narración|Decidir después)/m.test(brief);
add({ nivel: "bloquea", ok: vozElegida, texto: "Opción de voz marcada en brief.md", fases: [0] });

const sonidosElegidos = /^- \[[xX]\] (Usar sonidos|Sin música)/m.test(brief);
add({ nivel: "aviso", ok: sonidosElegidos, texto: "Opción de sonidos y música marcada en brief.md", fases: [2] });

const guionListo = !/## Guion\s*\n\(Pega aquí/.test(brief) && (brief.split("## Guion")[1]?.trim().length ?? 0) > 0;
add({ nivel: "aviso", ok: guionListo, texto: "Guion o ideas clave pegados en brief.md (si no hay, Claude propone uno)", fases: [1] });

// 5. Referencias
const fuentes = leer("referencias/fuentes.md");
const filasConEnlace = fuentes.split("\n").filter((l) => /^\|\s*\d+\s*\|\s*[^|\s][^|]*\|/.test(l)).length;
add({ nivel: "aviso", ok: filasConEnlace > 0, texto: "Referencias en referencias/fuentes.md (opcional, pero útil para ritmo y estilo)", fases: [1] });

// 6. Storyboard
const rutaStory = archivo("storyboard.json");
let storyOk = false;
let storyTexto = "Storyboard creado en storyboard.json (fase 1)";
if (existsSync(rutaStory)) {
  try {
    const sb = JSON.parse(readFileSync(rutaStory, "utf8")) as { escenas?: { duracion: number }[]; video?: { duracion_total_s?: number } };
    const escenas = sb.escenas ?? [];
    const suma = escenas.reduce((a, e) => a + (e.duracion ?? 0), 0);
    const raizHtml = leer("index.html").match(/id="root"[\s\S]*?data-duration="([\d.]+)"/);
    const durHtml = raizHtml ? Number(raizHtml[1]) : NaN;
    if (escenas.length === 0) {
      storyTexto = "storyboard.json no tiene escenas";
    } else if (Math.abs(suma - durHtml) > 0.01) {
      storyTexto = `La suma de escenas (${suma}s) no coincide con data-duration de index.html (${durHtml}s)`;
    } else {
      storyOk = true;
      storyTexto = `storyboard.json válido: ${escenas.length} escenas, ${suma}s`;
    }
  } catch (e) {
    storyTexto = `storyboard.json no es JSON válido (${(e as Error).message})`;
  }
}
add({ nivel: "bloquea", ok: storyOk, texto: storyTexto, fases: [4, 5, 6, 7] });

// Whisper (subtítulos por palabra). En Windows, hyperframes necesita whisper-cli.exe ya instalado.
// Si .env no da la ruta, se usa la carpeta estándar de docs/instalacion.md (la misma que usa transcribir.ts).
const rutaWhisperEnv = (process.env.HYPERFRAMES_WHISPER_PATH ?? "").trim();
const rutaWhisper = rutaWhisperEnv || join(homedir(), ".cache", "whisper-cpp", "bin", "Release", "whisper-cli.exe");
const whisperOk = process.platform !== "win32" || existsSync(rutaWhisper);

// 6b. Audios de narración: los pones tú en assets/voz/<id>.mp3 (o .wav)
if (storyOk) {
  const sb = JSON.parse(readFileSync(rutaStory, "utf8")) as { escenas: { id: string; duracion: number; texto_voz?: string; voz?: string }[] };
  const conVoz = sb.escenas.filter((e) => (e.texto_voz ?? "").trim() !== "" && e.voz !== "no");
  const faltan: string[] = [];
  const sinPalabras: string[] = [];
  for (const e of conVoz) {
    const ruta = [".mp3", ".wav", ".m4a"].map((x) => archivo(join("assets", "voz", e.id + x))).find((r) => existsSync(r));
    if (!ruta) {
      faltan.push(e.id);
      continue;
    }
    if (!existsSync(archivo(join("assets", "voz", `${e.id}.palabras.json`)))) sinPalabras.push(e.id);
    const pr = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ruta], { encoding: "utf8" });
    const dur = Number(pr.stdout.trim());
    if (pr.status === 0 && dur > e.duracion + 0.05) {
      add({ nivel: "aviso", ok: false, texto: `El audio de ${e.id} dura ${dur.toFixed(2)} s y la escena ${e.duracion} s. Ajusta el texto o la duración.`, fases: [5] });
    }
  }
  add({
    nivel: "bloquea",
    ok: faltan.length === 0,
    texto: faltan.length === 0 ? `Audios de narración en assets/voz/ para ${conVoz.length} escena(s)` : `Faltan audios en assets/voz/ para: ${faltan.join(", ")} (nombre: <id>.mp3)`,
    fases: [5],
  });
  if (conVoz.length > 0) {
    // Sin Whisper los subtítulos van por bloque (ver CLAUDE.md), así que solo bloquea si Whisper está instalado.
    add({
      nivel: whisperOk ? "bloquea" : "aviso",
      ok: sinPalabras.length === 0,
      texto: sinPalabras.length === 0 ? "Tiempos por palabra de Whisper en assets/voz/<id>.palabras.json" : `Falta transcribir con Whisper: ${sinPalabras.join(", ")} (npm run transcribir)`,
      fases: [5],
    });
  }
}

add({
  nivel: "aviso",
  ok: whisperOk,
  texto:
    process.platform !== "win32"
      ? "Whisper: hyperframes lo compila al primer uso de npm run transcribir (necesita cmake; revisa con npx hyperframes doctor)"
      : whisperOk
        ? `Whisper instalado (${rutaWhisper})`
        : rutaWhisperEnv
          ? `Whisper: no existe ${rutaWhisper} (revisa HYPERFRAMES_WHISPER_PATH en .env)`
          : `Whisper: falta whisper-cli.exe en ${rutaWhisper} (ver docs/instalacion.md)`,
  fases: [5],
});

// 7. Skills globales (opcionales)
const skillsDir = join(homedir(), ".claude", "skills");
add({ nivel: "aviso", ok: existsSync(join(skillsDir, "real-sfx")), texto: "Skill real-sfx instalada (opcional; sonidos reales, ver docs/instalacion.md)", fases: [2] });
add({ nivel: "aviso", ok: existsSync(join(skillsDir, "hyperframes")) || existsSync(join(raiz, "node_modules/hyperframes")), texto: "Skills de HyperFrames disponibles (npx hyperframes skills update)", fases: [4] });

// 8. Salida
const fasesNombres = ["0 Brief", "1 Borrador", "2 Assets", "3 Pausa de recursos", "4 Edición", "5 Voz y subtítulos", "6 Revisión", "7 Entrega"];
const relevantes = fase === null ? hallazgos : hallazgos.filter((h) => fase === null || h.fases.includes(fase));

console.log(fase === null ? "Preflight completo" : `Preflight para la fase ${fasesNombres[fase]}`);
console.log("");
const bloqueos: Hallazgo[] = [];
for (const h of relevantes) {
  const marca = h.ok ? "✔" : h.nivel === "bloquea" ? "✖" : "!";
  console.log(`${marca} ${h.texto}`);
  if (!h.ok && h.nivel === "bloquea") bloqueos.push(h);
}
console.log("");
if (bloqueos.length) {
  console.log(`Faltan ${bloqueos.length} requisito(s) que bloquean. Resuélvelos antes de seguir.`);
  process.exit(1);
}
console.log("Sin bloqueos. Los avisos (!) son opcionales.");
