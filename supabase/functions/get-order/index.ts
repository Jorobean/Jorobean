import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import Stripe from "https://esm.sh/stripe@12.1.1";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface OrderItem {
  id: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
}

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  order_items: OrderItem[];
  shipping_address: ShippingAddress;
}

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type'
} as const;

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  let orderId: string | null = url.searchParams.get('order_id');

  if (!sessionId && !orderId) {
    return new Response(
      JSON.stringify({ error: 'Either session_id or order_id is required' }),
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY');
    
    if (!stripeKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const stripe = new Stripe(stripeKey);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      // If we have a session ID, get the order ID from Stripe first
      if (sessionId && !orderId) {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        orderId = session.metadata?.orderId ?? null;
      }

      if (!orderId) {
        return new Response(
          JSON.stringify({ error: 'Could not find order ID' }),
          { status: 404, headers: corsHeaders }
        );
      }

      // Get the order details from Supabase
      const { data, error: dbError } = await supabase
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
        .single();

      if (dbError) throw new Error(dbError.message);
      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify(data as Order),
        { headers: corsHeaders }
      );

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error:', errorMessage);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY');
    
    if (!stripeKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If we have a session ID, get the order ID from Stripe first
    if (sessionId && !orderId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      orderId = session.metadata?.orderId || null;
      
      if (!orderId) {
        return new Response(
          JSON.stringify({ error: 'Could not find order ID in session' }),
          { status: 404, headers: corsHeaders }
        );
      }
    }

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
      .single();

    if (error) throw error;
    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify(order),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Could not find order ID in session' }),
        { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, content-type'
          }
        }
      )
    }
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
