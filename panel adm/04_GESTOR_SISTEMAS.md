# Gestor de sistemas del juego

## Objetivo

El Panel ADM debe permitir editar cada parte del juego de forma aislada, visual y segura, sin romper sus conexiones con el resto del proyecto.

Cada sistema tendrá su propia sección para ver:

- Código actual
- Estilos actuales
- Comportamiento
- Archivos relacionados
- Dependencias
- Eventos
- API
- Base de datos
- Versiones
- Pruebas
- Estado en producción

## Sistemas principales

- Inventario
- Equipamiento
- Barras de vida, energía y experiencia
- Combate
- IA de enemigos
- NPC
- Misiones
- Chat
- Amigos
- Cuentas
- Multijugador
- Tiendas
- Economía
- Mapa GPS
- Guardado
- Sincronización
- PWA
- Service Worker
- Administración
- Interfaz general

## Vista de cada sistema

Cada sistema debe tener pestañas:

- Resumen
- Vista previa
- Propiedades
- Código
- Estilos
- Comportamiento
- Archivos
- Dependencias
- Eventos
- API
- Base de datos
- Configuración
- Pruebas
- Historial
- Versiones
- Publicar

## Edición fácil de estilos

El administrador debe poder cambiar la apariencia sin buscar manualmente archivos CSS.

Ejemplo: Barra de vida

- Color
- Tamaño
- Borde
- Sombra
- Posición
- Animación
- Texto
- Icono
- Estado crítico
- Vista móvil

El panel debe mostrar una vista previa en tiempo real y generar o actualizar los estilos correspondientes.

También debe existir una pestaña avanzada para editar el CSS/SCSS directamente con Monaco Editor.

## Edición de comportamiento

Cada sistema debe separar claramente:

- Apariencia
- Lógica
- Datos
- Eventos
- Persistencia
- Comunicación con servidor

Ejemplo: IA de enemigo

La interfaz visual podría permitir configurar:

- Radio de detección
- Distancia de ataque
- Velocidad
- Vida
- Daño
- Tiempo de respawn
- Comportamiento al perder al jugador
- Tipo de persecución GPS
- Probabilidad de huida
- Loot

La implementación avanzada seguirá estando disponible como código, pero la configuración normal debe poder hacerse mediante formularios.

## Reemplazar una implementación sin perder funciones

Debe existir un botón:

`Crear versión de reemplazo`

Flujo:

1. Copiar la versión activa a una versión candidata.
2. Conservar contratos, eventos, rutas API y formatos de datos.
3. Permitir reemplazar el código visual, lógico o ambos.
4. Ejecutar análisis de compatibilidad.
5. Mostrar qué conexiones podrían romperse.
6. Crear adaptadores cuando cambie el formato interno.
7. Probar la versión nueva localmente.
8. Comparar anterior y nueva.
9. Aprobar y publicar.
10. Mantener rollback inmediato.

Nunca se debe sobrescribir directamente la versión activa.

## Contratos públicos

Cada sistema debe declarar lo que ofrece al resto del juego.

Ejemplo de Inventario:

- añadir objeto
- quitar objeto
- equipar objeto
- consultar objetos
- guardar inventario
- sincronizar inventario
- eventos emitidos

La versión nueva puede cambiar por dentro, pero debe seguir cumpliendo el mismo contrato o incluir un adaptador.

## Adaptadores

Ejemplos:

- `InventoryLegacyAdapter`
- `InventoryV2Adapter`
- `EnemyAiLegacyAdapter`
- `ChatCompatibilityAdapter`

Los adaptadores traducen datos o eventos entre versiones antiguas y nuevas, evitando romper conexiones existentes.

## Comparador visual

Antes de reemplazar un sistema, el panel debe mostrar:

- Código anterior y nuevo
- Estilos anteriores y nuevos
- Archivos añadidos
- Archivos eliminados
- Eventos modificados
- APIs modificadas
- Cambios de base de datos
- Dependencias afectadas
- Capturas o vista previa anterior/nueva

Clasificación:

- Compatible
- Posible riesgo
- Cambio rompedor
- Requiere migración
- Requiere adaptador

## Prueba local

Cada sistema debe poder probarse dentro de la Vista del Juego integrada.

Ejemplos:

- Probar inventario nuevo manteniendo combate y mapa actuales.
- Probar nueva barra de vida sin publicar.
- Probar IA enemiga nueva solo con enemigos de prueba.
- Probar chat nuevo con usuarios simulados.

Usar feature flags para activar versiones experimentales únicamente en local, admin o usuarios seleccionados.

## Publicación segura

Antes de publicar:

1. Guardar cambios.
2. Crear backup.
3. Ejecutar lint.
4. Ejecutar typecheck.
5. Ejecutar pruebas.
6. Compilar.
7. Crear commit Git.
8. Crear versión.
9. Publicar en staging.
10. Probar dentro del panel.
11. Publicar en producción.
12. Limpiar caché y Service Worker.
13. Verificar versión cargada.

Si falla, ejecutar rollback automático.

## Arquitectura por módulo

Cada sistema se divide en:

- Contrato público
- Implementación
- Configuración
- UI
- Estilos
- Persistencia
- Sincronización
- Adaptadores
- Pruebas
- Migraciones

## Regla principal

La versión anterior nunca se elimina hasta que la nueva haya sido probada, aprobada, publicada y verificada.

## Primera implementación

Usar Inventario como módulo piloto.

Primero generar `INFORME_MODULO_INVENTARIO.md` detectando:

- Archivos actuales
- Funciones exportadas
- Eventos
- APIs
- Estilos
- Conexión con servidor
- Datos utilizados
- Dependencias
- Pruebas existentes
- Riesgos de reemplazo

Después crear una versión candidata sin modificar la activa.
