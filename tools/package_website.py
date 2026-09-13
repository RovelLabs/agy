"""
Package website build into 100% pure static zip for Cloudflare Pages Direct Upload
Guarantees NO wrangler config, NO build process requirements, NO worker files in the zip.
"""
import os
import zipfile
import shutil
import subprocess

PROJECT_DIR = r"C:\Users\paranoia\Desktop\project abubu"
WEBSITE_DIR = os.path.join(PROJECT_DIR, "apps", "website")
DIST_DIR = os.path.join(WEBSITE_DIR, "dist")
ZIP_DEST = os.path.join(PROJECT_DIR, "OPERON-WEBSITE-DEPLOY.zip")
WEBSITE_ZIP_COPY = os.path.join(WEBSITE_DIR, "OPERON-WEBSITE-DEPLOY.zip")
VERIFY_DIR = os.path.join(PROJECT_DIR, ".verify_website_deploy")

def create_deploy_zip():
    print(f"[Packaging] Creating pure static Cloudflare Pages upload package at: {ZIP_DEST}")
    if os.path.exists(ZIP_DEST):
        os.remove(ZIP_DEST)

    # Forbidden files in Cloudflare Pages Direct Upload (they trigger "uploader does not yet support projects that require a build process"):
    forbidden_files = ["wrangler.toml", "wrangler.json", "package.json", "worker.js", "functions"]
    
    # 1. Clean any accidental build/wrangler files from dist
    for fb in forbidden_files:
        p = os.path.join(DIST_DIR, fb)
        if os.path.exists(p):
            if os.path.isdir(p):
                shutil.rmtree(p)
            else:
                os.remove(p)
            print(f"  - Removed forbidden build file: {fb}")

    # 2. Verify required static files exist
    required_static_files = [
        "index.html",
        "404.html",
        "favicon.svg",
        "robots.txt",
        "sitemap.xml",
        "_headers",
        "_redirects",
        os.path.join("api", "health.json"),
        os.path.join("api", "version.json"),
    ]

    for rf in required_static_files:
        full_path = os.path.join(DIST_DIR, rf)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Missing required distribution file: {full_path}")

    # 3. Package ONLY files from DIST_DIR directly into the root of ZIP_DEST
    # NO wrangler config, NO functions/ folder, NO build configs
    with zipfile.ZipFile(ZIP_DEST, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(DIST_DIR):
            for file in files:
                abs_file = os.path.join(root, file)
                rel_archive_path = os.path.relpath(abs_file, DIST_DIR).replace("\\", "/")
                zf.write(abs_file, rel_archive_path)
                print(f"  + Added to zip root: {rel_archive_path} ({os.path.getsize(abs_file)} bytes)")

    # 4. Create copy inside apps/website/
    shutil.copy2(ZIP_DEST, WEBSITE_ZIP_COPY)
    print(f"  + Synced deploy archive to {WEBSITE_ZIP_COPY}")

    zip_size = os.path.getsize(ZIP_DEST)
    print(f"[Packaging] [OK] Successfully created {ZIP_DEST} ({zip_size} bytes / {zip_size / 1024:.2f} KB)")

def verify_deploy_zip():
    print(f"[Verification] Extracting {ZIP_DEST} into clean temporary directory {VERIFY_DIR}...")
    if os.path.exists(VERIFY_DIR):
        shutil.rmtree(VERIFY_DIR)
    os.makedirs(VERIFY_DIR)

    with zipfile.ZipFile(ZIP_DEST, 'r') as zf:
        zf.extractall(VERIFY_DIR)
        namelist = zf.namelist()
        print(f"  Extracted {len(namelist)} items directly to root: {namelist}")

    # 1. Assert NO wrangler or build config files exist in the zip
    forbidden_in_zip = ["wrangler.toml", "wrangler.json", "package.json", "worker.js", "functions"]
    for item in namelist:
        for fb in forbidden_in_zip:
            assert not item.startswith(fb), f"CRITICAL ERROR: {fb} found in upload ZIP! This triggers Cloudflare uploader error!"
    print("  [OK] Confirmed ZERO wrangler configs and ZERO build files in ZIP.")

    # 2. Strict Cloudflare Pages root file verification
    root_must_exist = [
        "index.html",
        "404.html",
        "favicon.svg",
        "robots.txt",
        "sitemap.xml",
        "_headers",
        "_redirects",
        os.path.join("api", "health.json"),
        os.path.join("api", "version.json"),
    ]
    for rf in root_must_exist:
        p = os.path.join(VERIFY_DIR, rf)
        assert os.path.exists(p), f"Missing required file: {rf}"
        print(f"  [OK] Confirmed static file at root: {rf}")

    # 3. Secret Scan
    secret_patterns = ["CLOUDFLARE_API_KEY", "ghp_", "sk-proj-", "-----BEGIN PRIVATE KEY-----"]
    for root, _, files in os.walk(VERIFY_DIR):
        for f in files:
            fp = os.path.join(root, f)
            with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
                for pat in secret_patterns:
                    assert pat not in content, f"SECURITY ALERT: Secret pattern {pat} found in {f}!"
    print("  [OK] Zero secrets detected. Secret scanning PASS.")

    # 4. Test HTML and JSON validity
    test_node_cmd = [
        "node", "-e",
        """
        import fs from 'node:fs';

        const html = fs.readFileSync('index.html', 'utf8');
        if (!html.includes('OPERON') || !html.includes('Alt+Space') || !html.includes('data-theme="graphite"')) {
            console.error('Invalid index.html content');
            process.exit(1);
        }
        console.log('  [Test] index.html valid (' + html.length + ' bytes)');

        const health = JSON.parse(fs.readFileSync('api/health.json', 'utf8'));
        if (health.status !== 'healthy' || health.product !== 'OPERON') {
            console.error('Invalid health.json');
            process.exit(1);
        }
        console.log('  [Test] api/health.json valid: status=' + health.status);

        const version = JSON.parse(fs.readFileSync('api/version.json', 'utf8'));
        if (!version.version || !version.downloads.windows) {
            console.error('Invalid version.json');
            process.exit(1);
        }
        console.log('  [Test] api/version.json valid: v' + version.version);
        """
    ]
    print("  [Verification] Testing static assets via Node.js...")
    subprocess.check_call(test_node_cmd, cwd=VERIFY_DIR)

    # 5. Cleanup
    shutil.rmtree(VERIFY_DIR)
    print("[Verification] ALL CLOUDFLARE PAGES DIRECT UPLOAD GATES PASSED CLEANLY.")

if __name__ == "__main__":
    create_deploy_zip()
    verify_deploy_zip()
