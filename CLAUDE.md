# Plantilla de video promocional

Este repositorio es una plantilla que se clona para cada video. Trabaja siempre sobre el video que describe `brief.md`.

## Ramas de git
- `main`: plantilla base estable. Solo recibe cambios ya probados desde `develop`.
- `develop`: rama de trabajo sobre la plantilla. Todo el trabajo diario va aquí.
- Este repo es solo la base. Cada video se hace en un clon de esta plantilla, y su resultado final (MP4 y proyecto) queda en su carpeta `out/` y en el clon. Los cambios a la plantilla se hacen aquí, no en el clon de un video.
- `feature/XXXXX`: una rama por cada feature (por ejemplo `feature/escena-intro`, `feature/subtitulos`). Se integra a `develop` al terminar.
- No hacer push a ningún remoto sin que el usuario lo pida. El repo se conecta cuando el usuario lo indique.
- Mensajes de commit en español, con esta línea final:
  Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>

## Flujo por fases
El video avanza por fases en este orden. No se pasa a la siguiente sin aprobación explícita del usuario en el gate de la fase actual.

0. **Brief.** Claude hace las preguntas necesarias y escribe `brief.md` con las respuestas del usuario. Empieza siempre por el formato (16:9, 9:16 o 1:1). Las preguntas cubren: objetivo, público, plataforma, fecha de lanzamiento, duración, tono, colores y tipografías (con licencia), idioma, voz (ElevenLabs o propia), sonidos y música, y dónde corre la app. No se avanza a la fase 1 sin aprobación del brief.
1. **Borrador.** Analizar las referencias de `referencias/` (videos y `fuentes.md`) y escribir un análisis por cada una en `referencias/analisis/`. Extraer patrones, no copiar. Redactar el guion y crear `storyboard.json` como fuente de verdad: id, texto, duración, recursos y movimientos de cámara por escena. Generar una maqueta en PNG con placeholders.
2. **Assets.** Crear SVGs, íconos e ilustraciones propias en `src/assets/`.
3. **Pausa de recursos.** Detenerse y listar exactamente qué archivos faltan, con nombre y especificaciones. Pedir la voz: el ID de voz de ElevenLabs o el archivo en `recursos/voz/`. Pedir capturas, logos, fuentes con licencia y sonidos.
4. **Edición.** Construir la composición en HyperFrames: `index.html` y `src/`, con elementos HTML que declaran su tiempo con `data-start`, `data-duration` y `data-track-index`. Las transiciones, el cursor, el zoom y las animaciones salen de una línea de tiempo de GSAP creada con `{ paused: true }` y registrada en `window.__timelines`. Revisar con `npm run preview`.
5. **Voz y subtítulos.** Generar la narración con ElevenLabs usando la voz elegida, ajustar la duración de cada escena al audio y crear los subtítulos desde los timestamps. La narración entra como `<audio>` con `data-start` y `data-duration`. Los subtítulos son texto HTML animado con la misma línea de tiempo.
6. **Revisión.** Correr `npm run lint` (estructura de la composición), `npm run inspect` (solapamientos, texto cortado y elementos fuera del cuadro) y `npm run validate` (contraste y líneas de tiempo). Además verificar subtítulos sincronizados y audio parejo, y extraer capturas en cortes clave con `ffmpeg`. Si algo falla, regresar a la fase 4. Máximo dos o tres iteraciones antes de consultar al usuario.
7. **Entrega.** Render final con `npm run render` en `out/`, con el reporte de revisión.

## Reglas de trabajo
- Dependencias: el proyecto se instala con `npm install` al clonar. Todas las librerías van en `package.json`, incluida la de sonidos cuando se defina. No instalar paquetes sueltos fuera de él.
- Requisitos: Node.js 22 o superior y FFmpeg. Verificar con `npx hyperframes doctor`.
- Actualizar `progreso.md` al cerrar cada fase: marcar la casilla, anotar decisiones y pendientes.
- `storyboard.json` manda sobre cualquier otro documento. Si cambia el guion, se cambia primero ahí.
- Las claves de API van en `.env`, nunca en archivos versionados.
- Sonidos de la librería: registrar cada uno en `recursos/sonidos/LICENSES.md` con fuente y licencia. Si la licencia exige atribución, incluirla en los créditos del video.
- No copiar videos ni diseños de terceros. Las referencias sirven para analizar patrones.
- Los videos de referencia no se versionan (ver `.gitignore`). Sus análisis en `referencias/analisis/` sí.

