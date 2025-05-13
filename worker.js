// Cloudflare Worker configuration
const API_BASE_URL = 'https://api-mainnet.magiceden.dev/v3/rtp/ethereum';
const COLLECTION_ADDRESS = '0x616f2ac5dd4f760db693c21e9ca7a8aa962cf93b';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Configure CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://goblinarinos-xmas.ordinarinos.xyz',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  // Get tokenId from URL
  const url = new URL(request.url);
  const tokenId = url.pathname.split('/').pop();

  if (!tokenId) {
    return new Response('Token ID is required', { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tokens/${COLLECTION_ADDRESS}/${tokenId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'ME-Pub-API-Metadata': JSON.stringify({ paging: true })
      }
    });

    const data = await response.json();

    // Return the response with CORS headers
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch NFT data' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
