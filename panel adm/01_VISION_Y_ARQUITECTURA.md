# Visión y arquitectura del Panel ADM

## Objetivo

Crear una herramienta profesional para Windows, tipo **RPG Maker + Unity Inspector + VS Code**, destinada a administrar todo el contenido y los sistemas de Kingdom GPS.

No es el juego. Es el software con el que se crean, prueban, versionan y publican sus datos y módulos.

## Stack propuesto

- Electron
- React
- TypeScript
- Vite / electron-vite
- SQLite local
- IPC tipado mediante preload/contextBridge
- Zustand para estado
- dockview para paneles acoplables
- Monaco Editor para código
- Leaflet para mapa
- react-window para listas grandes

## Principios

- Local first, sincronización después.
- Nada se edita manualmente en JSON o SQL.
- Todos los cambios se guardan, validan y exportan desde el editor.
- Ningún módulo reemplaza otro sin conservar versión anterior y rollback.
- El renderer nunca accede directamente a Node, filesystem, tokens o SQLite.
- Cada sistema debe estar separado por contratos, implementación, UI, persistencia, sincronización, adaptadores y pruebas.

## Módulos previstos

Objetos, armas, armaduras, herramientas, recursos, comida, cultivos, construcciones, NPC, monstruos, loot, misiones, diálogos, mapas, economía, crafting, recetas, profesiones, animales, mascotas, eventos, configuración, inventario, combate, chat, amigos, cuentas, multijugador, administración, PWA y actualizaciones.
