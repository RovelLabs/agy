"""
OPERON macOS Bundle & Deployment Packager
Packages Operon.app bundle with Resources, Info.plist, and launcher.
"""
import os
import shutil
import tarfile
import zipfile

PROJECT_DIR = r"C:\Users\paranoia\Desktop\project abubu"
MACOS_APP_DIR = os.path.join(PROJECT_DIR, "apps", "macos", "Operon.app")
RESOURCES_DIR = os.path.join(MACOS_APP_DIR, "Contents", "Resources")
TAR_DEST = os.path.join(PROJECT_DIR, "OPERON-macOS-Universal-v1.0.0.tar.gz")

def build_macos_package():
    print("[macOS Packager] Packaging Operon.app for macOS...")
    os.makedirs(RESOURCES_DIR, exist_ok=True)

    # Copy core codebase into App Resources
    for src in ["packages", "ai", "apps/desktop"]:
        src_path = os.path.join(PROJECT_DIR, src)
        dest_path = os.path.join(RESOURCES_DIR, src)
        if os.path.exists(dest_path):
            shutil.rmtree(dest_path)
        shutil.copytree(src_path, dest_path)
        print(f"  + Synced {src} -> Resources/{src}")

    # Copy root package.json
    shutil.copyfile(os.path.join(PROJECT_DIR, "package.json"), os.path.join(RESOURCES_DIR, "package.json"))

    # Create tar.gz archive preserving file structure
    print(f"[macOS Packager] Archiving to {TAR_DEST}...")
    with tarfile.open(TAR_DEST, "w:gz") as tar:
        tar.add(MACOS_APP_DIR, arcname="Operon.app")

    size = os.path.getsize(TAR_DEST)
    print(f"[macOS Packager] [OK] Created {TAR_DEST} ({size} bytes)")

if __name__ == "__main__":
    build_macos_package()
