@echo off
echo Starting Imposter Game...
echo.

echo Starting backend server...
start cmd /k "cd /d %~dp0 && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting frontend...
start cmd /k "cd /d %~dp0\client && npm start"

echo.
echo Both servers are starting!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000 (should open automatically)
echo.
echo Press any key to exit this window...
pause > nul 