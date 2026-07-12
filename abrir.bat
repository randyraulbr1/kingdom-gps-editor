@echo off
REM ============================================================
REM  Kingdom GPS Editor - Abrir y ejecutar (Windows)
REM  Doble clic para abrir el programa. La primera vez instala
REM  dependencias (necesita Node.js e internet). Deja esta
REM  ventana abierta mientras uses el editor; ciérrala para salir.
REM ============================================================
setlocal
cd /d "%~dp0"
title Kingdom GPS Editor

REM 1) Comprobar Node.js
where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo No se encontro Node.js.
  echo Instala la version LTS desde https://nodejs.org y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

REM 2) Si es un clon de git, traer lo ultimo de la rama de trabajo
if exist ".git" (
  echo === Actualizando desde GitHub (rama de trabajo) ===
  git pull origin claude/kingdom-gps-editor-setup-7i6utj
)

REM 3) Instalar dependencias la primera vez
if not exist "node_modules" (
  echo.
  echo === Instalando dependencias por primera vez (puede tardar varios minutos) ===
  call npm install || goto :error
)

REM 4) Abrir el editor
echo.
echo === Abriendo Kingdom GPS Editor ===
echo (Deja esta ventana abierta. Cierrala para salir del programa.)
echo.
call npm run dev
goto :end

:error
echo.
echo *** Error al instalar dependencias. Revisa el mensaje de arriba. ***
echo Consejo: comprueba tu conexion a internet y que Node.js este bien instalado.
pause
exit /b 1

:end
endlocal
