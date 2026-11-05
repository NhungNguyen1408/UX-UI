@echo off
setlocal
cd /d "%~dp0"
if not exist "server\.env" (
 echo CHUA CO server\.env - xem README_BAT_DAU.md buoc 4.
 pause
 exit /b 1
)
if not exist "server\node_modules" (
 echo CHUA CAI THU VIEN - nhap dup CAI_THU_VIEN_WINDOWS.bat.
 pause
 exit /b 1
)
if not exist "web\node_modules" (
 echo CHUA CAI THU VIEN WEB - nhap dup CAI_THU_VIEN_WINDOWS.bat.
 pause
 exit /b 1
)
start "BeautyGlow Backend 4000" /D "%~dp0server" cmd /k npm run dev
start "BeautyGlow Web 5173" /D "%~dp0web" cmd /k npm run dev
echo Da mo hai Terminal. Neu MySQL dang chay, mo http://localhost:5173
timeout /t 3 >nul
start http://localhost:5173
