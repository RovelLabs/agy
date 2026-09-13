"""
Package website build and deployment assets into self-contained zip for Cloudflare Pages and Workers
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
    print(f"[Packaging] Creating Cloudflare deployment package at: {ZIP_DEST}")
    if os.path.exists(ZIP_DEST):
        os.remove(ZIP_DEST)

    # 1. Ensure all dist assets exist
    required_dist_files = [
        "index.html",
        "404.html",
        "favicon.svg",
        "robots.txt",
        "sitemap.xml",
        "_headers",
        "_redirects",
        "wrangler.toml",
        "README.md",
        os.path.join("functions", "api", "health.js"),
        os.path.join("functions", "api", "version.js"),
    ]

    for rf in required_dist_files:
        full_path = os.path.join(DIST_DIR, rf)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Missing required distribution file: {full_path}")

    # 2. Package all files from DIST_DIR directly into the root of ZIP_DEST
    # This guarantees index.html is at the ROOT of the zip for Cloudflare Pages direct upload!
    with zipfile.ZipFile(ZIP_DEST, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(DIST_DIR):
            for file in files:
                abs_file = os.path.join(root, file)
                rel_archive_path = os.path.relpath(abs_file, DIST_DIR).replace("\\", "/")
                zf.write(abs_file, rel_archive_path)
                print(f"  + Added to zip root: {rel_archive_path} ({os.path.getsize(abs_file)} bytes)")

        # Also add root worker script for optional Cloudflare Workers CLI deployment
        worker_src = os.path.join(WEBSITE_DIR, "src", "index.js")
        if os.path.exists(worker_src):
            zf.write(worker_src, "worker.js")
            print(f"  + Added optional worker script: worker.js ({os.path.getsize(worker_src)} bytes)")

    # 3. Create a copy inside apps/website/
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

    # 1. Strict Cloudflare Pages root file verification
    root_must_exist = [
        "index.html",
        "404.html",
        "favicon.svg",
        "robots.txt",
        "sitemap.xml",
        "_headers",
        "_redirects",
        "wrangler.toml",
        "README.md",
        os.path.join("functions", "api", "health.js"),
        os.path.join("functions", "api", "version.js"),
    ]
    for rf in root_must_exist:
        p = os.path.join(VERIFY_DIR, rf)
        assert os.path.exists(p), f"Cloudflare Pages REQUIREMENT FAILED: Missing {rf} at root of extracted zip!"
        print(f"  [OK] Confirmed Cloudflare Pages file at root: {rf}")

    # 2. Secret Scan
    secret_patterns = ["CLOUDFLARE_API_KEY", "ghp_", "sk-proj-", "-----BEGIN PRIVATE KEY-----"]
    print("  [Verification] Scanning extracted files for secret patterns...")
    for root, _, files in os.walk(VERIFY_DIR):
        for f in files:
            fp = os.path.join(root, f)
            with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
                for pat in secret_patterns:
                    assert pat not in content, f"SECURITY ALERT: Secret pattern {pat} found in {f}!"
    print("  [OK] Zero secrets detected. Secret scanning PASS.")

    # 3. Test Pages Functions and HTML validation via Node
    test_node_cmd = [
        "node", "-e",
        """
        import fs from 'node:fs';
        import path from 'node:path';

        // 1. Verify index.html content
        const html = fs.readFileSync('index.html', 'utf8');
        if (!html.includes('OPERON') || !html.includes('Alt+Space') || !html.includes('data-theme="graphite"')) {
            console.error('Invalid index.html content');
            process.exit(1);
        }
        console.log('  [Test] index.html valid (' + html.length + ' bytes)');

        // 2. Verify 404.html content
        const notFound = fs.readFileSync('404.html', 'utf8');
        if (!notFound.includes('404') || !notFound.includes('OPERON')) {
            console.error('Invalid 404.html content');
            process.exit(1);
        }
        console.log('  [Test] 404.html valid (' + notFound.length + ' bytes)');

        // 3. Verify health function
        import('./functions/api/health.js').then(async (mod) => {
            const res = await mod.onRequest({});
            const data = await res.json();
            if (data.status !== 'healthy' || data.product !== 'OPERON') {
                console.error('Invalid health response', data);
                process.exit(1);
            }
            console.log('  [Test] Cloudflare Pages Function /api/health PASS:', data);
        }).catch(err => {
            console.error('Failed to import health function:', err);
            process.exit(1);
        });

        // 4. Verify version function
        import('./functions/api/version.js').then(async (mod) => {
            const res = await mod.onRequest({});
            const data = await res.json();
            if (!data.version || !data.downloads.windows) {
                console.error('Invalid version response', data);
                process.exit(1);
            }
            console.log('  [Test] Cloudflare Pages Function /api/version PASS: v' + data.version);
        }).catch(err => {
            console.error('Failed to import version function:', err);
            process.exit(1);
        });
        """
    ]
    print("  [Verification] Testing HTML and Pages Functions from extracted directory...")
    subprocess.check_call(test_node_cmd, cwd=VERIFY_DIR)

    # 4. Cleanup
    print("  [Verification] Cleaning up temporary directory...")
    shutil.rmtree(VERIFY_DIR)
    print("[Verification] ALL CLOUDFLARE VERIFICATION GATES PASSED CLEANLY.")

if __name__ == "__main__":
    create_deploy_zip()
    verify_deploy_zip()
