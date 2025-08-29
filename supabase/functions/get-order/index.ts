import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

serve(async (req) => {
  const url = new URL(req.url)
  const orderId = url.searchParams.get('order_id')

  if (!orderId) {
    return new Response(
      JSON.stringify({ error: 'Order ID is required' }),
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, content-type'
        }
      }
    )
  }

  try {
    // Connect to your Supabase database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Query the orders table
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total,
        status,
        order_items (
          id,
          name,
          size,
          color,
          quantity,
          price
        ),
        shipping_address:recipient_address (
          name,
          address1,
          address2,
          city,
          state_code,
          country_code,
          zip
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify(order),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, content-type'
        }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, content-type'
        }
      }
    )
  }
})
