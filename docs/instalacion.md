# Instalación

Esta guía tiene los requisitos y las herramientas opcionales. Claude la usa cuando el usuario pide instalar algo, y pide confirmación antes de cada paso que escriba fuera de la carpeta del video o que descargue algo grande.

## Requisitos (obligatorios)

| Herramienta | Versión | Cómo comprobarla | Instalación |
|---|---|---|---|
| Node.js | 22 o superior | `node -v` | Windows: `winget install OpenJS.NodeJS.LTS`. macOS: `brew install node@22` |
| npm | incluido con Node | `npm -v` | Viene con Node |
| FFmpeg | cualquier versión reciente | `ffmpeg -version` y `ffprobe -version` | Windows: `winget install Gyan.FFmpeg`. macOS: `brew install ffmpeg` |
| Git | cualquiera | `git --version` | Windows: `winget install Git.Git`. macOS: `xcode-select --install` |
| Claude Code | la versión actual | `claude --version` | Según la documentación oficial de Claude Code |

Después de clonar el video, en su carpeta:

```bash
npm install
npx playwright install chromium
```

`npx playwright install chromium` descarga el navegador que usa la grabación de la app (unos 150 MB).

Para comprobar todo de una vez: `npm run preparar`.

## Variables de entorno

Copia `.env.example` a `.env` y completa lo que aplique:

| Variable | Para qué | Obligatoria en |
|---|---|---|
| `APP_URL` | URL de la app a grabar | Fase 3 (si hay capturas) |
| `OPENVERSE_CLIENT_ID` y `OPENVERSE_CLIENT_SECRET` | Búsqueda de sonidos con más límite (opcional) | No |

`.env` nunca se sube al repositorio.

## Skills opcionales de Claude Code

Estas skills no vienen con la plantilla. Se instalan una sola vez en la máquina del usuario.

### HyperFrames (recomendada)
La plantilla fija la versión 0.9.70 del paquete `hyperframes`, que ya está en `devDependencies`. Para las skills de Claude (guía de composición, referencias de movimiento y revisión):

```bash
npx hyperframes skills update
```

Las skills nuevas se cargan en una sesión nueva de Claude Code.

### real-sfx (sonidos reales, opcional)
Skill de Clipwing para poner efectos de sonido grabados reales. Su repositorio no declara licencia, así que el usuario debe confirmarlo antes de instalarla.

1. Requisitos: Python 3.12 recomendado y FFmpeg. Windows: `winget install Python.Python.3.12`. macOS: `brew install python@3.12`.
2. Confirmar con el usuario que acepta instalarla sin licencia declarada.
3. Clonar en una carpeta temporal: `git clone --depth 1 https://github.com/Clipwing/skills <carpeta-temporal>`. Anotar el commit.
4. Copiar `skills/real-sfx` a la carpeta de skills del usuario:
   - Windows: `%USERPROFILE%\.claude\skills\real-sfx`
   - macOS: `~/.claude/skills/real-sfx`
   Si ya existe, preguntar antes de reemplazar. No borrar nada sin confirmación.
5. Desde la carpeta instalada: `python scripts/setup.py check`. ffmpeg y uisfx deben salir como `ok`.
6. Si falta uisfx: `python scripts/setup.py init --uisfx` (requiere Node.js y npm).
7. Bibliotecas: cuando haya sonidos en `assets/sonidos/`, `python scripts/setup.py add-library NOMBRE RUTA --index` y luego `python scripts/build_index.py`.
8. No se instala sin confirmación: modelos opcionales (`hear.py install`, `listen.py install`, varios GB) ni el oyente externo que usa Gemini.
9. Al terminar, informar la ruta instalada, el commit y el resultado de `setup.py check`. Borrar la carpeta temporal solo con permiso.

### html-demo (escenas de interfaz dibujadas, opcional)
Skill de MengTo/Skills, con licencia MIT. Úsala solo si una escena de interfaz no se puede grabar.

1. Confirmar con el usuario antes de instalar.
2. Instalar con el comando que indique la documentación del repositorio `MengTo/Skills` (verificar el comando exacto antes de ejecutarlo).
3. En el clon, adaptar los archivos a la línea de tiempo de HyperFrames, como indica `CLAUDE.md`.

## Servicios externos

| Servicio | Qué hace | Costo o límite | Confirmación |
|---|---|---|---|
| ElevenLabs | Voz por escena | Lo usas tú, fuera de la plantilla | Generas cada audio y lo pones en `assets/voz/<id>.mp3`. Claude no llama a este servicio |
| Openverse | Búsqueda de sonidos abiertos | Gratis; límite menor sin credenciales | El usuario elige cada sonido antes de descargarlo |
