import { serve } from 'std/http/server.ts'
import { getPrintfulShippingRates } from '../_shared/printful-api.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400'
};

// Default shipping rate if Printful calculation fails
const DEFAULT_SHIPPING_RATE = {
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
};

serve(async (req) => {
  console.log('Received shipping calculation request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    const { items, address } = body;

    if (!items || !address) {
      return new Response(
        JSON.stringify({ shipping_options: [DEFAULT_SHIPPING_RATE] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Parse the items from session metadata if it exists
    let printfulItems;
    if (typeof items === 'string') {
      try {
        printfulItems = JSON.parse(items);
      } catch (e) {
        console.error('Error parsing items from metadata:', e);
        throw new Error('Invalid items format');
      }
    } else {
      printfulItems = items.map((item: any) => ({
        variant_id: item.variant_id,
        quantity: item.quantity
      }));
    }

    console.log('Calculating shipping for items:', printfulItems);
    console.log('Shipping to address:', address);

    const printfulRates = await getPrintfulShippingRates(printfulItems, {
      address1: address.line1 || address.address1 || '',
      city: address.city || '',
      state_code: address.state || address.state_code || '',
      country_code: address.country || address.country_code || 'US',
      zip: address.postal_code || address.zip || ''
    });

    // If we got valid rates from Printful, use those
    if (printfulRates && printfulRates.length > 0) {
      const calculatedRates = printfulRates.map(rate => ({
        shipping_rate_data: {
          display_name: rate.name,
          type: 'fixed_amount',
          fixed_amount: {
            amount: Math.round(parseFloat(rate.rate) * 100), // Convert to cents
            currency: 'usd',
          },
          delivery_estimate: {
            minimum: { unit: 'business_day', value: rate.minDeliveryDays },
            maximum: { unit: 'business_day', value: rate.maxDeliveryDays },
          }
        }
      }));

      return new Response(
        JSON.stringify({ shipping_options: calculatedRates }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      // If no valid rates, return the default rate
      return new Response(
        JSON.stringify({ shipping_options: [DEFAULT_SHIPPING_RATE] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

  } catch (error) {
    console.error('Shipping calculation error:', error);
    // On any error, return the default shipping rate
    return new Response(
      JSON.stringify({ shipping_options: [DEFAULT_SHIPPING_RATE] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
