/**
 * Cloudflare Pages Function: /api/health
 */
export async function onRequest(context) {
  return new Response(JSON.stringify({
    status: 'healthy',
    product: 'OPERON',
    version: '1.0.0-rc.2',
    environment: 'production',
    platform: 'cloudflare-pages',
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  });
}
