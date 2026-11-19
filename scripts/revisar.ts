// Revisión técnica del MP4 final: duración, resolución, audio y coincidencia con el storyboard.
// Uso: npm run review  (requiere out/promo.mp4 y ffprobe)

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const raiz = resolve(import.meta.dirname, "..");
const candidatos = ["promo.mp4", "promo-borrador.mp4"].map((f) => join(raiz, "out", f));
const video = candidatos.find((f) => existsSync(f));
if (!video) {
  console.error("No hay video en out/. Renderiza primero con: npm run render (o npm run render:draft)");
  process.exit(1);
}

const probe = spawnSync(
  "ffprobe",
  ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", video],
  { encoding: "utf8" },
);
if (probe.status !== 0) {
  console.error("ffprobe no pudo leer el video. ¿Está instalado FFmpeg?");
  process.exit(1);
}
const info = JSON.parse(probe.stdout) as {
  format: { duration: string; size: string };
  streams: { codec_type: string; width?: number; height?: number; codec_name: string }[];
};

const duracion = Number(info.format.duration);
const video0 = info.streams.find((s) => s.codec_type === "video");
const audio0 = info.streams.find((s) => s.codec_type === "audio");
const mb = (Number(info.format.size) / 1024 / 1024).toFixed(1);

console.log(`Archivo: out/${video.split(/[\\/]/).pop()} (${mb} MB)`);
console.log(`Duración: ${duracion.toFixed(2)} s`);
console.log(`Video: ${video0?.width}x${video0?.height} ${video0?.codec_name ?? "sin video"}`);
console.log(`Audio: ${audio0 ? audio0.codec_name : "sin pista de audio (¿era intencional?)"}`);

let problemas = 0;
const storyPath = join(raiz, "storyboard.json");
if (existsSync(storyPath)) {
  const sb = JSON.parse(readFileSync(storyPath, "utf8")) as { video?: { duracion_total_s?: number }; escenas?: { duracion: number }[] };
  const esperada = (sb.escenas ?? []).reduce((a, e) => a + e.duracion, 0);
  if (Math.abs(esperada - duracion) > 0.5) {
    problemas++;
    console.log(`✖ La duración (${duracion.toFixed(2)} s) no coincide con el storyboard (${esperada} s).`);
  } else {
    console.log(`✔ Duración coincide con el storyboard (${esperada} s).`);
  }
}
if (!audio0) {
  console.log("! El video no tiene audio. Si el brief pide narración o sonidos, algo falló.");
}
if (video0 && (video0.width ?? 0) < 1080) {
  problemas++;
  console.log("✖ Resolución menor a 1080 px de lado. Revisa el render.");
}

console.log(problemas ? `\n${problemas} problema(s). Corrige antes de la entrega.` : "\nSin problemas técnicos. Falta la revisión visual y de sincronía (fase 6).");
process.exit(problemas ? 1 : 0);
