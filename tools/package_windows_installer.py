"""
OPERON Windows Standalone Application & Installer Packager
Compiles native Operon.exe Win32 binary, bundles standalone portable Node runtime,
builds complete offline self-contained installer with tray integration, shortcuts, and uninstaller.
"""
import os
import shutil
import subprocess
import zipfile

PROJECT_DIR = r"C:\Users\paranoia\Desktop\project abubu"
OUTPUT_DIR = os.path.join(PROJECT_DIR, "dist", "windows-installer")
ZIP_DEST = os.path.join(PROJECT_DIR, "OPERON-Windows-Installer-v1.0.0.zip")
CSC_PATH = r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
NODE_SYSTEM_PATH = r"C:\Program Files\nodejs\node.exe"

def build_installer():
    print("[Windows Packager] Preparing self-contained application distribution...")
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. Copy required project modules
    dirs_to_copy = [
        ("packages", "packages"),
        ("ai", "ai"),
        ("apps/desktop", "apps/desktop"),
    ]

    for src, dest in dirs_to_copy:
        src_full = os.path.join(PROJECT_DIR, src)
        dest_full = os.path.join(OUTPUT_DIR, dest)
        shutil.copytree(src_full, dest_full)
        print(f"  + Synced {src} -> {dest}")

    # Copy package.json
    shutil.copyfile(os.path.join(PROJECT_DIR, "package.json"), os.path.join(OUTPUT_DIR, "package.json"))

    # 2. Bundle portable Node runtime
    bin_dir = os.path.join(OUTPUT_DIR, "bin")
    os.makedirs(bin_dir, exist_ok=True)
    if os.path.exists(NODE_SYSTEM_PATH):
        dest_node = os.path.join(bin_dir, "node.exe")
        shutil.copyfile(NODE_SYSTEM_PATH, dest_node)
        print(f"  + Bundled standalone portable runtime: bin/node.exe ({os.path.getsize(dest_node)} bytes)")

    # 3. Compile Native Win32 Operon.exe using csc.exe
    native_cs_src = os.path.join(OUTPUT_DIR, "apps", "desktop", "src", "windows", "NativeApp.cs")
    operon_exe_out = os.path.join(OUTPUT_DIR, "Operon.exe")
    
    cmd = [
        CSC_PATH,
        "/nologo",
        "/target:winexe",
        f"/out:{operon_exe_out}",
        "/r:System.dll",
        "/r:System.Windows.Forms.dll",
        "/r:System.Drawing.dll",
        native_cs_src
    ]
    
    print("  + Compiling native Win32 binary Operon.exe...")
    compile_proc = subprocess.run(cmd, capture_output=True, text=True)
    if compile_proc.returncode != 0:
        raise RuntimeError(f"C# compilation failed: {compile_proc.stderr}")
    print(f"  + [OK] Compiled native Operon.exe ({os.path.getsize(operon_exe_out)} bytes)")

    # 4. Generate operon.cmd fallback launcher
    operon_cmd = """@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0Operon.exe" (
    start "" "%~dp0Operon.exe"
) else (
    start "" /b powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0apps\\desktop\\src\\windows\\win_tray.ps1"
    start "" "%~dp0bin\\node.exe" "%~dp0apps\\desktop\\src\\main.js"
)
"""
    with open(os.path.join(OUTPUT_DIR, "operon.cmd"), "w", encoding="utf-8") as f:
        f.write(operon_cmd)
    print("  + Generated operon.cmd launcher")

    # 5. Generate Install-Operon.ps1
    install_ps1 = """# OPERON Windows Automated Installer
param(
    [switch]$Quiet = $false
)

$targetDir = "$env:LOCALAPPDATA\\Operon"
$currentDir = $PSScriptRoot

Write-Host "Installing OPERON into $targetDir..." -ForegroundColor Cyan

# Terminate running instances
Get-Process -Name Operon, node, powershell -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Operon*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Ensure directory exists
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

# Copy files
Copy-Item -Path "$currentDir\\*" -Destination $targetDir -Recurse -Force

# Create Desktop Shortcut
$wsh = New-Object -ComObject WScript.Shell
$desktopShortcut = $wsh.CreateShortcut("$env:USERPROFILE\\Desktop\\OPERON.lnk")
$desktopShortcut.TargetPath = "$targetDir\\Operon.exe"
$desktopShortcut.WorkingDirectory = $targetDir
$desktopShortcut.Description = "OPERON - The Autonomous Personal Operating Layer"
if (Test-Path "$targetDir\\Operon.exe") {
    $desktopShortcut.IconLocation = "$targetDir\\Operon.exe,0"
}
$desktopShortcut.Save()

# Create Start Menu Shortcut
$startMenuDir = "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs"
$startShortcut = $wsh.CreateShortcut("$startMenuDir\\Operon.lnk")
$startShortcut.TargetPath = "$targetDir\\Operon.exe"
$startShortcut.WorkingDirectory = $targetDir
$startShortcut.Description = "OPERON Automation"
if (Test-Path "$targetDir\\Operon.exe") {
    $startShortcut.IconLocation = "$targetDir\\Operon.exe,0"
}
$startShortcut.Save()

# Register in Windows Add/Remove Programs (Registry)
$regKey = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Operon"
if (-not (Test-Path $regKey)) {
    New-Item -Path $regKey -Force | Out-Null
}
Set-ItemProperty -Path $regKey -Name "DisplayName" -Value "OPERON (Autonomous Operating Layer)"
Set-ItemProperty -Path $regKey -Name "DisplayVersion" -Value "1.0.0-rc.2"
Set-ItemProperty -Path $regKey -Name "Publisher" -Value "OPERON Systems"
Set-ItemProperty -Path $regKey -Name "InstallLocation" -Value $targetDir
Set-ItemProperty -Path $regKey -Name "DisplayIcon" -Value "$targetDir\\Operon.exe,0"
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

    # 6. Generate Uninstall-Operon.ps1
    uninstall_ps1 = """# OPERON Windows Automated Uninstaller
param(
    [switch]$Quiet = $false
)

Write-Host "Uninstalling OPERON..." -ForegroundColor Yellow

# Terminate running instances
Get-Process -Name Operon, node, powershell -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Operon*" } | Stop-Process -Force -ErrorAction SilentlyContinue

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

    # 7. Generate setup.bat wrapper for 1-click execution
    setup_bat = """@echo off
cd /d "%~dp0"
echo ===================================================
echo   Installing OPERON (Autonomous Personal OS Layer)
echo ===================================================
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0Install-Operon.ps1"
if %errorlevel% equ 0 (
    echo.
    echo Launching OPERON...
    start "" "%LOCALAPPDATA%\\Operon\\Operon.exe"
)
pause
"""
    with open(os.path.join(OUTPUT_DIR, "setup.bat"), "w", encoding="utf-8") as f:
        f.write(setup_bat)
    print("  + Generated setup.bat")

    # 8. Compress into release archive
    if os.path.exists(ZIP_DEST):
        os.remove(ZIP_DEST)

    print(f"[Windows Packager] Zipping release archive to {ZIP_DEST}...")
    with zipfile.ZipFile(ZIP_DEST, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(OUTPUT_DIR):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, OUTPUT_DIR)
                zf.write(abs_path, rel_path)

    zip_size = os.path.getsize(ZIP_DEST)
    print(f"[Windows Packager] [OK] Successfully generated {ZIP_DEST} ({zip_size:,} bytes / {zip_size / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    build_installer()
