@echo off
REM ============================================================
REM  Kingdom GPS Editor - Actualizar copia local (Windows)
REM  Doble clic para: traer los ultimos cambios de GitHub,
REM  instalar dependencias y verificar typecheck + tests + build.
REM  Al terminar sin errores, arranca la app con: npm run dev
REM ============================================================
setlocal
cd /d "%~dp0"

set RAMA=claude/kingdom-gps-editor-setup-7i6utj

echo.
echo === 1/5  Trayendo cambios de GitHub (rama %RAMA%) ===
git fetch origin %RAMA% || goto :error
git checkout %RAMA% || goto :error
git pull origin %RAMA% || goto :error

echo.
echo === 2/5  Instalando dependencias (npm install) ===
call npm install || goto :error

echo.
echo === 3/5  Comprobando tipos (npm run typecheck) ===
call npm run typecheck || goto :error

echo.
echo === 4/5  Ejecutando pruebas (npm test) ===
call npm test || goto :error

echo.
echo === 5/5  Compilando (npm run build) ===
call npm run build || goto :error

echo.
echo ============================================================
echo  LISTO. Copia local actualizada y verificada.
echo  Para abrir el editor ejecuta:   npm run dev
echo ============================================================
pause
exit /b 0

:error
echo.
echo *** OCURRIO UN ERROR. Revisa el mensaje de arriba. ***
echo *** No se completo la actualizacion.               ***
pause
exit /b 1
