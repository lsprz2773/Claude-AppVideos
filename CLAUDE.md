# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Plantilla de video promocional con HyperFrames

Este repositorio es la plantilla. Cada video se hace en un clon de esta plantilla. Trabaja solo dentro del clon del video que el usuario abrió.

Lee antes el `README.md` (pasos de uso) y `docs/instalacion.md` (requisitos y skills opcionales). El formato del storyboard está en `docs/storyboard.md`.

## Ramas de git
- `main`: plantilla base estable. Solo recibe cambios ya probados desde `develop`, y solo cuando el usuario lo pide.
- `develop`: rama de trabajo sobre la plantilla.
- `feature/<nombre>`: una rama por cada cambio. Se integra a `develop` con `--no-ff` al terminar.
- Cada video se hace en su clon. Los cambios a la plantilla se hacen en el repo base, no en el clon de un video.
- No hacer `push` a ningún remoto. El usuario sube los cambios desde su terminal.
- Mensajes de commit en español, con estas líneas finales:
  Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01NQefrum4TsQhwwRso6pZwy

## Cómo hablas con el usuario en cada fase
Al entrar a cada fase, Claude hace lo mismo, en este orden:
1. Ejecuta `npm run preparar -- --fase N`, con N el número de la fase.
2. Le muestra al usuario la lista de requisitos con su estado: ✔ listo, ✖ falta y bloquea, ! aviso opcional.
3. Si falta algo que bloquea, dice exactamente qué es, dónde va y cómo se consigue. No avanza.
4. Si todo está listo, hace el trabajo de la fase y, al terminar, resume lo hecho y lo que sigue.
5. Cierra con una pregunta de aprobación (el gate). No pasa a la siguiente fase sin un sí explícito.

Si el usuario pregunta "¿qué me falta?", ejecuta `npm run preparar` sin fase y responde con la lista.

## Flujo por fases

**Fase 0. Brief** (`npm run preparar -- --fase 0`)

Cada vez que el usuario clona la plantilla para un video nuevo, esta fase es obligatoria y va antes que cualquier otra cosa. Claude no llena `brief.md` con supuestos ni por su cuenta.

Procedimiento:
1. Revisa `brief.md`. Si ya tiene respuestas de un video anterior, avisa al usuario y pregunta si el video nuevo es distinto. No reutiliza respuestas sin confirmar.
2. Hace TODAS estas preguntas de una sola vez, agrupadas. Las cerradas con AskUserQuestion, las abiertas en texto:
   - **Formato:** 16:9, 9:16, 1:1 o varios (con master 16:9). Es lo primero.
   - **Duración objetivo** en segundos.
   - **Datos generales:** producto o app, objetivo del video, público, plataforma de publicación, fecha de lanzamiento (opcional), idioma de narración y subtítulos.
   - **Tono y estilo:** tono, colores de marca, tipografías (con licencia).
   - **Voz:** mi voz generada con ElevenLabs, grabación propia, sin narración o decidir después. Si elige ElevenLabs o grabación, recuerda que los audios van en `assets/voz/<id>.mp3`.
   - **Sonidos y música:** sonidos de Openverse, o sin música ni efectos.
   - **Aplicación a grabar:** en la máquina del usuario (pedir `APP_URL`), desplegada (pedir la URL), o no hay app.
   - **Guion:** el usuario pega el guion o las ideas clave, o prefiere que Claude proponga uno.
   - **Referencias:** si tiene videos o enlaces de ejemplo para `referencias/`.
3. Si el usuario no responde algo, no lo inventa. Lo vuelve a preguntar una vez y, si sigue sin decidir, lo marca como "pendiente" en `brief.md` y lo dice en voz alta.
4. Con las respuestas, llena `brief.md`, corre `npm run preparar -- --fase 0` y le muestra el resultado.
5. Gate: el usuario aprueba el brief antes de pasar a la fase 1.

**Fase 1. Borrador** (`npm run preparar -- --fase 1`)
- Analiza `referencias/` (videos y `referencias/fuentes.md`) y escribe un análisis por referencia en `referencias/analisis/`. Extrae patrones, no copia.
- Redacta el guion y crea `storyboard.json` a partir de `storyboard.ejemplo.json`. Es la fuente de verdad. Formato en `docs/storyboard.md`.
- Entrega `guion.md`: el texto de narración de cada escena (con su id y su duración) para que lo grabes o lo pases a ElevenLabs.
- Hace una maqueta de cada escena con texto y placeholders. Gate: el usuario aprueba el guion y el storyboard.

