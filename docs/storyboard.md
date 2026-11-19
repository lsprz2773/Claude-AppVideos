# Storyboard (storyboard.json)

`storyboard.json` es la fuente de verdad del video. Claude lo crea en la fase 1 a partir de `storyboard.ejemplo.json`, y la composición de la fase 4 se construye desde él.

## Estructura

```json
{
  "video": { "formato": "16:9", "ancho": 1920, "alto": 1080, "fps": 30, "duracion_total_s": 12 },
  "escenas": [
    {
      "id": "e01",
      "inicio": 0,
      "duracion": 4,
      "objetivo": "Presentar el problema",
      "texto_pantalla": "Tus reportes tardan horas",
      "texto_voz": "Tus reportes tardan horas en prepararse.",
      "assets": [],
      "voz": "archivo",
      "transicion": "corte",
      "notas": ""
    }
  ]
}
```

## Campos

| Campo | Qué es | Notas |
|---|---|---|
| `video.formato` | 16:9, 9:16 o 1:1 | Sale del brief |
| `video.ancho` y `video.alto` | Resolución | 1920x1080, 1080x1920 o 1080x1080 |
| `escenas[].id` | Identificador único | Se usa como nombre de la narración (`assets/voz/<id>.mp3`) |
| `escenas[].inicio` | Segundo en que empieza la escena | Debe ser la suma de las duraciones anteriores |
| `escenas[].duracion` | Duración en segundos | Debe ser igual o mayor a la duración de su audio |
| `escenas[].texto_pantalla` | Texto visible en la escena | Respeta la zona segura |
| `escenas[].texto_voz` | Texto que tú grabas o generas en ElevenLabs | Claude lo escribe en la fase 1 y lo entrega en `guion.md` |
| `escenas[].assets` | Rutas dentro de `assets/` que usa la escena | Por ejemplo `capturas/flujo-principal.mp4` |
| `escenas[].voz` | `archivo` o `no` | `archivo`: hay un audio en `assets/voz/<id>.mp3`. `no`: la escena no tiene narración |
| `escenas[].transicion` | `corte`, `fundido`, `zoom`, etc. | Lo interpreta la composición |

## Reglas que `npm run preparar -- --fase 4` verifica
- El archivo existe y es JSON válido.
- Tiene al menos una escena.
- La suma de `duracion` es igual a `data-duration` de `#root` en `index.html`.
- En la fase 5: cada escena con `texto_voz` tiene su audio en `assets/voz/<id>.mp3` (o `.wav`, `.m4a`), y el audio no dura más que la escena (se mide con ffprobe).

## Reglas de diseño que Claude sigue
- Las escenas no se solapan: cada `inicio` es el final de la anterior.
- Una escena sin texto de voz dura lo que tarda el movimiento, nunca menos de 2 segundos.
- Ningún texto en pantalla supera la zona segura (90% del ancho, 80% del alto).
