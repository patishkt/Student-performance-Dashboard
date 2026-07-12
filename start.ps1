$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

function Test-DockerAvailable {
    return [bool](Get-Command docker -ErrorAction SilentlyContinue)
}

function Test-MongoAvailable {
    param([string]$Uri = "mongodb://localhost:27017")
    $python = Join-Path $Root ".venv\Scripts\python.exe"
    if (-not (Test-Path $python)) {
        return $false
    }
    $code = @"
from pymongo import MongoClient
try:
    MongoClient("$Uri", serverSelectionTimeoutMS=3000).admin.command("ping")
    print("ok")
except Exception:
    raise SystemExit(1)
"@
    & $python -c $code 2>$null
    return $LASTEXITCODE -eq 0
}

function Ensure-Venv {
    $python = Join-Path $Root ".venv\Scripts\python.exe"
    if (Test-Path $python) {
        return $python
    }
    Write-Host "Creating virtual environment..."
    python -m venv .venv
    & $python -m pip install -r requirements.txt
    return $python
}

function Ensure-EnvFile {
    $envFile = Join-Path $Root "backend\.env"
    $example = Join-Path $Root "backend\.env.example"
    if (-not (Test-Path $envFile) -and (Test-Path $example)) {
        Copy-Item $example $envFile
        Write-Host "Created backend\.env from template."
    }
}

function Start-DockerStack {
    Write-Host "Starting with Docker Compose..."
    docker compose up --build
}

function Start-LocalStack {
    $python = Ensure-Venv
    Ensure-EnvFile

    if (-not (Test-MongoAvailable)) {
        Write-Host ""
        Write-Host "MongoDB is not running on localhost:27017." -ForegroundColor Yellow
        Write-Host "Install and start MongoDB, or install Docker Desktop and rerun this script."
        Write-Host ""
        Write-Host "Option A - Docker Desktop (recommended):"
        Write-Host "  winget install Docker.DockerDesktop --accept-source-agreements --accept-package-agreements"
        Write-Host "  Restart your PC, start Docker Desktop, then run: .\start.ps1"
        Write-Host ""
        Write-Host "Option B - MongoDB only:"
        Write-Host "  winget install MongoDB.Server --accept-source-agreements --accept-package-agreements"
        Write-Host "  net start MongoDB"
        Write-Host "  .\start.ps1"
        exit 1
    }

    Write-Host "MongoDB is ready."
    Write-Host "Seeding data and training model (first run may take a minute)..."
    & $python seed_data.py
    & $python train_model.py

    Write-Host ""
    Write-Host "Backend:  http://127.0.0.1:8001"
    Write-Host "Frontend: http://127.0.0.1:8080"
    Write-Host "Press Ctrl+C to stop both servers."
    Write-Host ""

    $backend = Start-Process -FilePath $python -ArgumentList "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8001" -PassThru -WorkingDirectory $Root
    $frontend = Start-Process -FilePath $python -ArgumentList "-m", "http.server", "8080", "--directory", "frontend" -PassThru -WorkingDirectory $Root

    try {
        Wait-Process -Id $backend.Id, $frontend.Id
    }
    finally {
        foreach ($proc in @($backend, $frontend)) {
            if (-not $proc.HasExited) {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

if (Test-DockerAvailable) {
    Start-DockerStack
}
else {
    Write-Host "Docker is not installed. Running locally without Docker..." -ForegroundColor Yellow
    Start-LocalStack
}
