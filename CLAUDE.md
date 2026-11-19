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

0. **Brief.** Lo primero es confirmar el formato en `brief.md` (16:9, 9:16 o 1:1). Si el formato no está definido, preguntar antes de cualquier otra cosa. Confirmar duración, objetivo y tono.
1. **Borrador.** Analizar las referencias de `referencias/` (videos y `fuentes.md`) y escribir un análisis por cada una en `referencias/analisis/`. Extraer patrones, no copiar. Redactar el guion y crear `storyboard.json` como fuente de verdad: id, texto, duración, recursos y movimientos de cámara por escena. Generar una maqueta en PNG con placeholders.
2. **Assets.** Crear SVGs, íconos e ilustraciones propias en `src/assets/`.
3. **Pausa de recursos.** Detenerse y listar exactamente qué archivos faltan, con nombre y especificaciones. Pedir la voz: el ID de voz de ElevenLabs o el archivo en `recursos/voz/`. Pedir capturas, logos, fuentes con licencia y sonidos.
4. **Edición.** Construir las escenas en Remotion (`src/`), con transiciones, cursor, zoom y animaciones.
5. **Voz y subtítulos.** Generar la narración con ElevenLabs usando la voz elegida, ajustar la duración de cada escena al audio y crear los subtítulos desde los timestamps.
6. **Revisión.** Verificar automáticamente: solapamientos, texto cortado, subtítulos sincronizados, legibilidad y audio parejo. Extraer capturas en cortes clave con `ffmpeg` y revisarlas. Si algo falla, regresar a la fase 4. Máximo dos o tres iteraciones antes de consultar al usuario.
7. **Entrega.** Render final en `out/`, con el reporte de revisión.

## Reglas de trabajo
- Actualizar `progreso.md` al cerrar cada fase: marcar la casilla, anotar decisiones y pendientes.
- `storyboard.json` manda sobre cualquier otro documento. Si cambia el guion, se cambia primero ahí.
- Las claves de API van en `.env`, nunca en archivos versionados.
- Sonidos de la librería: registrar cada uno en `recursos/sonidos/LICENSES.md` con fuente y licencia. Si la licencia exige atribución, incluirla en los créditos del video.
- No copiar videos ni diseños de terceros. Las referencias sirven para analizar patrones.
- Los videos de referencia no se versionan (ver `.gitignore`). Sus análisis en `referencias/analisis/` sí.

## Comandos (se agregan con el proyecto de Remotion en la fase 4)
- `npm run record`: graba la app desde `APP_URL` con Playwright.
- `npm run voice`: genera la narración con ElevenLabs.
- `npm run render`: renderiza el video a `out/`.
- `npm run review`: ejecuta las verificaciones de la fase 6.
