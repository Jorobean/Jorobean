import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'
import { getPrintfulShippingRates, convertToStripeShippingOptions, PrintfulShippingRate } from '../_shared/printful-api.ts'

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

// Configure tax settings using the stripe API
await stripe.tax.settings.update({
  defaults: {
    tax_code: 'txcd_99999999',  // General default tax code
    tax_behavior: 'exclusive',  // Add tax on top of price
  },
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

    if (!Deno.env.get('PRINTFUL_API_KEY')) {
      throw new Error('PRINTFUL_API_KEY is not set');
    }

    const requestBody = await req.json();
    console.log('Full request body:', JSON.stringify(requestBody, null, 2));

    const { items } = requestBody;
    if (!items || !Array.isArray(items)) {
      throw new Error('No items array found in request body');
    }
    console.log('Processing items:', JSON.stringify(items, null, 2));

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
    console.log('Received items for Printful:', JSON.stringify(items, null, 2));

    const printfulItems = items.map((item: any) => ({
      variant_id: item.variant_id, // Using the Printful variant_id
      quantity: item.quantity
    }));
    
    console.log('Prepared Printful items:', JSON.stringify(printfulItems, null, 2));

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

    // First, get an initial shipping rate from Printful for a default address
    const defaultShippingAddress = {
      address1: "1234 Test St",
      city: "Los Angeles",
      state_code: "CA",
      country_code: "US",
      zip: "90001"
    };

    console.log('Preparing Printful items:', JSON.stringify(printfulItems, null, 2));
    console.log('Using default shipping address:', JSON.stringify(defaultShippingAddress, null, 2));

    let printfulRates;
    try {
      // Get shipping rates from Printful
      printfulRates = await getPrintfulShippingRates(printfulItems, defaultShippingAddress);
      console.log('Received Printful rates:', JSON.stringify(printfulRates, null, 2));
      
      if (!printfulRates || printfulRates.length === 0) {
        throw new Error('Unable to get shipping rates from Printful');
      }
    } catch (error) {
      console.error('Printful shipping rate error:', error);
      throw new Error(`Failed to get Printful shipping rates: ${error.message}`);
    }

    // Create Checkout Session with dynamic shipping rates and automatic tax
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      shipping_options: convertToStripeShippingOptions(printfulRates),
      automatic_tax: {
        enabled: true
      },
      success_url: `${req.headers.get('origin') || 'https://jorobean.com'}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || 'https://jorobean.com'}/store`,
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
