@echo off
cd /d "%~dp0"
set "PYTHONUTF8=1"
if "%FINANCE_DASHBOARD_HOST%"=="" set "FINANCE_DASHBOARD_HOST=0.0.0.0"
if "%FINANCE_DASHBOARD_PORT%"=="" set "FINANCE_DASHBOARD_PORT=8780"
set "PY=C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
"%PY%" server.py > server-runtime.log 2>&1
