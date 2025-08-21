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
    const printfulApiKey = Deno.env.get('PRINTFUL_API_KEY')
    if (!printfulApiKey) {
      throw new Error('PRINTFUL_API_KEY is not set')
    }

    console.log('Using Printful API token:', printfulApiKey.substring(0, 5) + '...')
    
    const response = await fetch(`${PRINTFUL_API_URL}/store/products`, {
      headers: {
        'Authorization': `Bearer ${printfulApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const responseData = await response.json()
    
    if (!response.ok) {
      console.error('Printful API error details:', responseData)
      throw new Error(`Printful API error: ${response.statusText}. Details: ${JSON.stringify(responseData)}`)
    }

    const data = responseData
    
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
