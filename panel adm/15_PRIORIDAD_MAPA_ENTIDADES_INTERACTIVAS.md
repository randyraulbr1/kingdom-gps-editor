# Prioridad inmediata: mapa mundial y entidades interactivas

## Objetivo

Concentrar el desarrollo inmediato del Panel ADM en el Editor de Mundo para que todas las entidades colocadas en el mapa no sean solo marcadores visuales, sino elementos funcionales conectados a una acción real del juego.

## Prioridad de esta fase

1. Mejorar el mapa mundial.
2. Completar las herramientas de colocación.
3. Hacer funcional cada tipo de pin.
4. Permitir abrir, editar, probar y validar cada entidad desde el mapa.
5. Mantener la configuración GPS simple y tolerante a errores de ubicación.

## Tipos de entidades iniciales

- Tienda
- NPC
- Enemigo
- Cofre
- Recurso
- Misión
- Punto de evento
- Ruta de enemigos
- Zona
- Punto de aparición

## Comportamiento al hacer clic en un pin

Al pulsar una entidad en el mapa debe abrirse una ventana o panel lateral correspondiente a su tipo.

### Tienda

Debe abrir:

- Nombre de la tienda
- Tipo de tienda
- Lista de productos
- Precio
- Stock
- Horarios opcionales
- Nivel requerido
- Vista previa de cómo la verá el jugador
- Botón editar
- Botón probar localmente

### NPC

Debe abrir:

- Nombre
- Diálogo
- Misiones asociadas
- Tienda asociada si aplica
- Estado activo o inactivo
- Nivel recomendado
- Botón editar
- Botón probar interacción

### Enemigo

Debe abrir:

- Enemigo asignado
- Nivel
- Vida
- Daño
- Distancia de visión
- Distancia de persecución
- Distancia de ataque
- Tiempo entre ataques
- Punto de retorno
- Botón probar comportamiento

### Cofre

Debe abrir:

- Tipo de cofre
- Recompensas
- Probabilidad
- Tiempo de respawn
- Requisito de misión o nivel

### Recurso

Debe abrir:

- Tipo de recurso
- Cantidad
- Tiempo de reaparición
- Profesión requerida
- Nivel requerido

### Misión

Debe abrir:

- Nombre
- Paso actual
- Recompensa
- Dependencias
- Pines conectados
- Botón abrir cadena completa

## Inspector universal

Cada pin debe usar el mismo patrón de interfaz:

- Resumen
- Propiedades
- Comportamiento
- Relaciones
- Historial
- Estado de sincronización
- Probar
- Guardar
- Eliminar

## Menú contextual del mapa

Al hacer clic derecho:

- Crear entidad
- Crear zona
- Crear ruta
- Pegar coordenadas
- Importar lugares de OpenStreetMap
- Ver entidades cercanas
- Centrar mapa aquí

## Tiendas reales desde OpenStreetMap

Dentro de una zona se podrán importar:

- Farmacias
- Hospitales
- Gasolineras
- Supermercados
- Tiendas generales

El sistema debe crear un pin de tienda por cada lugar seleccionado y asociarle una plantilla editable.

Ejemplo:

- Farmacia real de OSM → plantilla `pharmacy_shop`
- Hospital real de OSM → plantilla `medical_shop`
- Gasolinera real de OSM → plantilla `supply_shop`

Si no hay resultados dentro de la zona, mostrar un mensaje claro y no crear datos vacíos.

## Distancias GPS recomendadas

Evitar valores propios de un RPG tradicional.

Cada enemigo debe tener:

- Distancia de visión: configurable, recomendado 80–150 m
- Distancia de persecución: configurable, recomendado 150–300 m
- Distancia de ataque: configurable, recomendado 20–50 m
- Distancia para perder al jugador: configurable, recomendado 250–400 m
- Tolerancia GPS adicional: configurable

La IA básica debe ser:

`aparecer → esperar → detectar → perseguir → atacar → regresar`

## Rutas de enemigos

Las rutas rojas deben permitir:

- Lista de enemigos
- Nivel o rango de nivel
- Cantidad mínima y máxima
- Tiempo mínimo de aparición
- Tiempo máximo de aparición
- Radio compartido por proximidad
- Radio de visión
- Distancia de persecución
- Distancia de ataque
- Tiempo entre ataques
- Tiempo para desaparecer sin jugadores

Los enemigos serán compartidos entre jugadores dentro del radio configurado, por ejemplo 500 metros.

Cada jugador puede activar la aparición con su temporizador individual. Si un jugador activa enemigos y otros están dentro del radio compartido, todos ven y combaten esos mismos enemigos.

## Prueba local

Antes de publicar, el Panel ADM debe permitir:

- Simular jugador
- Mover jugador sobre el mapa
- Entrar en una zona
- Activar temporizador
- Ver aparición de enemigos
- Ver detección, persecución y ataque
- Hacer clic en una tienda y abrirla
- Hacer clic en NPC, cofre, recurso y misión

## Reglas de integración

- No dejar pines sin acción.
- Cada tipo debe declarar qué panel abre.
- Cada entidad debe guardar `entityType`, `entityId`, `actionType` y `actionTargetId`.
- El mapa no debe contener lógica de negocio directa.
- El clic en pin debe llamar un servicio/interactor tipado.
- Si el objetivo no existe, mostrar error y marcar la entidad como rota.
- Ninguna entidad rota debe publicarse.

## Criterio de finalización

Esta fase se considera terminada cuando:

- Todos los tipos iniciales pueden colocarse.
- Todos abren su interfaz correspondiente.
- Tiendas pueden abrir catálogo.
- Enemigos pueden probar visión, persecución y ataque.
- Rutas rojas pueden simular aparición por tiempo.
- Zonas pueden importar lugares reales.
- No existen pines sin acción.
- Typecheck y pruebas pasan.
- Roadmap y `SIGUIENTE_PASO.md` quedan actualizados.