## Sonidos (API de Openverse)
La búsqueda de sonidos se hace con la API de audio de Openverse, que da acceso a obras con licencias abiertas.
- Referencias: https://docs.openverse.org/api/reference/made_with_ov.html (presentación de la API) y https://api.openverse.org/v1/ (documentación de la API).
- Búsqueda: `GET /v1/audio/` con el parámetro `q` para las palabras clave. Filtrar por licencia y por duración según lo que pida el video. Verificar el nombre exacto de cada filtro en la documentación al implementar.
- Autenticación: la API permite acceso anónimo, pero con límites bajos. Se usa una aplicación OAuth registrada en Openverse. `OPENVERSE_CLIENT_ID` y `OPENVERSE_CLIENT_SECRET` van en `.env`, y se pide un token antes de buscar. Autenticarse activa el nivel estándar de límites.
- Cliente: preferir el paquete oficial `@openverse/api-client`, para no escribir la autenticación a mano. Se agrega a `package.json` en la fase 3.
- Flujo: en la fase 3 Claude hace las búsquedas y te muestra los resultados (título, creador, licencia, duración). Tú eliges cuáles usar. Solo después se descargan a `recursos/sonidos/`.
- Licencias: Openverse indica que no garantiza la exactitud de su información de licencias. Antes de usar un sonido, Claude verifica la licencia en la página de origen de cada resultado, no solo en la API.
- Registro: cada sonido usado se anota en `recursos/sonidos/LICENSES.md` con título, creador, licencia, enlace de origen y la atribución que indique la API.
- Atribución: si la licencia la exige, se incluye en los créditos del video.
- Uso: no hacer scraping ni usar varias cuentas para evadir límites, y respetar los términos de uso de Openverse.

## Diseño sonoro (skill real-sfx)
El diseño de sonido se hace con la skill `real-sfx` (Clipwing/skills, carpeta `skills/real-sfx`), instalada globalmente en la máquina del usuario. Reglas:
- Solo sonidos grabados reales. Nunca sintetizados, salvo los de uisfx para interfaz; si se quiere evitarlos, usar `--ui library`.
- Fuente: los sonidos de Openverse de la fase 3 se guardan en `recursos/sonidos/` y se agregan a real-sfx como biblioteca con `setup.py add-library`, para que la skill los elija.
- Entrada: real-sfx lee la composición de HyperFrames con `from_hyperframes.py`, que toma los `data-start` como momentos del sonido. Si hace falta una lista aparte, se genera `cues.json` desde `storyboard.json` y se usa con `from_cues.py`.
- Orden: el sonido se diseña en la fase 5, después de la voz, porque la voz define los tiempos.
- La música y la voz del video se conservan. Los efectos se ponen encima con `--duck` o `--voice-safe`.
- Trabajo: los archivos de trabajo de real-sfx van en `work/` y `result/` dentro del clon. Solo el MP4 final, el WAV de efectos y el reporte se copian a `out/`.
- Revisión: en la fase 6 se corren `verify.py` y `critique.py` de real-sfx y se lee su lista de momentos a escuchar. Esos momentos los escucha el usuario con audífonos. El script no escucha.
- No activar el oyente externo (claudio con Gemini), porque envía el audio a un servicio externo. Tampoco descargar los modelos opcionales (`hear.py`, `listen.py install`) sin confirmación.
- Antes de usar la skill en un clon, correr `python scripts/setup.py check` desde su carpeta. Requiere Python y ffmpeg.

## Instalación de real-sfx (para Claude Code)
Cuando el usuario pida instalar la skill, o antes de usarla en un clon, seguir estos pasos en orden. Pedir confirmación antes de cada paso que escriba fuera de la carpeta del video o que descargue algo grande.

