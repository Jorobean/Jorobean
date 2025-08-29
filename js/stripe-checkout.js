// Stripe configuration
const stripe = Stripe('pk_live_51RFSO1GHx57yahd0fA0HLVYo9OS4tLN7GYNPL09WiliQaTO2pDda4slh5Se6E4eAMjmHyMWoLH5F0UT5pmfD8qi300ZiV95GDz'); // Replace with your publishable key

async function createCheckoutSession(items) {
    try {
        const response = await fetch(`${SUPABASE_URL}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ items })
        });

        const { sessionId, error } = await response.json();
        if (error) {
            throw new Error(error);
        }

        const stripe = Stripe('YOUR_PUBLISHABLE_KEY');
        const { error: stripeError } = await stripe.redirectToCheckout({
            sessionId,
            successUrl: `${window.location.origin}/order-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: window.location.href
        });

        if (stripeError) {
            throw new Error(stripeError.message);
        }
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

// Function to get order details from session ID
async function getOrderFromSession(sessionId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/get-order?session_id=${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }

        const orderData = await response.json();
        return orderData;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
}

// Initialize order success page if needed
if (window.location.pathname === '/order-success.html') {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
        getOrderFromSession(sessionId)
            .then(orderData => {
                const orderInfo = document.getElementById('order-info');
                if (orderInfo) {
                    orderInfo.innerHTML = `
                        <p><strong>Order ID:</strong> ${orderData.id}</p>
                        <p><strong>Date:</strong> ${new Date(orderData.created_at).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${orderData.status}</p>
                        <h3>Items</h3>
                        <div class="order-items">
                            ${orderData.items.map(item => `
                                <div class="order-item">
                                    <div class="item-details">
                                        <h4>${item.name}</h4>
                                        <p>Size: ${item.size} | Color: ${item.color}</p>
                                        <p>Quantity: ${item.quantity}</p>
                                    </div>
                                    <p class="item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            `).join('')}
                        </div>
                        <div class="order-total">
                            <p><strong>Total:</strong> $${orderData.total.toFixed(2)}</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error displaying order:', error);
                const orderInfo = document.getElementById('order-info');
                if (orderInfo) {
                    orderInfo.innerHTML = `
                        <div class="error-message">
                            <p>Sorry, we couldn't load your order details.</p>
                            <p>Please contact support if this persists.</p>
                        </div>
                    `;
                }
            });
    }
}
