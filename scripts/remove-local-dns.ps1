$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Warning "Este script requiere ejecutarse como Administrador para limpiar el archivo hosts."
  exit 1
}

$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$content = Get-Content -Path $hostsPath -ErrorAction SilentlyContinue
if ($null -ne $content) {
  $filtered = $content | Where-Object {
    ($_ -ne "127.0.0.1 joyride.local") -and ($_ -ne "127.0.0.1 www.joyride.local")
  }
  Set-Content -Path $hostsPath -Value $filtered -Encoding ASCII
}

ipconfig /flushdns | Out-Null
Write-Host "[DNS] Dominios locales joyride.local removidos y cache DNS limpiada." -ForegroundColor Yellow
