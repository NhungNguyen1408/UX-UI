@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Chua co Node.js. Cai Node.js LTS truoc.
 pause
 exit /b 1
)
if exist "server\.env" (
 echo server\.env da ton tai. Khong ghi de de bao ve mat khau cua ban.
 echo Neu can, mo file server\.env va sua DB_PORT, DB_USER, DB_PASSWORD.
 pause
 exit /b 0
)
for /f "delims=" %%K in ('node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"') do set "SECRET=%%K"
(
echo PORT=4000
echo DB_HOST=127.0.0.1
echo DB_PORT=3306
echo DB_USER=root
echo DB_PASSWORD=
echo DB_NAME=beautyglow_db
echo JWT_SECRET=!SECRET!
echo FRONTEND_ORIGIN=http://localhost:5173
) > "server\.env"
echo Da tao server\.env cho XAMPP local va khoa JWT ngau nhien.
echo Luu y: neu MySQL XAMPP co mat khau hoac cong khac, sua file server\.env.
echo KHONG dang file server\.env len GitHub!
pause
