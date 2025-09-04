(() => {
    // Configuration
    const CONFIG = {
        SUPABASE_URL: 'https://vkdvweyatwcfqbocezjv.supabase.co/functions/v1',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZ3ZXlhdHdjZnFib2Nlemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjQ1MTgsImV4cCI6MjA3MTM0MDUxOH0.orSkIBG-3jVd1Trv9mKT6UD5JVNw7Opy4xLJa_A5E5I',
        STRIPE_TEST_KEY: 'pk_test_51RFSO1GHx57yahd0LYYHFgXpISL2NiCP0FhRGRGMBvNE3dZrUELRZZJyFkmkTd4WsCDDXyQvVYFFVzH6nIlbjEKl00qiAn2x0d',
        STRIPE_LIVE_KEY: 'pk_live_51RFSO1GHx57yahd0fA0HLVYo9OS4tLN7GYNPL09WiliQaTO2pDda4slh5Se6E4eAMjmHyMWoLH5F0UT5pmfD8qi300ZiV95GDz'
    };

    // Initialize Stripe based on environment
    const stripe = Stripe(
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? CONFIG.STRIPE_TEST_KEY
            : CONFIG.STRIPE_LIVE_KEY
    );

    // Sample test data for development
    const TEST_ORDER_DATA = {
    id: 'test_order_123',
    created_at: new Date().toISOString(),
    status: 'Processing',
    total: 199.98,
    order_items: [
        {
            name: 'Test Product 1',
            size: 'L',
            color: 'Black',
            quantity: 2,
            price: 49.99
        },
        {
            name: 'Test Product 2',
            size: 'M',
            color: 'Red',
            quantity: 1,
            price: 100.00
        }
    ]
};



async function initializeOrderSuccess() {
    try {
        // Clear cart and any pending session
        localStorage.removeItem('pending_session_id');
        localStorage.removeItem('cart');
        
        // Get the session ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (!sessionId) {
            throw new Error('No session ID found in URL');
        }

        // Get the order info element
        const orderInfo = document.getElementById('order-info');
        if (!orderInfo) {
            throw new Error('Order info element not found');
        }

        // Show loading state
        orderInfo.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading order details...</p>
            </div>
        `;

        let orderData;

        // First try to retrieve the Stripe session
        if (sessionId !== 'test') {
            try {
                const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
                console.log('Stripe session:', session);
            } catch (stripeError) {
                console.error('Error retrieving Stripe session:', stripeError);
            }
        }
        
        // Use test data if session_id is 'test', otherwise fetch from API
        if (sessionId === 'test') {
            orderData = TEST_ORDER_DATA;
            console.log('Using test data:', orderData);
        } else {
            // Fetch the order details from API
            const response = await fetch(`${CONFIG.SUPABASE_URL}/get-order?session_id=${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }

            orderData = await response.json();
            console.log('Received API data:', orderData);
        }

        if (!orderData || !orderData.order_items) {
            throw new Error('Invalid order data received');
        }
        
        // Update the order details section
        orderInfo.innerHTML = `
            <div class="order-summary">
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
            </div>
        `;
    } catch (error) {
        console.error('Error loading order details:', error);
        const orderInfo = document.getElementById('order-info');
        if (orderInfo) {
            orderInfo.innerHTML = `
                <div class="error-message">
                    <p>We're having trouble loading your order details.</p>
                    <p>Your order has been confirmed and you will receive an email confirmation shortly.</p>
                    <p>If you need immediate assistance, please contact our support team.</p>
                </div>
            `;
        }
    }
}

    // Initialize when the page loads
    document.addEventListener('DOMContentLoaded', initializeOrderSuccess);
})();
