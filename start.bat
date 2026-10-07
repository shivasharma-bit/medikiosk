@echo off
title MediKiosk
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Download the LTS version from https://nodejs.org then run this file again.
  pause
  exit /b 1
)
if not exist backend\node_modules\express (
  echo [1/3] Installing backend packages - one time only...
  pushd backend
  call npm install
  popd
)
if not exist frontend\node_modules\vite (
  echo [2/3] Installing frontend packages - one time only...
  pushd frontend
  call npm install
  popd
)
echo [3/3] Building the frontend...
pushd frontend
call npm run build
popd
if not exist frontend\dist\index.html (
  echo Frontend build failed. See the error above.
  pause
  exit /b 1
)
echo.
echo Starting MediKiosk. The browser opens automatically. Keep this window open.
start "" cmd /c "timeout /t 12 /nobreak >nul & start http://localhost:5000"
cd backend
call npm start
pause
