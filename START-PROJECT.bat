@echo off
echo ==========================================
echo   Starting Medi+ Healthcare Platform
echo ==========================================

echo.
echo [1/3] Starting Backend Server...
start powershell -NoExit -Command "cd backend; ..\.venv\Scripts\python.exe run.py"

echo [2/3] Starting Frontend Server...
start powershell -NoExit -Command "npm run dev"

echo [3/3] Opening Browser...
timeout /t 5
start http://localhost:5173/auth

echo.
echo All systems starting! 
echo Keep the two terminal windows open while using the app.
echo.
pause
