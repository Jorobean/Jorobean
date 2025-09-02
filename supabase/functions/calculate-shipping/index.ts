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
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { items, address } = await req.json();

    if (!items || !address) {
      return new Response(
        JSON.stringify({ shipping_options: [DEFAULT_SHIPPING_RATE] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const printfulItems = items.map((item: any) => ({
      variant_id: item.variant_id,
      quantity: item.quantity
    }));

    const printfulRates = await getPrintfulShippingRates(printfulItems, {
      address1: address.line1 || '',
      city: address.city || '',
      state_code: address.state || '',
      country_code: address.country || 'US',
      zip: address.postal_code || ''
    });

    // If we got valid rates from Printful, use those
    if (printfulRates && printfulRates.length > 0) {
      const calculatedRate = {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: Math.round(parseFloat(printfulRates[0].rate) * 100), // Convert to cents
            currency: 'usd',
          },
          display_name: printfulRates[0].name,
          delivery_estimate: {
            minimum: { unit: 'business_day', value: printfulRates[0].minDeliveryDays },
            maximum: { unit: 'business_day', value: printfulRates[0].maxDeliveryDays },
          }
        }
      };

      return new Response(
        JSON.stringify({ shipping_options: [calculatedRate] }),
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
