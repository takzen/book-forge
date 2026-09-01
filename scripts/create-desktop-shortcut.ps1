$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$iconPath = Join-Path $projectRoot "electron\icon.ico"
$electronExe = Join-Path $projectRoot "node_modules\electron\dist\electron.exe"

$desktop = [Environment]::GetFolderPath("Desktop")
$wsh = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $desktop "Book Forge.lnk"

$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $electronExe
$shortcut.Arguments = "."
$shortcut.WorkingDirectory = $projectRoot
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Description = "Book Forge - Private Markdown Book & E-book Creator"
$shortcut.WindowStyle = 1
$shortcut.Save()

Write-Host "Desktop shortcut created successfully at: $shortcutPath"
