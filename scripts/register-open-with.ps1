# PowerShell script to register Photo Editor in Windows "Open with" context menu and Default Apps
# Runs per-user (HKCU), so NO administrator privileges required!

param (
    [string]$ExePath = ""
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

if ([string]::IsNullOrWhiteSpace($ExePath)) {
    $possiblePaths = @(
        "$projectRoot\src-tauri\target\release\Photo Editor.exe",
        "$projectRoot\src-tauri\target\debug\Photo Editor.exe",
        "$projectRoot\target\release\Photo Editor.exe",
        "$projectRoot\target\debug\Photo Editor.exe"
    )

    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            $ExePath = (Resolve-Path $p).Path
            break
        }
    }
}

if ([string]::IsNullOrWhiteSpace($ExePath) -or -not (Test-Path $ExePath)) {
    Write-Host "[!] Photo Editor executable not found automatically." -ForegroundColor Yellow
    Write-Host "    Usage: .\register-open-with.ps1 -ExePath 'C:\path\to\Photo Editor.exe'" -ForegroundColor Cyan
    exit 1
}

Write-Host "[+] Registering Photo Editor from: $ExePath" -ForegroundColor Green

$progId = "PhotoEditor.ImageFile"
$command = "`"$ExePath`" `"%1`""
$extensions = @(".png", ".jpg", ".jpeg", ".webp")

# 1. Register ProgID
$progIdKey = "HKCU:\Software\Classes\$progId"
New-Item -Path "$progIdKey\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path $progIdKey -Name "(Default)" -Value "Image File (Photo Editor)"
Set-ItemProperty -Path $progIdKey -Name "FriendlyTypeName" -Value "Image File (Photo Editor)"
Set-ItemProperty -Path "$progIdKey\shell\open\command" -Name "(Default)" -Value $command

# 2. Register Application in HKCU:\Software\Classes\Applications\Photo Editor.exe
$appKey = "HKCU:\Software\Classes\Applications\Photo Editor.exe"
New-Item -Path "$appKey\SupportedTypes" -Force | Out-Null
New-Item -Path "$appKey\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path $appKey -Name "FriendlyAppName" -Value "Photo Editor"
Set-ItemProperty -Path "$appKey\shell\open\command" -Name "(Default)" -Value $command

foreach ($ext in $extensions) {
    Set-ItemProperty -Path "$appKey\SupportedTypes" -Name $ext -Value ""
    
    # 3. Associate with file extension OpenWithProgids
    $extKey = "HKCU:\Software\Classes\$ext\OpenWithProgids"
    New-Item -Path $extKey -Force | Out-Null
    Set-ItemProperty -Path $extKey -Name $progId -Value ([byte[]]@())
}

Write-Host "[✓] Successfully registered Photo Editor in Windows 'Open with' and 'Select an app' list!" -ForegroundColor Green
Write-Host "    Supported formats: $($extensions -join ', ')" -ForegroundColor Cyan

