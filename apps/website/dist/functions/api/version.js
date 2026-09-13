/**
 * Cloudflare Pages Function: /api/version
 */
export async function onRequest(context) {
  return new Response(JSON.stringify({
    version: '1.0.0-rc.2',
    channel: 'release-candidate',
    releaseDate: '2026-09-14',
    downloads: {
      windows: {
        filename: 'OPERON-Windows-Installer-v1.0.0.zip',
        status: 'available',
        sizeBytes: 34461459,
        sha256: 'available_in_release'
      },
      macos: {
        filename: 'OPERON-macOS-Universal-v1.0.0.tar.gz',
        status: 'available',
        sizeBytes: 60825
      },
      android: {
        filename: 'Operon-1.0.0.apk',
        status: 'available'
      },
      ios: {
        status: 'testflight-ready'
      }
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
