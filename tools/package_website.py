"""
Package website build and deployment assets into self-contained zip
"""
import os
import zipfile
import shutil
import subprocess

PROJECT_DIR = r"C:\Users\paranoia\Desktop\project abubu"
WEBSITE_DIR = os.path.join(PROJECT_DIR, "apps", "website")
ZIP_DEST = os.path.join(PROJECT_DIR, "OPERON-WEBSITE-DEPLOY.zip")
VERIFY_DIR = os.path.join(PROJECT_DIR, ".verify_website_deploy")

def create_deploy_zip():
    print(f"[Packaging] Creating deployment zip at: {ZIP_DEST}")
    if os.path.exists(ZIP_DEST):
        os.remove(ZIP_DEST)

    # Files and directories to package
    files_to_pack = [
        ("src/index.js", "src/index.js"),
        ("src/server.js", "src/server.js"),
        ("dist/index.html", "dist/index.html"),
        ("dist/robots.txt", "dist/robots.txt"),
        ("dist/sitemap.xml", "dist/sitemap.xml"),
        ("dist/favicon.svg", "dist/favicon.svg"),
        ("tools/build.js", "tools/build.js"),
        ("wrangler.toml", "wrangler.toml"),
        ("package.json", "package.json"),
        ("DEPLOY.md", "DEPLOY.md"),
        (".env.example", ".env.example")
    ]

    with zipfile.ZipFile(ZIP_DEST, 'w', zipfile.ZIP_DEFLATED) as zf:
        for rel_src, rel_dest in files_to_pack:
            abs_src = os.path.join(WEBSITE_DIR, rel_src)
            if os.path.exists(abs_src):
                zf.write(abs_src, rel_dest)
                print(f"  + Added {rel_dest} ({os.path.getsize(abs_src)} bytes)")
            else:
                raise FileNotFoundError(f"Missing required file: {abs_src}")

    zip_size = os.path.getsize(ZIP_DEST)
    print(f"[Packaging] Successfully created {ZIP_DEST} ({zip_size} bytes)")

def verify_deploy_zip():
    print(f"[Verification] Extracting {ZIP_DEST} into clean temporary directory {VERIFY_DIR}...")
    if os.path.exists(VERIFY_DIR):
        shutil.rmtree(VERIFY_DIR)
    os.makedirs(VERIFY_DIR)

    with zipfile.ZipFile(ZIP_DEST, 'r') as zf:
        zf.extractall(VERIFY_DIR)
        namelist = zf.namelist()
        print(f"  Extracted {len(namelist)} items: {namelist}")

    # 1. Verify required files exist
    required_files = [
        "src/index.js",
        "dist/index.html",
        "wrangler.toml",
        "DEPLOY.md",
        ".env.example"
    ]
    for rf in required_files:
        p = os.path.join(VERIFY_DIR, rf)
        assert os.path.exists(p), f"Missing required file in extracted zip: {rf}"
        print(f"  [OK] Confirmed file exists: {rf}")

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

    # 3. Test running the extracted worker script
    test_node_cmd = [
        "node", "-e",
        """
        import worker from './src/index.js';
        const req = new Request('http://localhost/api/health');
        const res = await worker.fetch(req, { ENVIRONMENT: 'production', VERSION: '1.0.0-rc.1' }, {});
        const data = await res.json();
        console.log('  [Worker Test] Health check response:', data);
        if (data.status !== 'healthy') process.exit(1);

        const pageReq = new Request('http://localhost/');
        const pageRes = await worker.fetch(pageReq, {}, {});
        const html = await pageRes.text();
        if (!html.includes('OPERON') || !html.includes('Alt+Space')) process.exit(1);
        console.log('  [Worker Test] Page render test PASS (' + html.length + ' bytes)');
        """
    ]
    print("  [Verification] Testing Worker fetch execution from extracted directory...")
    subprocess.check_call(test_node_cmd, cwd=VERIFY_DIR)

    # 4. Test dry-run with wrangler on extracted package
    wrangler_cmd = ["npx", "wrangler", "deploy", "--dry-run"]
    print("  [Verification] Testing wrangler deploy --dry-run on extracted package...")
    subprocess.check_call(wrangler_cmd, cwd=VERIFY_DIR, shell=True)
    print("  [Verification] Cleaning up verification directory...")
    shutil.rmtree(VERIFY_DIR)
    print("[Verification] ALL VERIFICATION GATES PASSED CLEANLY.")

if __name__ == "__main__":
    create_deploy_zip()
    verify_deploy_zip()
