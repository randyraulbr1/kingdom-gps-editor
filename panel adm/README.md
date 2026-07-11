# Panel ADM — Documentación oficial de Kingdom GPS

> **Esta carpeta es la documentación oficial del proyecto**, y vive **dentro del
> repositorio del juego** (junto al código), no en un repositorio aparte.
>
> Origen histórico: estos documentos se redactaron primero en
> `github.com/randyraulbr1/tcodm-web/panel adm`. Desde 2026-07-10 esa copia
> queda **obsoleta para documentación**: la fuente de verdad es esta carpeta.
> Toda documentación nueva se crea aquí.

Documentación, diseño y desarrollo del panel administrativo profesional de
Kingdom GPS y de los sistemas del juego.

## Índice de documentos

| # | Documento | Tema |
|---|---|---|
| 00 | [00_ROADMAP.md](00_ROADMAP.md) | Roadmap maestro (sincronizado con el código real) |
| 01 | [01_VISION_Y_ARQUITECTURA.md](01_VISION_Y_ARQUITECTURA.md) | Visión, stack y principios |
| 02 | [02_EDITOR_MUNDO.md](02_EDITOR_MUNDO.md) | Editor de mundo y mapa |
| 03 | [03_VISTA_JUEGO.md](03_VISTA_JUEGO.md) | Vista integrada del juego |
| 04 | [04_GESTOR_SISTEMAS.md](04_GESTOR_SISTEMAS.md) | Gestor de sistemas versionados |
| 05 | [05_ICONOS_Y_GENERADOR_IA.md](05_ICONOS_Y_GENERADOR_IA.md) | Biblioteca y generador IA de iconos |
| 06 | [06_ECONOMIA_FUTURA.md](06_ECONOMIA_FUTURA.md) | Economía futura |
| 07 | [07_FUNCIONES_PLANIFICADAS.md](07_FUNCIONES_PLANIFICADAS.md) | Funciones planificadas |
| 08 | [08_GENERADOR_MISIONES_GPS.md](08_GENERADOR_MISIONES_GPS.md) | Generador e importador de misiones GPS |
| 09 | [09_SEGURIDAD_Y_AUDITORIA_JUGADORES.md](09_SEGURIDAD_Y_AUDITORIA_JUGADORES.md) | Seguridad y auditoría de jugadores |
| 10 | [10_IDEAS_Y_FEEDBACK_JUGADORES.md](10_IDEAS_Y_FEEDBACK_JUGADORES.md) | Ideas y feedback de jugadores |
| 11 | [11_GUIA_DE_INTEGRACION_Y_CALIDAD.md](11_GUIA_DE_INTEGRACION_Y_CALIDAD.md) | Guía de integración y calidad (obligatoria) |
| 12 | [12_ZONAS_DE_JUEGO_POR_JUGADOR.md](12_ZONAS_DE_JUEGO_POR_JUGADOR.md) | Zonas de juego por jugador |
| 13 | [13_SISTEMA_DE_TOPS_Y_TEMPORADAS.md](13_SISTEMA_DE_TOPS_Y_TEMPORADAS.md) | Tops, clasificaciones y temporadas |

### Informes de estado e implementación (raíz del proyecto)

Viven junto al código, en `editor/`, y registran lo que se ha construido:

- `INFORME_ESTADO_PROYECTO.md` — estado actual del proyecto vs. esta documentación.
- `INFORME_FASE_1.md` — andamiaje e infraestructura.
- `INFORME_FASE_2.md` — módulo Objetos (patrón de referencia).
- `INFORME_EDITOR_DE_MUNDO.md` — Editor de Mundo (mapa GPS).
- `PLAN_EDITOR_MUNDO_FASE_A.md` — plan original del Editor de Mundo.

## Alcance

- Editor de objetos e inventario.
- Editor de mundo y mapa (con zonas e importación de lugares reales de OSM).
- Biblioteca y generador de iconos.
- Vista integrada del juego.
- Gestor de sistemas, código y versiones.
- Sincronización local/servidor.
- Publicación, pruebas, staging y rollback.
- Seguridad, feedback, zonas por jugador y clasificaciones.
- Ideas, roadmap e informes técnicos.

## Reglas de documentación

1. **Fuente única de verdad**: esta carpeta (`panel adm/`) dentro del proyecto.
   No usar `tcodm-web` para documentación nueva.
2. **Código y documentación sincronizados**: al implementar o cambiar algo, se
   actualiza el roadmap y/o el informe correspondiente en el mismo cambio.
3. **Regla principal del proyecto**: los cambios se documentan, prueban y
   versionan antes de publicarse en producción (ver
   [11_GUIA_DE_INTEGRACION_Y_CALIDAD.md](11_GUIA_DE_INTEGRACION_Y_CALIDAD.md)).
