// Netlify Function to handle Printful API requests
// Environment variable required: PRINTFUL_API_KEY

import fetch from 'node-fetch';

// Printful API configuration
const PRINTFUL_API_BASE = 'https://api.printful.com';

// Helper function to make authenticated requests to Printful
async function printfulRequest(endpoint, options = {}) {
  const apiKey = process.env.PRINTFUL_API_KEY;
  if (!apiKey) {
    throw new Error('Printful API key not configured');
  }

  const url = `${PRINTFUL_API_BASE}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  console.log(`Making request to: ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers
  });

  const responseText = await response.text();
  
  try {
    const data = JSON.parse(responseText);
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Printful API request failed');
    }
    return data;
  } catch (error) {
    console.error('Failed to parse Printful response:', responseText);
    throw new Error('Invalid response from Printful API');
  }
}

exports.handler = async (event, context) => {
  // CORS headers for development and production
  const headers = {
    'Access-Control-Allow-Origin': 'https://bean9.netlify.app',
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
      console.log('Fetching products from Printful API');
      console.log('API Key present:', !!apiKey);
      console.log('Making request to Printful API');
      // First, get the store ID
      const storeResponse = await fetch(`${PRINTFUL_API_BASE}/stores`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const storeData = await storeResponse.json();
      if (!storeResponse.ok || !storeData.result || !storeData.result[0]) {
        throw new Error('Failed to get store information');
      }
      
      const storeId = storeData.result[0].id;
      console.log('Found store ID:', storeId);

      // Now fetch products with store ID
      const response = await fetch(`${PRINTFUL_API_BASE}/sync/products`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-PF-Store-Id': storeId.toString()
        }
      });

      console.log('Printful API response status:', response.status);
      const responseText = await response.text();
      console.log('Printful API raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse Printful response:', e);
        throw new Error('Invalid JSON from Printful API');
      }

      console.log('Parsed Printful response:', data);

      if (!response.ok) {
        throw new Error(data.result || data.error || 'Failed to fetch products');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data.result || data)
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
    // Add detailed error information
    const errorResponse = {
      error: error.message || 'Internal server error',
      details: error.response ? await error.response.text() : null,
      path: event.path,
      method: event.httpMethod
    };
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};