**Fase 2. Assets** (`npm run preparar -- --fase 2`)
- Crea SVGs, íconos e ilustraciones propias en `assets/ilustraciones/`.
- Si el brief pide sonidos de la librería, busca con `npm run openverse -- buscar "<texto>"` y muestra la lista (título, creador, licencia, duración). El usuario elige. Solo entonces descarga con `npm run openverse -- descargar <id>`, que registra la licencia en `assets/sonidos/LICENSES.md`.
- Gate: el usuario aprueba los assets creados.

**Fase 3. Pausa de recursos** (`npm run preparar -- --fase 3`)
Esta fase es una pausa obligatoria. Claude se detiene y lista exactamente lo que falta, con nombre de archivo, carpeta y especificación:
- Capturas de la app: si la app corre en la máquina del usuario, pide que la deje abierta en `APP_URL`. Luego graba con `npm run record -- --nombre <nombre>`. Los pasos se ajustan en `grabaciones/pasos.ts`.
- Logos en `assets/logos/` (SVG preferido).
- Fuentes con licencia en `assets/fuentes/`.
- Voz: tus audios en `assets/voz/<id>.mp3`, uno por escena con narración.
- Sonidos ya descargados y su `LICENSES.md`.
- Narración: tú generas o grabas los audios de cada escena y los pones en `assets/voz/` con el nombre de la escena (`e01.mp3`, `e02.mp3`, …). Claude no genera voz ni usa servicios de voz. Claude te entrega el guion por escena en `guion.md`.
- Gate: el usuario confirma que ya subió los recursos o que decide seguir sin alguno.

**Fase 4. Edición** (`npm run preparar -- --fase 4`)
- Construye la composición en `index.html`, la raíz del video. Cada escena es un elemento con `class="escena clip"`, `data-start`, `data-duration` y `data-track-index`.
- La duración de `#root` (`data-duration`) debe igualar la suma de `duracion` de las escenas. `preparar` lo verifica.
- Todo lo animado sale de una línea de tiempo de GSAP con `{ paused: true }`, registrada en `window.__timelines["promo"]`. Nunca usar `Date.now()`, `setTimeout` ni `requestAnimationFrame` para el tiempo.
- Usa `compositions/` solo para subcomposiciones, si el video las necesita.
- Revisa con `npm run check` (estructura, runtime, layout, movimiento y contraste en un solo comando) y con `npx hyperframes snapshot --at <segundos>` para ver fotogramas.
- Gate: el usuario revisa la vista previa con `npm run preview`.

**Fase 5. Voz y subtítulos** (`npm run preparar -- --fase 5`)
- Claude revisa que existan los audios de `assets/voz/` (uno por escena con `texto_voz`) con `npm run preparar -- --fase 5`. Mide la duración de cada audio con ffprobe.
- Si un audio dura más que su escena, Claude propone acortar el texto o ampliar `duracion` y vuelve a la fase 4. Si falta uno, lo pide tal cual: `assets/voz/<id>.mp3`.
- Narración en la línea de tiempo: `<audio>` con `data-start` y `data-duration` por escena, apuntando a `assets/voz/<id>.mp3`.
- Tiempos por palabra: `npm run transcribir` pasa cada audio por Whisper (local, con `hyperframes transcribe`) y deja `assets/voz/<id>.palabras.json`. Cada palabra trae `inicio`/`fin` dentro del audio e `inicio_video`/`fin_video` ya sumados al `inicio` de la escena. Si el script avisa que la coincidencia con `texto_voz` es baja, Claude se lo dice al usuario: puede que la grabación diga otra cosa que el guion.
- Subtítulos: texto HTML animado desde la misma línea de tiempo de GSAP, con los tiempos de `inicio_video` y `fin_video` de `<id>.palabras.json`. Se muestran en grupos cortos (de 2 a 5 palabras, cortando en la puntuación) y cada palabra se resalta en su momento. La ortografía sale de `texto_voz`; de Whisper solo se toman los tiempos. Ningún subtítulo pasa del final de su escena.
- Si Whisper no está disponible, los subtítulos van por bloque: uno por escena, desde su `inicio` y con la duración del audio (medida con ffprobe), sin pasar de la `duracion` de la escena. Claude avisa al usuario de este cambio.
- Sonido de diseño con real-sfx, opcional (ver sección de skills). Se hace después de la voz, porque la voz fija los tiempos.
- Gate: el usuario aprueba la sincronía.

