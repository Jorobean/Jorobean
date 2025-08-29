import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0'

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      httpClient: Stripe.createFetchHttpClient()
    })

    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      throw new Error('Missing Stripe webhook signature or secret')
    }

    // Get the raw body as text
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        
        // Extract order details from metadata
        const orderDetails = paymentIntent.metadata.order
        if (!orderDetails) {
          throw new Error('No order details found in payment intent metadata')
        }

        // Create order in Printful
        const printfulResponse = await fetch('https://api.printful.com/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('PRINTFUL_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...JSON.parse(orderDetails),
            payment_intent: paymentIntent.id
          })
        })

        if (!printfulResponse.ok) {
          throw new Error('Failed to create Printful order')
        }

        const printfulOrder = await printfulResponse.json()

        // Store order details in your database if needed
        // You can create another Supabase Edge Function for this

        return new Response(JSON.stringify({ received: true }), {
          headers: { 'Content-Type': 'application/json' }
        })

      default:
        console.log(`Unhandled event type: ${event.type}`)
        return new Response(JSON.stringify({ received: true }), {
          headers: { 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Webhook error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
