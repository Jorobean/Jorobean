import { serve } from 'std/http/server.ts'
import Stripe from 'stripe'
import { getPrintfulShippingRates, convertToStripeShippingOptions } from '../_shared/printful-api.ts'

// Minimum shipping cost if Printful API fails
const DEFAULT_SHIPPING_COST = 595; // $5.95 in cents

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400'
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  console.log('Request received:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('Processing POST request');
    
    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    const { items } = await req.json();
    console.log('Received items:', JSON.stringify(items, null, 2));

    if (!items || !Array.isArray(items)) {
      throw new Error('Invalid items data received');
    }

    // Create line items from cart items
    const lineItems = items.map((item: any) => {
      console.log('Processing item:', JSON.stringify(item, null, 2));
      
      // Validate item structure
      if (!item.price_data?.product_data?.name) {
        console.error('Invalid item structure:', item);
        throw new Error(`Invalid item structure. Expected price_data.product_data.name but got: ${JSON.stringify(item)}`);
      }

      return {
        price_data: {
          currency: 'usd',
          unit_amount: item.price_data.unit_amount,
          product_data: {
            name: item.price_data.product_data.name,
            description: item.price_data.product_data.description || '',
            images: item.price_data.product_data.images || [],
          },
        },
        quantity: item.quantity,
      };
    });

    console.log('Creating Stripe session with line items:', lineItems);

    // Prepare Printful items for shipping rate calculation
    const printfulItems = items.map((item: any) => ({
      variant_id: String(item.variant_id || ''),
      quantity: item.quantity
    }));

    // Default shipping options with a minimum cost
    const defaultShippingOptions = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: DEFAULT_SHIPPING_COST, currency: 'usd' },
          display_name: 'Standard Shipping',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 5 },
            maximum: { unit: 'business_day', value: 7 },
          },
        },
      }
    ];

    let shippingOptions = defaultShippingOptions;

    // We'll handle shipping calculations after the session is created
    // The actual shipping cost will be calculated when the customer enters their address

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin') || 'https://jorobean.com'}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || 'https://jorobean.com'}/store`,
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: 595, // $5.95 in cents
            currency: 'usd',
          },
          display_name: 'Standard Shipping',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 5 },
            maximum: { unit: 'business_day', value: 7 },
          }
        }
      }],
    });    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Checkout session error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
