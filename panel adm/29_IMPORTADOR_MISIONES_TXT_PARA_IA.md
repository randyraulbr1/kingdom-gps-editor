# 29 — Importador profesional de misiones TXT generado por IA

## Objetivo

Crear en el módulo **Misiones** una herramienta para importar y exportar archivos de texto estructurados que permitan generar, en una sola operación:

- cadenas de misiones conectadas;
- diálogos de NPC;
- NPC y pines de mapa;
- objetivos y pasos;
- enemigos, cofres o recursos relacionados;
- recompensas;
- condiciones de desbloqueo;
- relaciones entre misiones.

La meta es que cualquier IA pueda recibir una petición como:

> Crea 25 misiones conectadas entre sí para una historia de fantasía oscura.

La IA devolverá un archivo `.txt` siguiendo este formato. Después el Panel ADM lo importará, validará, mostrará una vista previa y creará todo el contenido sin tener que introducirlo manualmente.

---

## Principio principal

El formato debe ser:

- legible por personas;
- fácil de generar por cualquier IA;
- estricto para evitar ambigüedades;
- versionado;
- validable antes de guardar;
- exportable de nuevo sin perder información;
- independiente del proveedor de IA.

No se debe importar directamente a producción. Primero se crea una **vista previa en borrador**.

---

## Ubicación en el Panel ADM

Módulo **Misiones** → barra superior:

- `Nueva misión`
- `Importar TXT`
- `Exportar seleccionadas`
- `Exportar todas`
- `Descargar plantilla`
- `Ver documentación del formato`

Al pulsar `Importar TXT` se abrirá un asistente:

1. Seleccionar o pegar archivo.
2. Analizar formato.
3. Mostrar errores y advertencias.
4. Mostrar vista previa de todo lo que se creará.
5. Resolver referencias.
6. Confirmar importación.
7. Crear contenido en una transacción.
8. Mostrar informe final.

---

## Formato oficial

Nombre recomendado:

```text
kingdom-missions-v1.txt
```

Cabecera obligatoria:

```text
KINGDOM_MISSIONS_FORMAT: 1
PROJECT: Kingdom GPS
LANGUAGE: es
PACKAGE_ID: bosque_oscuro_01
PACKAGE_NAME: Cadena del Bosque Oscuro
PACKAGE_VERSION: 1.0.0
```

Cada bloque se inicia y termina explícitamente.

---

## Ejemplo completo mínimo

```text
KINGDOM_MISSIONS_FORMAT: 1
PROJECT: Kingdom GPS
LANGUAGE: es
PACKAGE_ID: bosque_oscuro_01
PACKAGE_NAME: Cadena del Bosque Oscuro
PACKAGE_VERSION: 1.0.0

BEGIN_NPC
ID: npc_guardabosques_elian
NAME: Elian
ROLE: guardabosques
ICON: npc_ranger_01
MAP_PIN: pin_guardabosques_elian
INTERACTION_RADIUS_M: 50
END_NPC

BEGIN_PIN
ID: pin_guardabosques_elian
TYPE: npc
NAME: Elian
PLACEMENT_MODE: manual
LATITUDE: 18.4861
LONGITUDE: -69.9312
ICON: npc_ranger_01
END_PIN

BEGIN_DIALOGUE
ID: dlg_elian_inicio
NPC_ID: npc_guardabosques_elian
START_NODE: node_1

BEGIN_NODE
ID: node_1
TEXT: Algo está atacando a los viajeros del bosque.
OPTION: Aceptaré investigar. -> node_accept
OPTION: Ahora no. -> node_decline
END_NODE

BEGIN_NODE
ID: node_accept
TEXT: Busca rastros cerca del sendero y regresa cuando encuentres algo.
ACTION: START_MISSION mission_bosque_001
END_NODE

BEGIN_NODE
ID: node_decline
TEXT: Regresa cuando estés preparado.
END_NODE
END_DIALOGUE

BEGIN_MISSION
ID: mission_bosque_001
TITLE: Huellas entre los árboles
SUMMARY: Investiga los rastros extraños del sendero.
DESCRIPTION: Elian cree que una criatura está atacando a los viajeros. Busca tres rastros dentro de la zona marcada.
CATEGORY: historia
CHAIN_ID: chain_bosque_oscuro
CHAIN_ORDER: 1
GIVER_NPC_ID: npc_guardabosques_elian
START_DIALOGUE_ID: dlg_elian_inicio
RECOMMENDED_LEVEL: 3
REPEATABLE: false
AUTO_START: false

BEGIN_STEP
ID: step_1
TYPE: visit_zone
TARGET_ID: zone_sendero_norte
AMOUNT: 1
TEXT: Llega al sendero norte.
END_STEP

BEGIN_STEP
ID: step_2
TYPE: collect
TARGET_ID: item_rastro_bestia
AMOUNT: 3
TEXT: Encuentra tres rastros de la criatura.
END_STEP

BEGIN_REWARD
TYPE: experience
ID: xp
AMOUNT: 250
END_REWARD

BEGIN_REWARD
TYPE: currency
ID: gold
AMOUNT: 75
END_REWARD

BEGIN_REWARD
TYPE: item
ID: potion_small
AMOUNT: 2
END_REWARD

NEXT_MISSION_ID: mission_bosque_002
END_MISSION
```

