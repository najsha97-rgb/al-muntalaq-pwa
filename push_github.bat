@echo off
chcp 65001 > nul
title PUSH GITHUB PWA AL-MUNTALAQ
echo ===================================================================
echo             AUTO-PUSH GITHUB PWA AL-MUNTALAQ                      
echo ===================================================================
echo.
cd /d "c:\Users\pc\OneDrive\Documents\Bahan_Ilmiah_Dakwah\almuntalaq_pwa"

set /p msg="Masukkan nota kemas kini (atau tekan Enter untuk default): "
if "%msg%"=="" set msg=Kemas kini pangkalan data dan bahan Al-Muntalaq

echo.
echo [1/3] Menambah fail yang berubah (git add)...
git add .

echo [2/3] Merekod komit (git commit)...
git commit -m "%msg%"

echo [3/3] Menghantar ke GitHub (git push)...
git push

echo.
echo ===================================================================
echo Selesai! Kod terkini telah selamat dihantar ke GitHub.
echo ===================================================================
pause
