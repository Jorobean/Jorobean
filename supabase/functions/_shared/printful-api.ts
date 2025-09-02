export interface PrintfulShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

export interface PrintfulShippingItem {
  variant_id: string;
  quantity: number;
}

export interface PrintfulAddress {
  address1: string;
  city?: string;
  state_code?: string;
  country_code: string;
  zip?: string;
}

export async function getPrintfulShippingRates(
  items: PrintfulShippingItem[],
  address: PrintfulAddress
): Promise<PrintfulShippingRate[]> {
  const PRINTFUL_API_KEY = Deno.env.get('PRINTFUL_API_KEY');
  if (!PRINTFUL_API_KEY) {
    throw new Error('PRINTFUL_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.printful.com/shipping/rates', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: address,
      items: items,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Printful API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.result.map((rate: any) => ({
    id: rate.id,
    name: rate.name,
    rate: rate.rate,
    currency: 'USD',
    minDeliveryDays: rate.min_delivery_days || 5,
    maxDeliveryDays: rate.max_delivery_days || 7,
  }));
}

export function convertToStripeShippingOptions(rates: PrintfulShippingRate[]) {
  return rates.map(rate => ({
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: {
        amount: Math.round(parseFloat(rate.rate) * 100), // Convert to cents
        currency: rate.currency.toLowerCase(),
      },
      display_name: rate.name,
      delivery_estimate: {
        minimum: {
          unit: 'business_day',
          value: rate.minDeliveryDays,
        },
        maximum: {
          unit: 'business_day',
          value: rate.maxDeliveryDays,
        },
      },
    },
  }));
}
