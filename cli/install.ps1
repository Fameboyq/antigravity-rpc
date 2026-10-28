# Antigravity Discord RPC Windows Installer
# Usage: irm https://antigravity-rpc.com/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host @"
`e[35m`e[1m
  █████╗ ███╗   ██╗████████╗██╗ ██████╗ ██████╗  █████╗ ██╗   ██╗██╗████████╗██╗   ██╗
 ██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝ ██╔══██╗██╔══██╗██║   ██║██║╚══██╔══╝╚██╗ ██╔╝
 ███████║██╔██╗ ██║   ██║   ██║██║  ███╗██████╔╝███████║██║   ██║██║   ██║    ╚████╔╝ 
 ██╔══██║██║╚██╗██║   ██║   ██║██║   ██║██╔══██╗██╔══██║╚██╗ ██╔╝██║   ██║     ╚██╔╝  
 ██║  ██║██║ ╚████║   ██║   ██║╚██████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║   ██║      ██║   
 ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝   ╚═╝      ╚═╝   `e[0m
 `e[36mAntigravity Discord RPC Installer for Windows`e[0m
"@

# Check Node.js
try {
    $nodeVer = & node -v
    Write-Host "`e[32m✔ Node.js detected:`e[0m $nodeVer"
} catch {
    Write-Host "`e[31m✘ Node.js not found. Please install Node.js from https://nodejs.org`e[0m"
    exit 1
}

$extDest = "$env:USERPROFILE\.vscode\extensions\antigravity.antigravity-rpc-1.0.0"
Write-Host "`e[36m[*] Installing VS Code Extension to:`e[0m $extDest"

New-Item -ItemType Directory -Force -Path $extDest | Out-Null

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir -or -not (Test-Path "$scriptDir\..\extension")) {
    $scriptDir = "$PSScriptRoot"
}

# If running locally from repo
if (Test-Path "$scriptDir\..\extension\extension.js") {
    Copy-Item "$scriptDir\..\extension\*" -Destination $extDest -Recurse -Force
} else {
    # Download release files from GitHub
    $baseUrl = "https://raw.githubusercontent.com/A-Gift-Of-Flame/antigravity-rpc/main/extension"
    $files = @("package.json", "extension.js", "discord-ipc.js", "stats-reader.js", "icon.png")
    foreach ($f in $files) {
        Invoke-WebRequest -Uri "$baseUrl/$f" -OutFile "$extDest\$f" -UseBasicParsing
    }
}

Write-Host "`e[32m✔ Extension files installed!`e[0m"

# Create global agy-rpc.cmd in %USERPROFILE%\AppData\Local\Microsoft\WindowsApps or %USERPROFILE%\.antigravity\bin
$binDir = "$env:USERPROFILE\.gemini\antigravity\bin"
New-Item -ItemType Directory -Force -Path $binDir | Out-Null

$cmdContent = "@echo off`r`nnode `"$extDest\..\..\..\vs code programing\cli\bin\agy-rpc.js`" %*"
Set-Content -Path "$binDir\agy-rpc.cmd" -Value $cmdContent

Write-Host "`e[32m✔ CLI command 'agy-rpc' configured in:`e[0m $binDir"
Write-Host ""
Write-Host "`e[1m`e[32m🚀 Installation Complete!`e[0m"
Write-Host "Reload VS Code (Ctrl+Shift+P -> Reload Window) or run:"
Write-Host "  `e[36magy-rpc run`e[0m"

