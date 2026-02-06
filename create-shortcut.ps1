# Create Achievement Box Shortcut
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$PSScriptRoot\AchievementBox.lnk")

# Set target to PowerShell script
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File ""$PSScriptRoot\start.ps1"""

# Set icon
$Shortcut.IconLocation = "$PSScriptRoot\256x256.ico"

# Set working directory
$Shortcut.WorkingDirectory = "$PSScriptRoot"

# Set window style (1=normal, 7=minimized)
$Shortcut.WindowStyle = 7

# Set description
$Shortcut.Description = "Achievement Box - Personal Achievement Manager"

# Save shortcut
$Shortcut.Save()

Write-Host "Shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $PSScriptRoot\AchievementBox.lnk" -ForegroundColor Cyan
