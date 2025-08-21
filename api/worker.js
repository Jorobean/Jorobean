export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // CORS headers
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      // Handle OPTIONS request
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
      }

      // Products endpoint
      if (url.pathname === '/api/products') {
        const printfulResponse = await fetch('https://api.printful.com/store/products', {
          headers: {
            'Authorization': `Bearer ${env.PRINTFUL_API_KEY}`,
          },
        });
        
        const data = await printfulResponse.json();
        return new Response(JSON.stringify(data), { headers });
      }

      // Variants endpoint
      if (url.pathname === '/api/variants') {
        const productId = url.searchParams.get('id');
        if (!productId) {
          return new Response(JSON.stringify({ error: 'Product ID is required' }), {
            status: 400,
            headers,
          });
        }

        const printfulResponse = await fetch(`https://api.printful.com/store/products/${productId}`, {
          headers: {
            'Authorization': `Bearer ${env.PRINTFUL_API_KEY}`,
          },
        });
        
        const data = await printfulResponse.json();
        return new Response(JSON.stringify(data), { headers });
      }

      // Serve static content for other routes
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
