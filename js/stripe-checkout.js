// Configuration
const STRIPE_KEY = 'pk_test_51RFSO1GHx57yahd0itlr5irlhNNztiEHP76LuHkL6m0FEdhjouIb2vDiL5f3JBS7zBKafVAKSSpRjNtfS3TYffnq00eAbYeRB0';
const SUPABASE_URL = 'https://qvyjpzndiimllhvddpwo.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2eWpwem5kaWltbGxodmRkcHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODkyMTM4ODUsImV4cCI6MjAwNDc4OTg4NX0.Nfn8cWdI58zHhW3GgkGBL5-DhqGDNbRr0nz6-0MsOvc';

const stripe = Stripe(STRIPE_KEY);

// Function to clear cart and close cart sidebar
function clearCart() {
    localStorage.removeItem('cart');
    
    // Close cart sidebar if it's open
    const cartSidebar = document.querySelector('.cart-sidebar');
    if (cartSidebar) {
        cartSidebar.classList.remove('open');
    }
    
    // Remove overlay if it exists
    const overlay = document.querySelector('.cart-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

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
        console.log('Fetching order details for session:', sessionId);
        const response = await fetch(`${SUPABASE_URL}/get-order?session_id=${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            console.error('Server response not ok:', response.status);
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch order details');
        }

        const orderData = await response.json();
        console.log('Received order data:', orderData);
        
        if (!orderData || !orderData.id) {
            throw new Error('Invalid order data received');
        }
        
        return orderData;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
}

// Initialize order success page if needed
if (window.location.pathname === '/order-success.html') {
    // Clear the cart on successful order
    clearCart();
    
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
        const orderInfo = document.getElementById('order-info');
        if (!orderInfo) return;

        // Show loading state
        orderInfo.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading order details...</p>
            </div>
        `;

        // Attempt to fetch order details multiple times
        let attempts = 0;
        const maxAttempts = 3;
        const retryInterval = 2000; // 2 seconds

        function attemptFetch() {
            attempts++;
            getOrderFromSession(sessionId)
                .then(orderData => {
                    if (!orderData || !orderData.order_items) {
                        throw new Error('Invalid order data structure');
                    }

                    orderInfo.innerHTML = `
                        <p><strong>Order ID:</strong> ${orderData.id}</p>
                        <p><strong>Date:</strong> ${new Date(orderData.created_at).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${orderData.status || 'Processing'}</p>
                        <h3>Items</h3>
                        <div class="order-items">
                            ${orderData.order_items.map(item => `
                                <div class="order-item">
                                    <div class="item-details">
                                        <h4>${item.name}</h4>
                                        <p>Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</p>
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
                })
                .catch(error => {
                    console.error(`Attempt ${attempts} failed:`, error);
                    if (attempts < maxAttempts) {
                        // Show retry message
                        orderInfo.innerHTML = `
                            <div class="loading-spinner">
                                <div class="spinner"></div>
                                <p>Loading order details... (Attempt ${attempts + 1}/${maxAttempts})</p>
                            </div>
                        `;
                        setTimeout(attemptFetch, retryInterval);
                    } else {
                        // Show final error message
                        orderInfo.innerHTML = `
                            <div class="error-message">
                                <p>We're having trouble loading your order details.</p>
                                <p>Your order has been confirmed and you will receive an email confirmation shortly.</p>
                                <p>If you need immediate assistance, please contact our support team.</p>
                            </div>
                        `;
                    }
                });
        }

        // Start the first attempt
        attemptFetch();
    }
}
