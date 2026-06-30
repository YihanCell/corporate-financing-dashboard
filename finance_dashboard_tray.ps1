Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$createdNew = $false
$mutex = New-Object System.Threading.Mutex($true, "GroupFinanceDashboardTray", [ref]$createdNew)
if (-not $createdNew) {
  [System.Windows.Forms.MessageBox]::Show("Finance dashboard tray is already running.", "Finance Dashboard") | Out-Null
  return
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$port = 8780
$hostName = "0.0.0.0"
$localUrl = "http://127.0.0.1:$port"
$serviceStarting = $false
$startupName = "Group Finance Dashboard Tray.lnk"
$startupFolder = [Environment]::GetFolderPath("Startup")
$startupLink = Join-Path $startupFolder $startupName
$launcherPath = Join-Path $root "start_tray.vbs"

function Get-ServerPid {
  $line = netstat -ano | Select-String ":$port" | Select-String "LISTENING" | Select-Object -First 1
  if (-not $line) { return $null }
  $pidText = (($line.ToString() -split "\s+") | Where-Object { $_ })[-1]
  if ($pidText -match "^\d+$") { return [int]$pidText }
  return $null
}

function Get-ServerPids {
  $lines = netstat -ano | Select-String ":$port" | Select-String "LISTENING"
  $ids = @()
  foreach ($line in $lines) {
    $pidText = (($line.ToString() -split "\s+") | Where-Object { $_ })[-1]
    if ($pidText -match "^\d+$") { $ids += [int]$pidText }
  }
  return $ids | Select-Object -Unique
}

function Test-Server {
  try {
    $response = Invoke-WebRequest -UseBasicParsing "$localUrl/api/health" -TimeoutSec 1
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Get-LanIp {
  $line = ipconfig | Select-String -Pattern "IPv4.*?:\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)" | Select-Object -First 1
  if ($line -and $line.Matches.Count -gt 0) { return $line.Matches[0].Groups[1].Value }
  return "127.0.0.1"
}

function Get-LanUrl {
  return "http://$(Get-LanIp):$port"
}

function Start-DashboardService {
  if (Test-Server) { return }
  $script:serviceStarting = $true
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $pythonExe
  $psi.Arguments = "server.py"
  $psi.WorkingDirectory = $root
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
  $psi.EnvironmentVariables["FINANCE_DASHBOARD_HOST"] = $hostName
  $psi.EnvironmentVariables["FINANCE_DASHBOARD_PORT"] = [string]$port
  $psi.EnvironmentVariables["PYTHONUTF8"] = "1"
  [System.Diagnostics.Process]::Start($psi) | Out-Null
}

function Wait-ForServer($timeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-Server) {
      $script:serviceStarting = $false
      return $true
    }
    Start-Sleep -Milliseconds 500
  }
  $script:serviceStarting = $false
  return $false
}

function Stop-DashboardService {
  foreach ($servicePid in (Get-ServerPids)) {
    Stop-Process -Id $servicePid -Force -ErrorAction SilentlyContinue
  }
}

function Restart-DashboardService {
  Stop-DashboardService
  Start-Sleep -Milliseconds 700
  Start-DashboardService
  Wait-ForServer 30 | Out-Null
}

function Enable-Autostart {
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($startupLink)
  $shortcut.TargetPath = "wscript.exe"
  $shortcut.Arguments = """" + $launcherPath + """"
  $shortcut.WorkingDirectory = $root
  $shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,17"
  $shortcut.Description = "Start Group Finance Dashboard tray"
  $shortcut.Save()
}

function Disable-Autostart {
  if (Test-Path $startupLink) {
    Remove-Item -LiteralPath $startupLink -Force
  }
}

function Test-Autostart {
  return Test-Path $startupLink
}

function Open-Url($url) {
  Start-Process $url
}

function Update-TrayState {
  $running = Test-Server
  $lanUrl = Get-LanUrl
  if ($running) {
    $script:serviceStarting = $false
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $notify.Text = "Finance Dashboard: running $lanUrl"
    $statusItem.Text = "Status: running"
    $openLocalItem.Enabled = $true
    $openLanItem.Enabled = $true
    $copyLanItem.Enabled = $true
    $startItem.Enabled = $false
    $stopItem.Enabled = $true
  } elseif ($script:serviceStarting) {
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $notify.Text = "Finance Dashboard: starting"
    $statusItem.Text = "Status: starting"
    $openLocalItem.Enabled = $false
    $openLanItem.Enabled = $false
    $copyLanItem.Enabled = $false
    $startItem.Enabled = $false
    $stopItem.Enabled = $true
  } else {
    $notify.Icon = [System.Drawing.SystemIcons]::Warning
    $notify.Text = "Finance Dashboard: stopped"
    $statusItem.Text = "Status: stopped"
    $openLocalItem.Enabled = $false
    $openLanItem.Enabled = $false
    $copyLanItem.Enabled = $false
    $startItem.Enabled = $true
    $stopItem.Enabled = $false
  }

  if (Test-Autostart) {
    $autostartItem.Text = "Disable auto start"
  } else {
    $autostartItem.Text = "Enable auto start"
  }
}

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$statusItem = $menu.Items.Add("Status: checking")
$statusItem.Enabled = $false
$menu.Items.Add("-") | Out-Null
$openLocalItem = $menu.Items.Add("Open local dashboard")
$openLanItem = $menu.Items.Add("Open LAN dashboard")
$copyLanItem = $menu.Items.Add("Copy LAN URL")
$menu.Items.Add("-") | Out-Null
$startItem = $menu.Items.Add("Start service")
$restartItem = $menu.Items.Add("Restart service")
$stopItem = $menu.Items.Add("Stop service")
$menu.Items.Add("-") | Out-Null
$autostartItem = $menu.Items.Add("Enable auto start")
$settingsItem = $menu.Items.Add("Show settings")
$menu.Items.Add("-") | Out-Null
$exitItem = $menu.Items.Add("Exit tray only")

$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Text = "Finance Dashboard"
$notify.Icon = [System.Drawing.SystemIcons]::Information
$notify.ContextMenuStrip = $menu
$notify.Visible = $true

$openLocalItem.add_Click({ Open-Url $localUrl })
$openLanItem.add_Click({ Open-Url (Get-LanUrl) })
$copyLanItem.add_Click({
  [System.Windows.Forms.Clipboard]::SetText((Get-LanUrl))
  $notify.ShowBalloonTip(1800, "Finance Dashboard", "LAN URL copied.", [System.Windows.Forms.ToolTipIcon]::Info)
})
$startItem.add_Click({
  Start-DashboardService
  Wait-ForServer 30 | Out-Null
  Update-TrayState
})
$restartItem.add_Click({
  Restart-DashboardService
  Start-Sleep -Milliseconds 900
  Update-TrayState
})
$stopItem.add_Click({
  Stop-DashboardService
  Start-Sleep -Milliseconds 500
  Update-TrayState
})
$autostartItem.add_Click({
  if (Test-Autostart) {
    Disable-Autostart
    $notify.ShowBalloonTip(1800, "Finance Dashboard", "Auto start disabled.", [System.Windows.Forms.ToolTipIcon]::Info)
  } else {
    Enable-Autostart
    $notify.ShowBalloonTip(1800, "Finance Dashboard", "Auto start enabled.", [System.Windows.Forms.ToolTipIcon]::Info)
  }
  Update-TrayState
})
$settingsItem.add_Click({
  $autoStartText = if (Test-Autostart) { "enabled" } else { "disabled" }
  $message = "Port: $port`nLocal URL: $localUrl`nLAN URL: $(Get-LanUrl)`nAuto start: $autoStartText`nProject path: $root"
  [System.Windows.Forms.MessageBox]::Show($message, "Finance Dashboard Settings") | Out-Null
})
$exitItem.add_Click({
  $notify.Visible = $false
  $notify.Dispose()
  $timer.Stop()
  $timer.Dispose()
  $mutex.ReleaseMutex()
  [System.Windows.Forms.Application]::Exit()
})
$notify.add_DoubleClick({ if (Test-Server) { Open-Url (Get-LanUrl) } })

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 5000
$timer.add_Tick({ Update-TrayState })

Start-DashboardService
Wait-ForServer 30 | Out-Null
Update-TrayState
$timer.Start()
$notify.ShowBalloonTip(1800, "Finance Dashboard", "Tray started. Right-click the icon to manage the service.", [System.Windows.Forms.ToolTipIcon]::Info)
[System.Windows.Forms.Application]::Run()