---

## Bloques admitidos

### `BEGIN_MISSION`

Campos principales:

```text
ID:
TITLE:
SUMMARY:
DESCRIPTION:
CATEGORY:
CHAIN_ID:
CHAIN_ORDER:
GIVER_NPC_ID:
TURN_IN_NPC_ID:
START_DIALOGUE_ID:
COMPLETE_DIALOGUE_ID:
RECOMMENDED_LEVEL:
MIN_LEVEL:
MAX_LEVEL:
REPEATABLE:
AUTO_START:
NEXT_MISSION_ID:
PREVIOUS_MISSION_ID:
```

### `BEGIN_STEP`

Tipos iniciales:

```text
visit_pin
visit_zone
talk_to_npc
collect
kill_enemy
open_chest
interact
reach_level
own_item
wait_time
```

Campos:

```text
ID:
TYPE:
TARGET_ID:
AMOUNT:
TEXT:
OPTIONAL:
ORDER:
RADIUS_M:
```

### `BEGIN_REWARD`

Tipos:

```text
experience
currency
item
weapon
armor
resource
loot_table
unlock_mission
unlock_shop
```

Campos:

```text
TYPE:
ID:
AMOUNT:
PROBABILITY:
```

### `BEGIN_NPC`

Campos:

```text
ID:
NAME:
ROLE:
ICON:
MAP_PIN:
INTERACTION_RADIUS_M:
SHOP_ID:
DEFAULT_DIALOGUE_ID:
```

### `BEGIN_DIALOGUE`

Debe admitir nodos, opciones y acciones.

Acciones iniciales:

```text
START_MISSION <id>
COMPLETE_MISSION <id>
OPEN_SHOP <id>
GIVE_ITEM <id> <cantidad>
TAKE_ITEM <id> <cantidad>
SET_FLAG <id> <valor>
CLOSE_DIALOGUE
```

### `BEGIN_PIN`

Campos:

```text
ID:
TYPE:
NAME:
PLACEMENT_MODE:
LATITUDE:
LONGITUDE:
OSM_TYPE:
OSM_TAGS:
ZONE_ID:
ICON:
```

`PLACEMENT_MODE` admite:

```text
manual
zone_random
osm_match
existing_pin
```

Cuando la IA no conozca coordenadas reales, debe usar `zone_random`, `osm_match` o `existing_pin` en vez de inventarlas.

---

## Reglas para cadenas de misiones

Una cadena de 25 misiones debe incluir:

- un `CHAIN_ID` común;
- `CHAIN_ORDER` consecutivo;
- relaciones `NEXT_MISSION_ID` y `PREVIOUS_MISSION_ID` coherentes;
- ninguna referencia circular accidental;
- principio y final claros;
- objetivos variados;
- recompensas equilibradas;
- NPC, diálogos y pines referenciados mediante IDs estables.

El importador debe detectar:

- misión anterior inexistente;
- misión siguiente inexistente;
- orden duplicado;
- ciclos no permitidos;
- saltos de orden;
- IDs duplicados;
- referencias rotas.

---

## Vista previa antes de importar

Debe mostrar un resumen como:

```text
Paquete: Cadena del Bosque Oscuro

25 misiones
8 NPC
14 diálogos
31 pines
72 pasos
48 recompensas
3 zonas referenciadas

0 errores críticos
4 advertencias
```

Pestañas:

