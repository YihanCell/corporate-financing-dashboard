@echo off
cd /d "%~dp0"
set "LOG=%~dp0finance-dashboard.log"
set "FINANCE_DASHBOARD_HOST=127.0.0.1"
set "FINANCE_DASHBOARD_PORT=8780"
set "PYTHONUTF8=1"

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8780" ^| findstr "LISTENING"') do (
  if not "%%P"=="0" taskkill /F /PID %%P >nul 2>nul
)
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$env:FINANCE_DASHBOARD_HOST='127.0.0.1'; $env:FINANCE_DASHBOARD_PORT='8780'; $env:PYTHONUTF8='1'; Start-Process -WindowStyle Hidden -FilePath 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -ArgumentList 'server.py' -WorkingDirectory '%~dp0' -RedirectStandardOutput '%~dp0server-runtime.log' -RedirectStandardError '%~dp0server-runtime.err.log'"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0;$i -lt 80;$i++){ try { $r=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:8780' -TimeoutSec 1; if($r.StatusCode -ge 200 -and $r.Content -like '*GROUP TREASURY MONITOR*'){$ok=$true; break} } catch {}; Start-Sleep -Milliseconds 500 }; if(-not $ok){ Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Dashboard service did not start. Please close old dashboard windows and try again.', 'Finance Dashboard'); exit 1 }"
if errorlevel 1 exit /b 1
start "" "http://127.0.0.1:8780"

