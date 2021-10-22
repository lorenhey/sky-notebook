# sky-notebook

`sky-notebook` es un cuaderno local y reproducible para registrar la historia completa de una observación astronómica: intención, cielo, instrumentación, datos, notas, resultados y lo aprendido.

No es un simple log, ni un calendario, ni una galería de imágenes. Es tu memoria astronómica en texto plano (Markdown + YAML), diseñada para ser dueña de tus propios datos, offline-first, y duradera a través de los años.

## Ejemplo de uso rápido (CLI)

Iniciá tu entorno y empezá a observar:

```bash
# Inicializar el vault en el directorio actual
sky-notebook init

# Crear un objetivo de observación
sky-notebook new-target m31 "Andromeda Galaxy" --ra "00h42m44.3s" --dec "+41d16m09s"

# Comenzar una sesión de observación
sky-notebook start-session "sess-01" "2026-09-11" --target m31

# Durante la noche, agregar notas rápidamente
sky-notebook note "sess-01" "Autofocus after meridian flip improved H-alpha."
sky-notebook note "sess-01" "Seeing bastante mediocre al comienzo. El guiado se estabilizó cerca de las 23:40."

# Al finalizar la sesión
sky-notebook end-session "sess-01" --outcome "successful"
```

## Búsqueda e Interfaz Web

Buscá en tu historial de observaciones:

```bash
sky-notebook search "guiado"
```

O iniciá la interfaz web para una experiencia completa:

```bash
sky-notebook ui
```
Navegá a `http://localhost:8000` para ver tu diario de observación.

## Características

* **Human First, Structured Underneath:** Notas en Markdown para la narrativa humana, con metadatos estructurados en YAML (frontmatter) para el procesamiento.
* **Portable & Git-Friendly:** Tus datos son simples archivos de texto organizados en carpetas lógicas. Sin bases de datos opacas ni vendor lock-in.
* **Offline-first:** Funciona completamente sin internet. Ideal para el trabajo de campo.
* **Night Reconstruction:** El foco principal es poder saber, años después, qué pasó en una sesión, qué configuración usaste, qué falló y qué aprendiste.

## Instalación

Requiere Python 3.12+ (recomendado usar `uv`):

```bash
uv tool install sky-notebook
```
(O instálalo en un entorno virtual).

## Filosofía
La filosofía del cuaderno es acumular conocimiento astronómico de tus propias observaciones empíricas y fracasos para no repetir errores y entender mejor tu equipamiento y el cielo.

## Licencia
MIT