1. **Requisitos.** Verificar `python --version` (recomendado Python 3.12) y `ffmpeg -version`. Si faltan, mostrar el comando y esperar confirmación. En Windows: `winget install Python.Python.3.12` y `winget install Gyan.FFmpeg`. En macOS: `brew install ffmpeg-full`.
2. **Licencia.** El repositorio `Clipwing/skills` no declara licencia. Mostrárselo al usuario y pedir confirmación antes de instalar.
3. **Código.** Clonar en una carpeta temporal: `git clone --depth 1 https://github.com/Clipwing/skills <carpeta-temporal>`. Anotar el commit del clon.
4. **Copia global.** Copiar `skills/real-sfx` a la carpeta de skills del usuario:
   - Windows: `%USERPROFILE%\.claude\skills\real-sfx`
   - macOS: `~/.claude/skills/real-sfx`
   Si la carpeta ya existe, preguntar antes de reemplazarla. No borrar nada sin confirmación.
5. **Verificación.** Desde la carpeta instalada, correr `python scripts/setup.py check`. ffmpeg y uisfx deben salir como `ok`.
6. **uisfx.** El repositorio ya trae `vendor/node_modules/uisfx`, así que normalmente no hace falta instalarlo. Si falta, `python scripts/setup.py init --uisfx` (requiere Node.js y npm).
7. **Bibliotecas.** Cuando haya sonidos en `recursos/sonidos/`, agregarlos con `python scripts/setup.py add-library NOMBRE RUTA --index` y luego `python scripts/build_index.py`.
8. **Lo que no se instala sin confirmación.** Modelos opcionales (`hear.py install`, `listen.py install`, unos 3 GB en total según el caso) y el oyente externo con Gemini.
9. **Cierre.** Informar al usuario la ruta instalada, el commit del clon y el resultado de `setup.py check`. Eliminar la carpeta temporal solo con su permiso.

## Escenas dibujadas en HTML (skill html-demo)
Modo alternativo para escenas que no se pueden grabar: la app no está disponible, o la escena muestra un concepto de interfaz. La grabación real con Playwright sigue siendo el camino principal. La skill es `html-demo` de MengTo/Skills (`skills/web-design/html-demo`, licencia MIT).

Reglas:
- **Instalación:** `npx skills add MengTo/Skills --skill html-demo`. Pedir confirmación al usuario antes de instalar.
- **No modificar la skill instalada.** Copiar `scripts/step-window.js`, `scripts/step-window.css` y los helpers a `src/html-demo/`, y adaptarlos ahí. Usar la versión sin React, porque HyperFrames trabaja con HTML. Conservar el aviso de licencia MIT en `src/html-demo/LICENSE`.
- **Reloj de HyperFrames.** La skill avanza con temporizadores en tiempo real. En HyperFrames el tiempo lo controla la línea de tiempo de GSAP, que se puede posicionar en cualquier momento. Quitar los temporizadores y los `IntersectionObserver`, y que cada escena lea su `t` de esa línea de tiempo. Las funciones `ease`, `typed` y `glide` ya son puras y se reutilizan tal cual.
- **Salida.** La escena es parte de la composición de HyperFrames, así que el MP4 sale de `npm run render`. `shoot.mjs` solo sirve para capturas de revisión en la fase 6.
- **Un solo ejemplo.** Usar un sujeto propio o de libre uso, nunca datos reales de clientes ni de personas. Los textos y los números de la interfaz se copian de la app real, no de memoria.
- **Sonido.** Las escenas dibujadas entran al mismo `cues.json` y pasan por `real-sfx`, igual que las grabadas.
- **Revisión.** En la fase 6 se revisa que los elementos dibujados no se encimen y que el puntero apunte a elementos reales.

## Comandos
- `npm run preview`: vista previa en el navegador con recarga en vivo (`hyperframes preview`).
- `npm run lint`: revisa la estructura de la composición.
- `npm run inspect`: revisa solapamientos, texto cortado y elementos fuera del cuadro.
- `npm run validate`: revisa contraste y líneas de tiempo.
- `npm run record`: graba la app desde `APP_URL` con Playwright.
- `npm run voice`: genera la narración con ElevenLabs.
- `npm run review`: ejecuta las verificaciones de la fase 6.
- `npm run render`: renderiza el MP4 final a `out/promo.mp4`.
