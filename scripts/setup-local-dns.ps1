$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Warning "Este script modifica el archivo hosts de Windows y requiere ejecutarse como Administrador."
  Write-Host "Abre PowerShell como Administrador y vuelve a ejecutar:" -ForegroundColor Yellow
  Write-Host "  powershell -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -ForegroundColor Cyan
  exit 1
}

$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$entries = @(
  "127.0.0.1 joyride.local",
  "127.0.0.1 www.joyride.local"
)

$content = Get-Content -Path $hostsPath -ErrorAction SilentlyContinue
if ($null -eq $content) { $content = @() }

$added = $false
foreach ($entry in $entries) {
  if ($content -notcontains $entry) {
    Add-Content -Path $hostsPath -Value $entry -Encoding ASCII
    Write-Host "[DNS] Agregado: $entry" -ForegroundColor Green
    $added = $true
  } else {
    Write-Host "[DNS] Ya existe: $entry" -ForegroundColor DarkGray
  }
}

ipconfig /flushdns | Out-Null

Write-Host ""
Write-Host "DNS local configurado correctamente." -ForegroundColor Cyan
Write-Host "Ahora puedes abrir la app en:" -ForegroundColor White
Write-Host "  - Produccion / Backend unificado: http://joyride.local:4000" -ForegroundColor Green
Write-Host "  - Desarrollo Vite HMR:           http://joyride.local:5173" -ForegroundColor Green
