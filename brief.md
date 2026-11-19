# Brief del video

> Llena este archivo antes de pedir el video. Claude lo lee en la fase 0.

## Formato (obligatorio, se elige primero)
- [ ] 16:9 (1920×1080)
- [ ] 9:16 (1080×1920)
- [ ] 1:1 (1080×1080)
- [ ] Varios formatos (master 16:9 + derivados)

## Datos generales
- Producto o app:
- Objetivo del video:
- Público:
- Plataforma de publicación:
- Fecha de lanzamiento:
- Idioma de narración y subtítulos:

## Duración
- Duración objetivo: 1 a 2 minutos (ej. 60 s)

## Tono y estilo
- Tono (ej. cercano, técnico, enérgico):
- Colores de marca:
- Tipografías (con licencia):

## Voz
- [ ] Mi voz generada con ElevenLabs (yo genero el audio; Claude te entrega el guion)
- [ ] Grabación propia
- [ ] Sin narración

Los audios se ponen en `assets/voz/` con el nombre de la escena: `e01.mp3`, `e02.mp3`, etc. Claude te dice cuáles faltan en la fase 5.

## Aplicación a grabar
- APP_URL: se define en `.env`. Las capturas se graban con `npm run record`.
- ¿La app corre en tu máquina o está desplegada?:

## Guion
(Pega aquí el guion base o las ideas clave. Claude lo convierte en `storyboard.json` en la fase 1. Si lo dejas vacío, Claude propone uno.)

## Sonidos y música
- [ ] Usar sonidos de Openverse (se descargan en `assets/sonidos/` con `LICENSES.md`)
- [ ] Sin música ni efectos