- Misiones.
- Diálogos.
- NPC.
- Pines.
- Recompensas.
- Referencias.
- Errores y advertencias.

Cada elemento debe tener:

- `Ver`;
- `Editar antes de importar`;
- `Excluir`;
- `Reemplazar referencia`.

---

## Importación segura

La importación debe ejecutarse como una sola transacción lógica:

1. Validar todo.
2. Crear borradores.
3. Resolver IDs internos.
4. Crear NPC.
5. Crear diálogos.
6. Crear misiones y pasos.
7. Crear pines y conexiones.
8. Crear recompensas.
9. Validar el resultado final.
10. Confirmar transacción.

Si falla cualquier paso crítico, no debe quedar contenido parcial.

Debe existir undo/redo de la importación completa.

---

## Conflictos de IDs

Si ya existe un ID, mostrar:

- Reemplazar.
- Actualizar existente.
- Crear copia con ID nuevo.
- Omitir.
- Cancelar importación.

Nunca sobrescribir silenciosamente.

---

## Exportación

El panel debe poder exportar:

- una misión;
- una cadena completa;
- todas las misiones seleccionadas;
- un paquete completo con NPC, diálogos, pines y recompensas dependientes.

La exportación debe producir el mismo formato TXT para que pueda editarse o enviarse a otra IA y volver a importarse.

Opciones:

```text
Incluir NPC relacionados
Incluir diálogos
Incluir pines
Incluir recompensas
Incluir dependencias indirectas
```

---

## Plantilla para pedir contenido a una IA

El panel debe incluir un botón `Copiar prompt para IA` que genere un texto similar:

```text
Crea un paquete de 25 misiones conectadas para Kingdom GPS.

Devuelve únicamente texto compatible con KINGDOM_MISSIONS_FORMAT: 1.

Requisitos:
- idioma español;
- IDs únicos en snake_case;
- una historia continua de 25 misiones;
- incluir NPC, diálogos, objetivos, recompensas y pines;
- no inventar coordenadas reales;
- usar PLACEMENT_MODE: zone_random u osm_match cuando no haya coordenadas confirmadas;
- usar referencias estables entre bloques;
- recompensas progresivas y equilibradas;
- ninguna referencia rota;
- ninguna explicación fuera del archivo.

Tema: [ESCRIBIR TEMA]
Nivel inicial: [NIVEL]
Nivel final: [NIVEL]
Zona principal: [ZONE_ID]
```

Así cualquier IA podrá generar archivos compatibles.

---

## Documentación integrada

El módulo debe incluir:

- botón `Descargar plantilla vacía`;
- botón `Descargar ejemplo completo`;
- documentación de cada campo;
- lista de tipos permitidos;
- mensajes de error con línea y columna;
- editor de texto con resaltado básico;
- botón `Validar sin importar`;
- botón `Formatear archivo`.

---

## Validaciones mínimas

Errores críticos:

- cabecera ausente o versión desconocida;
- bloque sin cerrar;
- ID vacío o duplicado;
- referencia a contenido inexistente;
- misión sin título;
- misión sin pasos;
- recompensa con cantidad inválida;
- coordenadas inválidas;
- cadena circular no declarada;
- tipo de paso desconocido.

Advertencias:

- misión sin diálogo de inicio;
- misión sin recompensa;
- nivel recomendado ausente;
- pin sin icono;
- NPC sin diálogo por defecto;
- objetivos demasiado repetitivos;
- recompensa posiblemente desbalanceada.

---

## Pruebas obligatorias

- importar una misión mínima;
- importar 25 misiones conectadas;
- detectar IDs duplicados;
- detectar referencias rotas;
- detectar bloques sin cerrar;
- cancelar sin guardar nada;
- deshacer una importación completa;
- exportar e importar sin pérdida de datos;
- manejar caracteres UTF-8 y textos multilínea;
- impedir coordenadas inventadas fuera de rango;
- soportar archivos grandes sin congelar la interfaz.

---

## Criterio de terminado

No se considera terminado solo por mostrar el botón.

Debe existir:

- parser real;
- validadores;
- vista previa;
- importación transaccional;
- creación de misiones, diálogos, NPC, pines y recompensas;
- exportador reversible;
- plantilla y documentación;
- undo/redo;
- pruebas automatizadas;
- typecheck limpio;
- build correcto;
- prueba visual en Windows.
