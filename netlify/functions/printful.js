// Netlify Function to handle Printful API requests
// Environment variable required: PRINTFUL_API_KEY

const PRINTFUL_API_BASE = 'https://api.printful.com';

exports.handler = async (event, context) => {
  // CORS headers for development and production
  const headers = {
    'Access-Control-Allow-Origin': 'https://jorobean.com', // Update this to your domain
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Verify Printful API key is configured
  const apiKey = process.env.PRINTFUL_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Printful API key not configured'
      })
    };
  }

  try {
    // GET /products endpoint
    if (event.httpMethod === 'GET' && event.path.endsWith('/products')) {
      const response = await fetch(`${PRINTFUL_API_BASE}/store/products`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.result || 'Failed to fetch products');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data.result)
      };
    }

    // POST /order endpoint
    if (event.httpMethod === 'POST' && event.path.endsWith('/order')) {
      // Validate request body
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Request body is required'
          })
        };
      }

      const orderData = JSON.parse(event.body);

      // Validate order data
      if (!orderData.items || !orderData.recipient) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid order data. Required: items and recipient information'
          })
        };
      }

      // Create order in Printful
      const response = await fetch(`${PRINTFUL_API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: orderData.recipient,
          items: orderData.items.map(item => ({
            sync_variant_id: item.variantId,
            quantity: item.quantity
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.result || 'Failed to create order');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          orderId: data.result.id,
          status: data.result.status
        })
      };
    }

    // Handle unknown endpoints
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Not found'
      })
    };

  } catch (error) {
    console.error('Printful API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    };
  }
};
