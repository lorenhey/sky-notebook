# sky-notebook

[![GitHub Pages Deployment](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-2ea44f?style=for-the-badge&logo=github)](https://lorenhey.github.io/sky-notebook/)
[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue?style=for-the-badge&logo=python)](pyproject.toml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Astrophotography: Field Ready](https://img.shields.io/badge/Astro-Field%20Ready-7c3aed?style=for-the-badge)](https://lorenhey.github.io/sky-notebook/)

> **Cuaderno científico y bitácora de campo para registrar la historia completa de una observación astronómica: intención, cielo, instrumentación, datos, notas, resultados y lo aprendido.**

`sky-notebook` no es un simple log, ni un calendario, ni una galería de imágenes. Es tu memoria astronómica en texto plano (Markdown + YAML Frontmatter), diseñada para ser dueña de tus propios datos, reproducible, offline-first y duradera a través de los años.

---

### 🌐 [Explorá la Suite Web Interactiva (GitHub Pages)](https://lorenhey.github.io/sky-notebook/)

Accedé a la aplicación cliente autónoma sin backend requerida:
- **Diario de Observación (Journal)**: Explorador de sesiones, cronología interactiva de eventos (meridian flip, autoenfoque, filtros), mediciones fotométricas y lista de archivos FITS.
- **Planificador de Altitud y Efemérides (Alt-Az Planner)**: Gráfico SVG dinámico con curva de altitud a lo largo de la noche, penumbras náutica y astronómica, momento exacto de culminación meridiana y ventana de masa de aire óptima ($X \le 2.0$, $a \ge 30^\circ$).
- **Modo Nocturno Rojo ("Red Mode")**: Interfaz monocromática en longitud de onda roja profunda (`#ff2a4b`) activable con un clic o con el atajo de teclado `Shift + R` para preservar la rodopsina retiniana y la adaptación a la oscuridad en el telescopio.
- **Calculador Óptico Instrumental**: Escala de placa ($s = 206.265 \cdot p / f$), límite de resolución de Dawes ($116/D$), criterio de difracción de Rayleigh ($138/D$), campo visual (FOV) y diagnóstico de muestreo espacial de Nyquist.
- **Catálogo de Objetivos Celestes**: Coordenadas ecuatoriales J2000, tipos morfológicos y notas para M31 (Andrómeda), M42 (Orión), NGC 3372 (Carina), NGC 5139 ($\omega$ Centauri), M45 (Pléyades) y NGC 2070 (Tarántula).
- **Editor Markdown + YAML Frontmatter**: Editor split en vivo con renderizado instantáneo y exportación directa a archivos `.md`.
- **Terminal CLI Web**: Emulador interactivo con soporte de comandos `help`, `list`, `new-target`, `start-session`, `note`, `end-session`, `ephemeris`, `optical-calc` y `demo`.

---

## Trenes Ópticos y Presets de Campo

| Instrumento | Apertura $D$ | Distancia Focal $f$ | Relación Focal | Cámara / Sensor | Escala de Placa | FOV |
|---|---|---|---|---|---|---|
| **Askar 80PHQ** | $80\mathrm{mm}$ | $600\mathrm{mm}$ | $f/7.5$ | ZWO ASI2600MM ($3.76\mu\mathrm{m}$) | $1.29''/\mathrm{px}$ | $135' \times 90'$ |
| **Sky-Watcher Quattro 200P** | $200\mathrm{mm}$ | $800\mathrm{mm}$ | $f/4.0$ | QHY268M BSI ($3.76\mu\mathrm{m}$) | $0.97''/\mathrm{px}$ | $101' \times 68'$ |
| **Celestron EdgeHD 11"** | $280\mathrm{mm}$ | $1960\mathrm{mm}$ | $f/7.0$ | ZWO ASI6200MM Full Frame | $0.40''/\mathrm{px}$ | $63' \times 42'$ |

---

## Instalación y CLI en Python

Instalación local mediante `uv` o `pip`:

```bash
uv pip install -e .
```

### Comandos del CLI (`sky-notebook`)

```bash
# Inicializar el vault en el directorio actual
sky-notebook init

# Crear un objetivo de observación
sky-notebook new-target m31 "Andromeda Galaxy" --ra "00h42m44.3s" --dec "+41d16m09s"

# Comenzar una sesión de observación
sky-notebook start-session "sess-01" "2026-09-11" --target m31

# Durante la noche, agregar notas rápidamente a la bitácora
sky-notebook note "sess-01" "Autofocus after meridian flip improved H-alpha."
sky-notebook note "sess-01" "Seeing bastante mediocre al comienzo. El guiado se estabilizó cerca de las 23:40."

# Al finalizar la sesión
sky-notebook end-session "sess-01" --outcome "successful"

# Búsqueda en el historial
sky-notebook search "guiado"

# Servidor web local
sky-notebook ui
```

---

## Python API & Esquemas Pydantic

```python
from sky_notebook.vault import Vault
from sky_notebook.schemas import SessionMetadata, TargetMetadata

vault = Vault()
session = vault.load_session("sess-01")

print(f"Noche: {session.metadata.observing_night}")
print(f"Objetivos: {session.metadata.targets}")
print(f"Notas registradas: {len(session.metadata.events)}")
```

---

## Principios y Filosofía de Datos

1. **Human First, Structured Underneath**: Notas en Markdown para la narrativa humana con metadatos estructurados en YAML frontmatter para procesamiento algorítmico y trazabilidad.
2. **Git-Friendly & Zero Lock-in**: Archivos de texto plano legibles, versionables con git y resistentes al paso de las décadas sin dependencias de bases de datos binarias propietarias.
3. **Fisiología Visual y Trabajo de Campo**: Red Mode incorporado para preservar la rodopsina en bastones retinianos durante observaciones a pie de telescopio.

---

## Licencia

Distribuido bajo la licencia MIT. Diseñado para observadores astronómicos, astrofotógrafos y científicos de datos.
