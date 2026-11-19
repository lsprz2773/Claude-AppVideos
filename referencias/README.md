# Referencias

Esta carpeta guarda videos y enlaces que sirven de ejemplo para el tuyo.

## Qué agregar
- **Videos descargados** (mp4, mov, webm) en `referencias/`. No se versionan por su tamaño.
- **Enlaces** en `fuentes.md`, con una nota de qué quieres tomar de cada uno.
- Puedes agregar varios por tipo: uno para ritmo, otro para subtítulos, otro para transiciones.

## Qué hace Claude con ellos
En la fase 1 (borrador) Claude:
1. Extrae fotogramas en los cortes con `ffmpeg` y mide la duración de cada plano.
2. Describe ritmo, transiciones, zoom, tipografía, tamaño y posición de subtítulos, y uso de sonido.
3. Escribe un análisis por referencia en `analisis/<nombre>.md`.
4. Usa esos patrones para proponer el guion y el `storyboard.json`.

## Reglas
- Se toman patrones, no se copian escenas, textos, música ni diseños.
- Los enlaces de plataformas como YouTube o TikTok los descargas tú. El workspace no puede acceder a esos sitios.
- Si una referencia tiene música o fuentes con licencia, no las reutilices sin permiso.
