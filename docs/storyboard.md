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
      "voz": "elevenlabs",
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
| `escenas[].duracion` | Duración en segundos | Se ajusta al audio en la fase 5 |
| `escenas[].texto_pantalla` | Texto visible en la escena | Respeta la zona segura |
| `escenas[].texto_voz` | Texto de la narración | Vacío o `"voz": "no"` si la escena no tiene voz |
| `escenas[].assets` | Rutas dentro de `assets/` que usa la escena | Por ejemplo `capturas/flujo-principal.mp4` |
| `escenas[].voz` | `elevenlabs`, `propia`, `no` | Sale del brief |
| `escenas[].transicion` | `corte`, `fundido`, `zoom`, etc. | Lo interpreta la composición |

## Reglas que `npm run preparar -- --fase 4` verifica
- El archivo existe y es JSON válido.
- Tiene al menos una escena.
- La suma de `duracion` es igual a `data-duration` de `#root` en `index.html`.

## Reglas de diseño que Claude sigue
- Las escenas no se solapan: cada `inicio` es el final de la anterior.
- Una escena sin texto de voz dura lo que tarda el movimiento, nunca menos de 2 segundos.
- Ningún texto en pantalla supera la zona segura (90% del ancho, 80% del alto).
