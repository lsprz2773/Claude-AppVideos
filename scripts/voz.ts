// Genera la narración con ElevenLabs (texto a voz con marcas de tiempo) por escena.
// Uso:
//   npm run voz                 -> solo muestra escenas y caracteres (no gasta créditos)
//   npm run voz -- --confirmar  -> genera los audios (usa la API y consume créditos)
// Salida: assets/voz/<id>.mp3, assets/voz/<id>.alineacion.json y assets/voz/manifest.json

import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

interface Escena {
  id: string;
  inicio: number;
  duracion: number;
  texto_voz?: string;
  voz?: string;
}

const raiz = resolve(import.meta.dirname, "..");
const confirmar = process.argv.includes("--confirmar");
const carpetaVoz = join(raiz, "assets", "voz");

const storyPath = join(raiz, "storyboard.json");
if (!existsSync(storyPath)) {
  console.error("Falta storyboard.json. Se crea en la fase 1.");
  process.exit(1);
}
const escenas: Escena[] = (JSON.parse(readFileSync(storyPath, "utf8")) as { escenas: Escena[] }).escenas;
const aNarrar = escenas.filter((e) => (e.texto_voz ?? "").trim() !== "" && e.voz !== "no");

const caracteres = aNarrar.reduce((a, e) => a + (e.texto_voz ?? "").length, 0);
console.log(`Escenas con narración: ${aNarrar.length} de ${escenas.length}`);
for (const e of aNarrar) console.log(`  ${e.id}  ${e.duracion}s  ${(e.texto_voz ?? "").length} caracteres`);
console.log(`Total de caracteres: ${caracteres}`);

if (aNarrar.length === 0) {
  console.log("No hay texto de voz en storyboard.json. Nada que generar.");
  process.exit(0);
}

const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
const modelo = process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2";
if (!apiKey || !voiceId) {
  console.error("\nFaltan ELEVENLABS_API_KEY o ELEVENLABS_VOICE_ID en .env. Copia .env.example y complétalo.");
  process.exit(1);
}

if (!confirmar) {
  console.log("\nNo se generó nada. Esta acción usa ElevenLabs y consume créditos.");
  console.log("Confirma con: npm run voz -- --confirmar");
  process.exit(0);
}

mkdirSync(carpetaVoz, { recursive: true });

interface RespuestaAlineada {
  audio_base64: string;
  alignment?: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
}

const manifest: { id: string; inicio: number; archivo: string; duracion_audio_s: number }[] = [];

for (const e of aNarrar) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text: e.texto_voz, model_id: modelo }),
  });
  if (!res.ok) {
    console.error(`ElevenLabs respondió ${res.status} en la escena ${e.id}: ${await res.text()}`);
    process.exit(1);
  }
  const data = (await res.json()) as RespuestaAlineada;
  const mp3 = join(carpetaVoz, `${e.id}.mp3`);
  writeFileSync(mp3, Buffer.from(data.audio_base64, "base64"));
  writeFileSync(join(carpetaVoz, `${e.id}.alineacion.json`), JSON.stringify(data.alignment ?? {}, null, 2));

  const fin = data.alignment?.character_end_times_seconds ?? [];
  const duracionAudio = fin.length ? fin[fin.length - 1] : 0;
  manifest.push({ id: e.id, inicio: e.inicio, archivo: `assets/voz/${e.id}.mp3`, duracion_audio_s: Number(duracionAudio.toFixed(2)) });
  console.log(`✔ ${e.id}: ${duracionAudio.toFixed(2)}s de audio (escena de ${e.duracion}s)`);
  if (duracionAudio > e.duracion) {
    console.log(`  ! El audio de ${e.id} es más largo que su escena. Acorta el texto o amplía duracion.`);
  }
}

writeFileSync(join(carpetaVoz, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("\nListo. Revisa assets/voz/manifest.json y la sincronía antes de la fase 6.");
