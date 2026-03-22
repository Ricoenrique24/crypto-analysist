// Netlify serverless function — proxies CoinGecko API to bypass CORS
export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/coingecko', '/api/v3');
  const search = url.search;
  const targetUrl = `https://api.coingecko.com${path}${search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = {
  path: "/api/coingecko/*",
};
