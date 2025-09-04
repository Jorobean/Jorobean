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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  let orderId: string | null = url.searchParams.get('order_id');

  if (!sessionId && !orderId) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request',
        message: 'Order information not found'
      }),
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Get environment variables
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY');
    
    if (!stripeKey || !supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error',
          message: 'Unable to process request'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize clients
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      // If we have a session ID, get the order ID from Stripe
      if (sessionId && !orderId) {
        console.log('Retrieving order ID from session:', sessionId);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        orderId = session.metadata?.orderId || null;
      }

      if (!orderId) {
        console.error('No order ID found in session');
        return new Response(
          JSON.stringify({ 
            error: 'Order not found',
            message: 'Unable to locate order information'
          }),
          { status: 404, headers: corsHeaders }
        );
      }

      console.log('Fetching order details for:', orderId);

      // Get the order details from Supabase
      const { data: order, error: dbError } = await supabase
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
          )
        `)
        .eq('id', orderId)
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to retrieve order details');
      }

      if (!order) {
        console.error('Order not found in database:', orderId);
        return new Response(
          JSON.stringify({ 
            error: 'Order not found',
            message: 'Unable to locate order information'
          }),
          { status: 404, headers: corsHeaders }
        );
      }

      console.log('Successfully retrieved order:', order.id);
      
      return new Response(
        JSON.stringify({
          id: order.id,
          created_at: order.created_at,
          status: order.status || 'processing',
          total: order.total,
          order_items: order.order_items
        }),
        { headers: corsHeaders }
      );

    } catch (error: unknown) {
      console.error('Error processing order request:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Processing error',
          message: 'Unable to retrieve order information'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error: unknown) {
    console.error('System error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'System error',
        message: 'Unable to process request'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
