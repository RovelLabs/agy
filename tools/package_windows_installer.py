"""
OPERON Windows Installer & Portable Package Generator
Builds production-ready Windows deployment package with installer, uninstaller,
desktop shortcuts, registry registration, and system tray integration.
"""
import os
import shutil
import zipfile

PROJECT_DIR = r"C:\Users\paranoia\Desktop\project abubu"
OUTPUT_DIR = os.path.join(PROJECT_DIR, "dist", "windows-installer")
ZIP_DEST = os.path.join(PROJECT_DIR, "OPERON-Windows-Installer-v1.0.0.zip")

def build_installer():
    print("[Windows Installer] Preparing installation distribution...")
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Copy required project directories
    dirs_to_copy = [
        ("packages", "packages"),
        ("ai", "ai"),
        ("apps/desktop", "apps/desktop"),
    ]

    for src, dest in dirs_to_copy:
        src_full = os.path.join(PROJECT_DIR, src)
        dest_full = os.path.join(OUTPUT_DIR, dest)
        shutil.copytree(src_full, dest_full)
        print(f"  + Copied {src} -> {dest}")

    # Copy root package.json
    shutil.copyfile(os.path.join(PROJECT_DIR, "package.json"), os.path.join(OUTPUT_DIR, "package.json"))

    # 1. Generate operon.cmd launcher
    operon_cmd = """@echo off
setlocal
cd /d "%~dp0"
start "" /b powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0apps\\desktop\\src\\windows\\win_tray.ps1"
start "" node "%~dp0apps\\desktop\\src\\main.js"
"""
    with open(os.path.join(OUTPUT_DIR, "operon.cmd"), "w", encoding="utf-8") as f:
        f.write(operon_cmd)
    print("  + Generated operon.cmd launcher")

    # 2. Generate Install-Operon.ps1
    install_ps1 = """# OPERON Windows Automated Installer
param(
    [switch]$Quiet = $false
)

$targetDir = "$env:LOCALAPPDATA\\Operon"
$currentDir = $PSScriptRoot

Write-Host "Installing OPERON into $targetDir..." -ForegroundColor Cyan

# Stop existing processes if running
Get-Process -Name node, powershell -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Operon*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Ensure directory exists
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

# Copy files
Copy-Item -Path "$currentDir\\*" -Destination $targetDir -Recurse -Force

# Create Desktop Shortcut
$wsh = New-Object -ComObject WScript.Shell
$desktopShortcut = $wsh.CreateShortcut("$env:USERPROFILE\\Desktop\\OPERON.lnk")
$desktopShortcut.TargetPath = "$targetDir\\operon.cmd"
$desktopShortcut.WorkingDirectory = $targetDir
$desktopShortcut.Description = "OPERON - The Autonomous Personal Operating Layer"
$desktopShortcut.Save()

# Create Start Menu Shortcut
$startMenuDir = "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs"
$startShortcut = $wsh.CreateShortcut("$startMenuDir\\Operon.lnk")
$startShortcut.TargetPath = "$targetDir\\operon.cmd"
$startShortcut.WorkingDirectory = $targetDir
$startShortcut.Description = "OPERON Automation"
$startShortcut.Save()

# Register in Windows Add/Remove Programs (Registry)
$regKey = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Operon"
if (-not (Test-Path $regKey)) {
    New-Item -Path $regKey -Force | Out-Null
}
Set-ItemProperty -Path $regKey -Name "DisplayName" -Value "OPERON (Autonomous Operating Layer)"
Set-ItemProperty -Path $regKey -Name "DisplayVersion" -Value "1.0.0-rc.1"
Set-ItemProperty -Path $regKey -Name "Publisher" -Value "OPERON Systems"
Set-ItemProperty -Path $regKey -Name "InstallLocation" -Value $targetDir
Set-ItemProperty -Path $regKey -Name "UninstallString" -Value "powershell.exe -ExecutionPolicy Bypass -File `"$targetDir\\Uninstall-Operon.ps1`""
Set-ItemProperty -Path $regKey -Name "QuietUninstallString" -Value "powershell.exe -ExecutionPolicy Bypass -File `"$targetDir\\Uninstall-Operon.ps1`" -Quiet"

Write-Host "[OK] OPERON Installation Complete!" -ForegroundColor Green
if (-not $Quiet) {
    Write-Host "Launch OPERON from your Desktop or Start Menu, or press Alt+Space anytime." -ForegroundColor Yellow
}
"""
    with open(os.path.join(OUTPUT_DIR, "Install-Operon.ps1"), "w", encoding="utf-8") as f:
        f.write(install_ps1)
    print("  + Generated Install-Operon.ps1")

    # 3. Generate Uninstall-Operon.ps1
    uninstall_ps1 = """# OPERON Windows Automated Uninstaller
param(
    [switch]$Quiet = $false
)

Write-Host "Uninstalling OPERON..." -ForegroundColor Yellow

# Terminate running instances
Get-Process -Name node, powershell -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Operon*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove Desktop & Start Menu shortcuts
Remove-Item -Path "$env:USERPROFILE\\Desktop\\OPERON.lnk" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Operon.lnk" -Force -ErrorAction SilentlyContinue

# Remove Registry uninstall entry
Remove-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Operon" -Recurse -Force -ErrorAction SilentlyContinue

# Remove Startup run entry if exists
Remove-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "Operon" -ErrorAction SilentlyContinue

# Clean target directory
$targetDir = "$env:LOCALAPPDATA\\Operon"
if (Test-Path $targetDir) {
    Remove-Item -Path $targetDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "[OK] OPERON Uninstalled successfully." -ForegroundColor Green
"""
    with open(os.path.join(OUTPUT_DIR, "Uninstall-Operon.ps1"), "w", encoding="utf-8") as f:
        f.write(uninstall_ps1)
    print("  + Generated Uninstall-Operon.ps1")

    # 4. Generate setup.bat wrapper for 1-click execution
    setup_bat = """@echo off
cd /d "%~dp0"
echo ===================================================
echo   Installing OPERON (Autonomous Personal OS Layer)
echo ===================================================
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0Install-Operon.ps1"
pause
"""
    with open(os.path.join(OUTPUT_DIR, "setup.bat"), "w", encoding="utf-8") as f:
        f.write(setup_bat)
    print("  + Generated setup.bat")

    # 5. Compress into release archive
    if os.path.exists(ZIP_DEST):
        os.remove(ZIP_DEST)

    print(f"[Windows Installer] Zipping package to {ZIP_DEST}...")
    with zipfile.ZipFile(ZIP_DEST, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(OUTPUT_DIR):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, OUTPUT_DIR)
                zf.write(abs_path, rel_path)

    zip_size = os.path.getsize(ZIP_DEST)
    print(f"[Windows Installer] [OK] Successfully generated {ZIP_DEST} ({zip_size} bytes)")

if __name__ == "__main__":
    build_installer()
