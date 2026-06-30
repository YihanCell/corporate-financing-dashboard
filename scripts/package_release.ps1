param(
  [string]$Version = "dev"
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Dist = Join-Path $Root "dist"
$PackageRoot = Join-Path $Dist "corporate-financing-dashboard-$Version"
$ZipPath = Join-Path $Dist "corporate-financing-dashboard-$Version.zip"

if (Test-Path $PackageRoot) {
  Remove-Item -LiteralPath $PackageRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $PackageRoot | Out-Null

$items = @(
  "README.md",
  "requirements.txt",
  "server.py",
  "start.bat",
  "stop.bat",
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
