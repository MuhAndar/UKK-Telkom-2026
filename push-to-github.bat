@echo off
echo =======================================================
echo Pushing Penilaian UKK to GitHub Pages...
echo =======================================================
git push -u origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUKSES] Berhasil dipush ke GitHub!
    echo Sekarang buka: Settings - Pages - Source: GitHub Actions
) else (
    echo.
    echo [CATATAN] Pastikan Anda telah membuat repository kosong bernama:
    echo 'UKK-Telkom-2026' di https://github.com/MuhAndar/UKK-Telkom-2026
)
pause

