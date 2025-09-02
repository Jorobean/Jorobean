import { serve } from "std/http/server.ts";

interface PrintfulShippingItem {
  variant_id: string;
  quantity: number;
}

interface PrintfulAddress {
  country_code: string;
  state_code?: string;
  city?: string;
  zip?: string;
}

interface PrintfulShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

export async function getPrintfulShippingRates(
  items: PrintfulShippingItem[],
  address: PrintfulAddress
): Promise<PrintfulShippingRate[]> {
  const PRINTFUL_API_KEY = Deno.env.get("PRINTFUL_API_KEY");
  if (!PRINTFUL_API_KEY) {
    throw new Error("PRINTFUL_API_KEY is not set");
  }

  try {
    const response = await fetch("https://api.printful.com/shipping/rates", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PRINTFUL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: {
          address1: "19749 Dearborn St",  // Required by Printful but not used
          city: address.city || "",
          country_code: address.country_code,
          state_code: address.state_code || "",
          zip: address.zip || "",
        },
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
      currency: "USD",
      minDeliveryDays: rate.minDeliveryDays,
      maxDeliveryDays: rate.maxDeliveryDays,
    }));
  } catch (error) {
    console.error("Error fetching Printful shipping rates:", error);
    throw error;
  }
}

export function convertPrintfulToStripeShipping(rates: PrintfulShippingRate[]) {
  return rates.map((rate) => ({
    shipping_rate_data: {
      type: "fixed_amount",
      fixed_amount: {
        amount: Math.round(parseFloat(rate.rate) * 100), // Convert to cents
        currency: rate.currency.toLowerCase(),
      },
      display_name: rate.name,
      delivery_estimate: {
        minimum: {
          unit: "business_day",
          value: rate.minDeliveryDays,
        },
        maximum: {
          unit: "business_day",
          value: rate.maxDeliveryDays,
        },
      },
    },
  }));
}
