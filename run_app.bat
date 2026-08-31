@echo off
title Quiniela Pattern Predictor - Argentina
echo ========================================================
echo   QUINIELA PATTERN PREDICTOR & STATS SUITE 2026
echo ========================================================
echo Iniciando servidor backend y frontend unificado...
cd /d "%~dp0backend"
start "" http://127.0.0.1:8000
python main.py
pause
