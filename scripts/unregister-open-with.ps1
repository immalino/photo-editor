# PowerShell script to unregister Photo Editor from Windows "Open with" context menu

$progId = "PhotoEditor.ImageFile"
$extensions = @(".png", ".jpg", ".jpeg", ".webp")

Write-Host "[-] Unregistering Photo Editor file associations..." -ForegroundColor Yellow

# Remove ProgId
$progIdKey = "HKCU:\Software\Classes\$progId"
if (Test-Path $progIdKey) {
    Remove-Item -Path $progIdKey -Recurse -Force
}

# Remove Application key
$appKey = "HKCU:\Software\Classes\Applications\Photo Editor.exe"
if (Test-Path $appKey) {
    Remove-Item -Path $appKey -Recurse -Force
}

# Remove OpenWithProgids entries
foreach ($ext in $extensions) {
    $extKey = "HKCU:\Software\Classes\$ext\OpenWithProgids"
    if (Test-Path $extKey) {
        Remove-ItemProperty -Path $extKey -Name $progId -ErrorAction SilentlyContinue
    }
}

Write-Host "[✓] Successfully unregistered Photo Editor file associations." -ForegroundColor Green

