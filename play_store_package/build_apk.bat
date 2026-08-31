@echo off
title Compilador de APK y Android App Bundle - Quiniela Pro
echo ========================================================
echo   COMPILADOR DE APK Y ANDROID APP BUNDLE PARA PLAY STORE
echo   QUINIELA MASTER SUITE PRO (Argentina 2026)
echo ========================================================
echo.

cd /d "%~dp0\..\frontend"

echo [1/3] Compilando Frontend optimizado para Android...
call npm run build
if %errorlevel% neq 0 (
    echo Error al compilar el frontend.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Sincronizando plataforma nativa Android (Capacitor)...
call npx cap sync android
if %errorlevel% neq 0 (
    echo Error al sincronizar con Capacitor.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Compilando APK de Android con Gradle...
cd android
call gradlew.bat assembleDebug

echo.
echo ========================================================
echo   PROCESO COMPLETADO
echo   Tu APK de depuracion se encuentra en:
echo   frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================================
pause
