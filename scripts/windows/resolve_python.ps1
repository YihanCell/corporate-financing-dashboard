$ErrorActionPreference = "SilentlyContinue"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$candidates = New-Object System.Collections.ArrayList

function Add-Candidate($path) {
  if ([string]::IsNullOrWhiteSpace($path)) { return }
  if ((Test-Path $path) -and -not $candidates.Contains($path)) {
    [void]$candidates.Add($path)
  }
}

function Test-Dependencies($candidate) {
  try {
    & $candidate -c "import pandas, openpyxl" *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

Add-Candidate $env:FINANCE_DASHBOARD_PYTHON
Add-Candidate (Join-Path $root ".venv\Scripts\python.exe")

$python = Get-Command python.exe
if ($python) { Add-Candidate $python.Source }

$pyLauncher = Get-Command py.exe
if ($pyLauncher) { Add-Candidate $pyLauncher.Source }

if ($env:USERPROFILE) {
  Add-Candidate (Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe")
}

foreach ($candidate in $candidates) {
  if (Test-Dependencies $candidate) {
    Write-Output $candidate
    exit 0
  }
}

Write-Error "Python with pandas/openpyxl was not found. Run: python -m pip install -r requirements.txt"
exit 1
