import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getPrintfulShippingRates } from '../_shared/printful-api.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log('Received Stripe shipping calculation webhook');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Verify Stripe signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    const body = await req.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    // Extract shipping details from the webhook
    const { shipping, items } = body;
    
    if (!shipping?.address || !items) {
      throw new Error('Missing required shipping information');
    }

    // Get cart items from session metadata
    let cartItems;
    try {
      cartItems = JSON.parse(body.data.object.metadata.items);
    } catch (e) {
      console.error('Error parsing cart items from metadata:', e);
      throw new Error('Invalid cart items in metadata');
    }

    console.log('Calculating shipping for items:', cartItems);
    console.log('Shipping address:', shipping.address);

    // Calculate shipping with Printful
    const printfulRates = await getPrintfulShippingRates(cartItems, {
      address1: shipping.address.line1,
      city: shipping.address.city,
      state_code: shipping.address.state,
      country_code: shipping.address.country,
      zip: shipping.address.postal_code
    });

    if (!printfulRates || printfulRates.length === 0) {
      throw new Error('No shipping rates returned from Printful');
    }

    // Convert Printful rates to Stripe format
    const stripeRates = printfulRates.map(rate => ({
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: {
          amount: Math.round(parseFloat(rate.rate) * 100),
          currency: 'usd',
        },
        display_name: rate.name,
        delivery_estimate: {
          minimum: { unit: 'business_day', value: rate.minDeliveryDays },
          maximum: { unit: 'business_day', value: rate.maxDeliveryDays },
        },
        tax_behavior: 'exclusive',
        tax_code: 'txcd_92010001',
      }
    }));

    return new Response(
      JSON.stringify({ shipping_options: stripeRates }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Shipping calculation error:', error);
    return new Response(
      JSON.stringify({ 
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
