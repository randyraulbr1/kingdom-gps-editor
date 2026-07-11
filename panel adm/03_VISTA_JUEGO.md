# Vista integrada del juego

## Objetivo

Cargar Kingdom GPS dentro del Panel ADM como un navegador embebido para probar cambios sin salir del editor.

## Modos

- Producción: `https://tcodm.com`
- Local: `http://localhost:5173`
- URL personalizada permitida

## Controles

- Atrás / adelante
- Recargar
- Recarga forzada
- Limpiar caché
- Limpiar Service Worker
- Limpiar Cache Storage
- Preservar o borrar sesión
- Abrir DevTools
- Abrir navegador externo
- Captura de pantalla
- Selector escritorio, móvil, tablet y pantalla completa

## Actualizar juego

### Recarga rápida

Recargar ignorando caché.

### Actualizar todo

- Detener vista
- Limpiar caché HTTP/Chromium
- Limpiar Service Worker y Cache Storage
- Opcionalmente conservar cookies y localStorage
- Recargar con bypass de caché

## Consola integrada

Capturar logs, advertencias, errores JavaScript, red y Service Worker.

## Seguridad

- Usar WebContentsView/BrowserView, no iframe como solución principal
- nodeIntegration desactivado
- contextIsolation activado
- Validar dominios permitidos
- No exponer Node al juego
