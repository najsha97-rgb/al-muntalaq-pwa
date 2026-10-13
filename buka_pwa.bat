@echo off
title Aplikasi Web PWA Al-Muntalaq
cd /d "%~dp0"
echo ===================================================
echo   MELANCARKAN APLIKASI WEB PWA AL-MUNTALAQ (المنطلق)
echo ===================================================
echo.
echo Melancarkan pelayan tempatan pada http://localhost:8081 ...
start "" http://localhost:8081/
python -m http.server 8081
pause
