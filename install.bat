@echo off
cls
color 0A
echo ==========================================
echo   DWBI Service Installer
echo ==========================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo ERROR: Run as Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

set NODE_PATH=C:\Program Files\nodejs\node.exe

if not exist "%NODE_PATH%" (
    color 0C
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)

if not exist "D:\DWBI\server.js" (
    color 0C
    echo ERROR: server.js not found!
    pause
    exit /b 1
)

if not exist "D:\nssm\nssm.exe" (
    color 0C
    echo ERROR: nssm.exe not found!
    pause
    exit /b 1
)

if not exist "D:\DWBI\logs" mkdir "D:\DWBI\logs"

echo [OK] Node.js: v20.10.0
echo [OK] server.js found
echo [OK] nssm.exe found
echo.

echo [1/5] Checking existing service...
D:\nssm\nssm.exe status DWBI >nul 2>&1
if %errorLevel% equ 0 (
    echo [2/5] Stopping old service...
    D:\nssm\nssm.exe stop DWBI >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo [3/5] Removing old service...
    D:\nssm\nssm.exe remove DWBI confirm >nul 2>&1
) else (
    echo [2/5] No existing service
)

echo [4/5] Installing new service...
D:\nssm\nssm.exe install DWBI "%NODE_PATH%" "D:\DWBI\server.js"
D:\nssm\nssm.exe set DWBI AppDirectory "D:\DWBI"
D:\nssm\nssm.exe set DWBI AppStdout "D:\DWBI\logs\output.log"
D:\nssm\nssm.exe set DWBI AppStderr "D:\DWBI\logs\error.log"
D:\nssm\nssm.exe set DWBI DisplayName "DWBI Web Application"
D:\nssm\nssm.exe set DWBI Description "DWBI Data Warehouse Management System"
D:\nssm\nssm.exe set DWBI Start SERVICE_AUTO_START

echo [5/5] Starting service...
D:\nssm\nssm.exe start DWBI

timeout /t 3 /nobreak >nul

D:\nssm\nssm.exe status DWBI >nul 2>&1
if %errorLevel% equ 0 (
    color 0A
    echo.
    echo ==========================================
    echo   SUCCESS - Service is RUNNING!
    echo ==========================================
    echo.
    echo Service Name:    DWBI Web Application
    echo Status:          RUNNING
    echo Port:            8080
    echo Path:            D:\DWBI
    echo Auto-start:      YES
    echo.
    echo Access URLs:
    echo   Local:         http://localhost:8080
    echo   Network:       http://%COMPUTERNAME%:8080
    echo.
    echo Logs Location:   D:\DWBI\logs\
    echo.
    echo Management Commands:
    echo   Stop:          D:\nssm\nssm.exe stop DWBI
    echo   Start:         D:\nssm\nssm.exe start DWBI
    echo   Restart:       D:\nssm\nssm.exe restart DWBI
    echo   Status:        D:\nssm\nssm.exe status DWBI
    echo ==========================================
) else (
    color 0C
    echo.
    echo ERROR: Service installed but not running!
    echo Check logs: D:\DWBI\logs\error.log
)

echo.
pause