**Fase 6. Revisión** (`npm run preparar -- --fase 6`)
- Corre `npm run check`, `npm run inspect` (solapamientos, texto cortado, elementos fuera del cuadro) y `npm run validate`.
- Revisa con capturas en cortes clave (`npx hyperframes snapshot --at ...`).
- Revisa audio: que la voz no compita con los efectos. Si hay real-sfx, lista los momentos para escuchar con audífonos, porque el script no escucha.
- Si algo falla, vuelve a la fase 4. Máximo dos o tres iteraciones antes de consultar al usuario.
- Gate: el usuario aprueba la revisión.

**Fase 7. Entrega** (`npm run preparar -- --fase 7`)
- Render final: `npm run render` deja `out/promo.mp4`. Para un borrador rápido: `npm run render:draft`.
- Verificación técnica: `npm run review` (duración, resolución, audio y coincidencia con el storyboard).
- Formatos derivados: si el brief pide 9:16 o 1:1 además de 16:9, Claude copia `index.html` a `compositions/formato-9x16.html` (o `formato-1x1.html`), cambia `data-width`, `data-height` y el tamaño de `html` y `body`, y renderiza ese archivo con `npx hyperframes render -c compositions/formato-9x16.html -o out/promo-9x16.mp4 -q high`. Ajusta la posición de los elementos a la zona segura del nuevo formato.
- Actualiza `progreso.md` y deja en `out/` el MP4 y el reporte de revisión.

## Reglas de trabajo
- Dependencias: `npm install` al clonar. Todo va en `package.json`. No instalar paquetes sueltos fuera de él.
- Requisitos: Node.js 22 o superior, FFmpeg, Git. Para subtítulos por palabra, Whisper (ver `docs/instalacion.md`). Verificar con `npm run preparar`.
- Actualizar `progreso.md` al cerrar cada fase: marcar la casilla, anotar decisiones y pendientes.
- `storyboard.json` manda sobre cualquier otro documento. Si cambia el guion, se cambia primero ahí.
- Las claves de API van en `.env`, nunca en archivos versionados.
- Servicios externos: Openverse, skills de terceros y descargas grandes requieren confirmación del usuario antes de usarse. La voz no la genera Claude: la pone el usuario en `assets/voz/`.
- No copiar videos ni diseños de terceros. Las referencias sirven para analizar patrones.
- Los videos de referencia y los archivos pesados no se versionan (ver `.gitignore`).
- Sin texto de notas o advertencias dentro del video final, salvo lo que el brief pida.
- Márgenes: la zona segura es 90% del ancho y 80% del alto. Ningún texto se pega al borde.

## Sonidos de la librería (Openverse)
Openverse da acceso a obras con licencias abiertas. El script `scripts/openverse.ts` usa su API directamente.
- Búsqueda: `npm run openverse -- buscar "<texto>" [--n 10] [--licencia cc0,by]`. Los resultados se guardan en `assets/sonidos/busquedas/`.
- Descarga: `npm run openverse -- descargar <id> [--nombre <nombre>]`. Guarda el archivo y agrega una fila en `assets/sonidos/LICENSES.md` con fuente, licencia y atribución.
- Autenticación: opcional. Con `OPENVERSE_CLIENT_ID` y `OPENVERSE_CLIENT_SECRET` se obtiene un token. Sin ellas hay acceso anónimo con límite bajo.
- Antes de usar un sonido, Claude confirma la licencia en la página de origen (`foreign_landing_url`), no solo en la API.
- Si la licencia exige atribución, se incluye en los créditos del video.
- Sin scraping ni varias cuentas para evadir límites.

