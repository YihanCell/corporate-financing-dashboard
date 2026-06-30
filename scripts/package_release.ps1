param(
  [string]$Version = "dev"
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Dist = Join-Path $Root "dist"
$PackageRoot = Join-Path $Dist "treasury-finance-monitor-$Version"
$ZipPath = Join-Path $Dist "treasury-finance-monitor-$Version.zip"

if (Test-Path $PackageRoot) {
  Remove-Item -LiteralPath $PackageRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $PackageRoot | Out-Null

$items = @(
  "README.md",
  "requirements.txt",
  "server.py",
  "run_dashboard_server.bat",
  "start_dashboard.bat",
  "start_lan_dashboard.bat",
  "start_tray.bat",
  "start_tray.vbs",
  "stop_dashboard.bat",
  "finance_dashboard_tray.ps1",
  "开放局域网访问_8780.bat",
  "启动融资看盘托盘.bat",
  "启动融资看盘托盘.vbs",
  "static",
  "samples",
  "docs",
  "scripts"
)

foreach ($item in $items) {
  $source = Join-Path $Root $item
  if (-not (Test-Path $source)) { continue }
  $target = Join-Path $PackageRoot $item
  if ((Get-Item $source).PSIsContainer) {
    Copy-Item -LiteralPath $source -Destination $target -Recurse
  } else {
    New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
    Copy-Item -LiteralPath $source -Destination $target
  }
}

$excludedScriptOutputs = @(
  Join-Path $PackageRoot "scripts\__pycache__"
)
foreach ($path in $excludedScriptOutputs) {
  if (Test-Path $path) {
    Remove-Item -LiteralPath $path -Recurse -Force
  }
}

if (Test-Path $ZipPath) {
  Remove-Item -LiteralPath $ZipPath -Force
}
Compress-Archive -Path (Join-Path $PackageRoot "*") -DestinationPath $ZipPath -Force
Write-Host "Created $ZipPath"
