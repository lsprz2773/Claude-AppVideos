# Plantilla de video promocional

Plantilla para crear videos promocionales con **HyperFrames** (HTML animado que se renderiza a MP4) y **Claude Code**. Trabajas por fases con aprobación en cada una. Claude te dice en cada fase qué necesita y qué le falta.

Este repositorio es la **base**. Para cada video, clónala en su propia carpeta.

## Antes de empezar: requisitos

Instala estas herramientas una sola vez en tu máquina:

1. **Node.js 22 o superior** (`node -v`)
2. **FFmpeg**, con `ffmpeg` y `ffprobe` en el PATH (`ffmpeg -version`)
3. **Git** (`git --version`)
4. **Claude Code** (`claude --version`)

Instrucciones por sistema operativo en [`docs/instalacion.md`](docs/instalacion.md).

## Paso 1. Clonar la plantilla para tu video

```bash
git clone -b develop https://github.com/lsprz2773/Claude-AppVideos.git mi-video
cd mi-video
npm install
npx playwright install chromium
```

`npm install` descarga las dependencias. `npx playwright install chromium` descarga el navegador que graba tu app (solo se hace una vez).

## Paso 2. Preparar el entorno

```bash
cp .env.example .env
```

Abre `.env` y completa lo que tengas. Puedes dejar vacío lo que no uses todavía:

- `APP_URL`: la dirección de la app a grabar (por ejemplo `http://localhost:3000`).
- `OPENVERSE_CLIENT_ID` y `OPENVERSE_CLIENT_SECRET`: opcionales, para buscar sonidos con más límite.

Después revisa el estado general:

```bash
npm run preparar
```

Te dirá qué está listo (✔), qué falta y bloquea (✖) y qué es opcional (!).

## Paso 3. Llenar el brief

Abre `brief.md` y completa lo que sepas. Lo mínimo:

- **Formato**: marca 16:9, 9:16, 1:1 o varios.
- **Producto, objetivo, público, plataforma, idioma y tono.**
- **Voz** y **sonidos**: marca la opción que quieras.

Si no tienes el guion, déjalo en blanco. Claude te propone uno en la fase 1.

## Paso 4. Poner tus referencias (opcional)

- Videos de ejemplo en `referencias/`. No se versionan por su tamaño.
- Enlaces con una nota en `referencias/fuentes.md`.

Plataformas como YouTube o TikTok no se pueden descargar desde el workspace de Claude. Descarga tú el archivo y ponlo en `referencias/`.

## Paso 5. Abrir Claude Code y empezar

Dentro de la carpeta del video:

```bash
claude
```

Primer mensaje sugerido:

> Lee CLAUDE.md y brief.md. Empieza la fase 0 y dime qué me falta antes de avanzar.

Claude ejecutará `npm run preparar` y te mostrará la lista. Responde las preguntas que te haga y él llenará `brief.md`.

## Las fases

| Fase | Qué pasa | Qué necesitas tú |
|---|---|---|
| 0. Brief | Claude hace preguntas y llena `brief.md` | Responder y aprobar el brief |
| 1. Borrador | Análisis de referencias, guion y `storyboard.json` | Aprobar el guion |
| 2. Assets | SVGs, íconos e ilustraciones. Búsqueda de sonidos si los pides | Elegir sonidos de la lista |
| 3. Pausa de recursos | Claude se detiene y lista lo que falta | Subir capturas (`npm run record`), logos, fuentes y voz |
| 4. Edición | Composición en HyperFrames y vista previa | Revisar con `npm run preview` |
| 5. Voz y subtítulos | Claude revisa tus audios y crea los subtítulos sincronizados | Poner `assets/voz/<id>.mp3` por escena y aprobar la sincronía |
| 6. Revisión | Solapamientos, texto cortado, subtítulos y audio | Revisar capturas y escuchar los momentos marcados |
| 7. Entrega | Render final en `out/` y revisión técnica | Revisar `out/promo.mp4` |

En cualquier momento puedes preguntar "¿qué me falta?" y Claude ejecuta `npm run preparar`.

## Comandos principales

```bash
npm run preparar -- --fase 3   # requisitos de una fase concreta
npm run preview                # vista previa en el navegador
npm run check                  # revisión completa de la composición
npm run record -- --nombre flujo-principal   # graba la app desde APP_URL
npm run openverse -- buscar "whoosh" # busca sonidos abiertos
npm run review                 # revisa el MP4 final
npm run render                 # render final en out/promo.mp4
```

## Dónde está cada cosa

- `brief.md`: lo que pides para el video.
- `storyboard.json`: escenas, tiempos y textos. Es la fuente de verdad (`docs/storyboard.md`).
- `index.html`: la composición principal de HyperFrames.
- `assets/`: capturas, voz (tus audios por escena), sonidos, logos, fuentes e ilustraciones.
- `guion.md`: el texto de narración de cada escena, para que lo grabes o lo generes en ElevenLabs.
- `grabaciones/`: script que graba tu app con Playwright (`pasos.ts` se adapta a tu app).
- `referencias/`: videos y enlaces de ejemplo.
- `progreso.md`: estado de cada fase, decisiones y pendientes.
- `out/`: el MP4 final.
- `CLAUDE.md`: las reglas que sigue Claude (no hace falta editarlo).

## Ramas

- `main`: plantilla estable.
- `develop`: trabajo sobre la plantilla.
- Cada video se hace en su clon, y su resultado queda en `out/`.
