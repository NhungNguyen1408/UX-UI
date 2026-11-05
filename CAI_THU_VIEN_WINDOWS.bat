@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Chua tim thay Node.js. Hay cai Node.js LTS va mo lai CMD.
 pause
 exit /b 1
)
echo ===== Cai Backend =====
cd server
call npm install
if errorlevel 1 goto failed
cd ..\web
echo ===== Cai Frontend =====
call npm install
if errorlevel 1 goto failed
cd ..
echo.
echo CAI THU VIEN THANH CONG.
echo Tiep theo: import SQL, sua server\.env, chay npm run seed:demo.
pause
exit /b 0
:failed
echo Cai dat that bai. Hay kiem tra ket noi Internet, Node.js va npm.
pause
exit /b 1
