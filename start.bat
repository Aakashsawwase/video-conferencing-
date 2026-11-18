@echo off
echo ========================================================
echo       Starting Apna Video Call (Zoom Clone)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server (Port 8000)...
start "Zoom Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [2/2] Starting Frontend Client (Port 3000)...
start "Zoom Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo ========================================================
echo Both backend and frontend have been launched in separate windows!
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:3000
echo ========================================================
pause
