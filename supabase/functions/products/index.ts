import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const PRINTFUL_API_URL = 'https://api.printful.com'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type'
      },
      status: 204
    })
  }

  try {
    // Get the Printful API token from environment variables
    const printfulApiToken = Deno.env.get('PRINTFUL_API_KEY')
    if (!printfulApiToken) {
      throw new Error('PRINTFUL_API_KEY is not set')
    }

    console.log('Using Printful API token:', printfulApiToken.substring(0, 5) + '...')
    
    // Get store ID from environment variables
    const storeId = Deno.env.get('PRINTFUL_STORE_ID')
    if (!storeId) {
      throw new Error('PRINTFUL_STORE_ID is not set')
    }

    // First get all products
    const productsResponse = await fetch(`${PRINTFUL_API_URL}/store/products?store_id=${storeId}`, {
      headers: {
        'Authorization': `Bearer ${printfulApiToken}`,
        'Content-Type': 'application/json'
      }
    })

    const productsData = await productsResponse.json()
    
    if (!productsResponse.ok) {
      console.error('Printful API error details:', productsData)
      throw new Error(`Printful API error: ${productsResponse.statusText}. Details: ${JSON.stringify(productsData)}`)
    }

    // Then get detailed information for each product including variants and retail prices
    const productsWithDetails = await Promise.all(
      productsData.result.map(async (product) => {
        // Get basic product details
        const detailResponse = await fetch(`${PRINTFUL_API_URL}/store/products/${product.id}?store_id=${storeId}`, {
          headers: {
            'Authorization': `Bearer ${printfulApiToken}`,
            'Content-Type': 'application/json'
          }
        });
        const detailData = await detailResponse.json();
        const productDetails = detailData.result;

        // Get variant mockups for each variant
        const variantsWithMockups = await Promise.all(
          productDetails.sync_variants.map(async (variant) => {
            try {
              const mockupResponse = await fetch(
                `${PRINTFUL_API_URL}/mockup-generator/variant/${variant.variant_id}`, {
                  headers: {
                    'Authorization': `Bearer ${printfulApiToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              const mockupData = await mockupResponse.json();
              
              // Add mockup URLs to the variant
              return {
                ...variant,
                mockup_urls: mockupData.result.mockups.map(m => m.mockup_url),
                preview_url: mockupData.result.mockups.find(m => m.placement === 'front')?.mockup_url || variant.preview_url
              };
            } catch (error) {
              console.error(`Error fetching mockups for variant ${variant.variant_id}:`, error);
              return variant;
            }
          })
        );

        return {
          ...productDetails,
          sync_variants: variantsWithMockups
        };
      })
    )

    const data = { result: productsWithDetails }
    
    return new Response(
      JSON.stringify(data.result),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, content-type'
        },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, content-type'
        },
        status: 500
      }
    )
  }
})
