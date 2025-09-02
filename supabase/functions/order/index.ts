import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const PRINTFUL_API_URL = 'https://api.printful.com'

serve(async (req) => {
  try {
    const printfulApiKey = Deno.env.get('PRINTFUL_API_KEY')
    if (!printfulApiKey) {
      throw new Error('PRINTFUL_API_KEY is not set')
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const orderData = await req.json()

    const response = await fetch(`${PRINTFUL_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${printfulApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      throw new Error(`Printful API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify(data.result),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