## Diseño sonoro (skill real-sfx)
Opcional. Solo si el usuario la instaló (ver `docs/instalacion.md`). Reglas:
- Solo sonidos grabados reales. Si no hay sonido adecuado, se usa la librería de Openverse o no se pone efecto.
- Entrada: `from_hyperframes.py` toma los `data-start` de la composición como momentos del sonido.
- Biblioteca: los sonidos de `assets/sonidos/` se agregan con `setup.py add-library`.
- Trabajo: los archivos temporales de real-sfx van en `work/` y `result/`, dentro del clon. Solo el MP4 final, el WAV de efectos y el reporte se copian a `out/`.
- No activar el oyente externo (que envía audio a un servicio) ni descargar modelos opcionales sin confirmación.

## Escenas dibujadas en HTML (skill html-demo)
Opcional. Para escenas de interfaz que no se pueden grabar. La grabación real con Playwright sigue siendo el camino principal. Reglas:
- Copia los archivos que usa la escena a `compositions/html-demo/` y adáptalos. No modifiques la skill instalada. Conserva el aviso de licencia MIT.
- Quita los temporizadores en tiempo real. Cada escena lee su progreso de la línea de tiempo de GSAP, que se puede posicionar en cualquier momento.
- Usa un sujeto propio o de libre uso. Los textos y números de la interfaz se copian de la app real, no de memoria.

## Cómo encajan los scripts
- `scripts/preparar.ts` lee `brief.md` con expresiones regulares: casillas `- [x] <opción>` (formato, voz, sonidos) y líneas `- <Campo>:` (producto, objetivo, público, plataforma, idioma, tono). Si cambias los títulos u opciones de `brief.md` en la plantilla, cambia también esas expresiones, o el preflight marcará campos vacíos.
- `preparar` compara la suma de `escenas[].duracion` de `storyboard.json` con el `data-duration` de `id="root"` en `index.html`, y busca la voz de cada escena con `texto_voz` y `voz` distinto de `"no"` en `assets/voz/<id>` con extensión `.mp3`, `.wav` o `.m4a`. Sale con código 1 si hay bloqueos de la fase pedida.
- `npm run record` ejecuta los pasos de `grabaciones/pasos.ts` con Playwright y deja `assets/capturas/<nombre>.mp4` más `grabaciones/raw/<nombre>.marcas.json` (segundo en que ocurrió cada paso, para sincronizar con la voz).
- `scripts/transcribir.ts` llama a `node_modules/hyperframes/bin/hyperframes.mjs transcribe --engine whisper` por escena, en una carpeta temporal dentro de `.hyperframes/` (hyperframes siempre escribe `transcript.json` en `--dir`). El idioma sale de `--idioma` o de la línea "Idioma de narración y subtítulos" de `brief.md`; el modelo por defecto es `small` (multilingüe). En Windows busca `whisper-cli.exe` en `HYPERFRAMES_WHISPER_PATH` de `.env` o, si está vacío, en `~/.cache/whisper-cpp/bin/Release/`, y se la pasa a hyperframes. `preparar` revisa la misma ruta en la fase 5.
- `scripts/revisar.ts` mide `out/promo.mp4` con ffprobe y compara su duración con `storyboard.json`.
- `hyperframes.json` fija las rutas: bloques en `compositions/`, componentes en `compositions/components/`, assets en `assets/`.
- No hay pruebas automáticas. Para los scripts TypeScript (se ejecutan con `tsx`), la única revisión es `npm run typecheck`.

## Comandos
- `npm run preparar -- --fase N`: revisa los requisitos de la fase N.
- `npm run preview`: vista previa en el navegador.
- `npm run check`: estructura, runtime, layout, movimiento y contraste.
- `npm run inspect` y `npm run lint` y `npm run validate`: revisiones individuales.
- `npm run record -- --nombre <nombre>`: graba la app desde `APP_URL`.
- `npm run openverse -- buscar|descargar`: sonidos de Openverse.
- `npm run transcribir [-- --escena e01] [--idioma es] [--modelo small]`: tiempos por palabra de la voz con Whisper.
- `npm run review`: revisión técnica del MP4.
- `npm run render` y `npm run render:draft`: render final y borrador.
- `npm run typecheck`: revisa los scripts de la plantilla.
