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
    
    // First get all products
    const productsResponse = await fetch(`${PRINTFUL_API_URL}/store/products`, {
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
        const detailResponse = await fetch(`${PRINTFUL_API_URL}/store/products/${product.id}`, {
          headers: {
            'Authorization': `Bearer ${printfulApiToken}`,
            'Content-Type': 'application/json'
          }
        })
        const detailData = await detailResponse.json()
        return detailData.result
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
