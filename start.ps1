# =============================================================================
# start.ps1 — Unified Precision Agriculture Platform Startup Script
# =============================================================================
# Starts all three processes in separate windows:
#   1. FastAPI backend (with database seed)
#   2. React frontend (Vite dev server)
#   3. CEA/IoT hardware simulator (optional, auto-detects farm UUID)
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File start.ps1
#
# Options:
#   -SkipSeed       Skip database seeding (useful when DB already has data)
#   -SkipSim        Skip the IoT hardware simulator
#   -BackendPort    Backend port (default: 8000)
#   -FrontendPort   Frontend port (default: 5173)
# =============================================================================

param(
    [switch]$SkipSeed = $false,
    [switch]$SkipSim  = $false,
    [int]$BackendPort  = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

# ─── Helper ───────────────────────────────────────────────────────────────────
function Write-Step($msg) {
    Write-Host "`n[AGY] $msg" -ForegroundColor Cyan
}

function Test-Command($cmd) {
    return (Get-Command $cmd -ErrorAction SilentlyContinue) -ne $null
}

Write-Host "=" * 62
Write-Host "  Unified Precision Agriculture Platform — Startup" -ForegroundColor Green
Write-Host "=" * 62

# ─── 1. Backend ───────────────────────────────────────────────────────────────
Write-Step "Setting up backend..."

$backendDir = Join-Path $Root "backend"
if (-not (Test-Path $backendDir)) {
    Write-Host "[ERROR] backend/ directory not found at: $backendDir" -ForegroundColor Red
    exit 1
}

# Locate Python / venv
$venvPython = Join-Path $backendDir "venv\Scripts\python.exe"
$python = if (Test-Path $venvPython) { $venvPython } elseif (Test-Command "python") { "python" } else { "python3" }
Write-Host "[INFO] Using Python: $python"

# Install dependencies if venv missing
if (-not (Test-Path $venvPython)) {
    Write-Step "Creating venv & installing backend dependencies..."
    & $python -m venv (Join-Path $backendDir "venv")
    & $venvPython -m pip install -r (Join-Path $backendDir "requirements.txt") --quiet
}

# Seed database
if (-not $SkipSeed) {
    Write-Step "Seeding database..."
    $seedOutput = & $venvPython (Join-Path $backendDir "seed.py") 2>&1
    $seedOutput | ForEach-Object { Write-Host "  $_" }

    # Extract demo farm UUID from seed output (line containing "Demo farm UUID:")
    $farmIdLine = $seedOutput | Where-Object { $_ -match "Demo farm UUID:" } | Select-Object -First 1
    $farmId = if ($farmIdLine -match "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})") {
        $matches[1]
    } else {
        ""
    }
    if ($farmId) {
        Write-Host "[INFO] Demo Farm UUID: $farmId" -ForegroundColor Green
        [Environment]::SetEnvironmentVariable("CEA_FARM_ID", $farmId, "Process")
    }
} else {
    Write-Host "[SKIP] Database seeding skipped."
}

# Start FastAPI backend in a new window
Write-Step "Starting FastAPI backend on port $BackendPort..."
$uvicornCmd = "& '$venvPython' -m uvicorn app.main:app --reload --host 0.0.0.0 --port $BackendPort"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; $uvicornCmd" -WindowStyle Normal

# Wait for backend to come up
Write-Host "[INFO] Waiting for backend to start..."
$retries = 0
while ($retries -lt 20) {
    Start-Sleep -Seconds 2
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:$BackendPort/health" -TimeoutSec 3 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Host "[OK] Backend is up!" -ForegroundColor Green
            break
        }
    } catch { }
    $retries++
    Write-Host "  Waiting... ($retries/20)"
}
if ($retries -eq 20) {
    Write-Host "[WARN] Backend did not respond within 40 seconds. Continuing anyway." -ForegroundColor Yellow
}

# ─── 2. Frontend ──────────────────────────────────────────────────────────────
Write-Step "Starting React frontend on port $FrontendPort..."

$frontendDir = Join-Path $Root "frontend"
if (-not (Test-Path $frontendDir)) {
    Write-Host "[ERROR] frontend/ directory not found." -ForegroundColor Red
    exit 1
}

# Install node modules if needed
if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Step "Installing frontend dependencies (npm install)..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm install" -Wait -WindowStyle Normal
}

$viteCmd = "npm run dev -- --port $FrontendPort"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; $viteCmd" -WindowStyle Normal

# ─── 3. IoT Simulator (optional) ──────────────────────────────────────────────
if (-not $SkipSim) {
    Write-Step "Starting CEA/IoT hardware simulator..."
    $simScript = Join-Path $backendDir "hardware-sim\simulate_sensors.py"

    $farmIdEnv  = [Environment]::GetEnvironmentVariable("CEA_FARM_ID", "Process")
    $simCmd     = "& '$venvPython' '$simScript'"

    $envBlock = if ($farmIdEnv) { "`$env:CEA_FARM_ID='$farmIdEnv'; " } else { "" }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; ${envBlock}${simCmd}" -WindowStyle Normal
    Write-Host "[OK] IoT simulator started." -ForegroundColor Green
} else {
    Write-Host "[SKIP] IoT hardware simulator skipped."
}

# ─── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=" * 62 -ForegroundColor Green
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "  Frontend:  http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "  Backend:   http://localhost:$BackendPort/docs" -ForegroundColor White
Write-Host "  Credentials: demo@agri.test / demo1234" -ForegroundColor White
Write-Host "=" * 62 -ForegroundColor Green
Write-Host ""

# Open browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:$FrontendPort"
