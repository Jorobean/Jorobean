// API Configuration
const SUPABASE_URL = 'https://vkdvweyatwcfqbocezjv.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZ3ZXlhdHdjZnFib2Nlemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjQ1MTgsImV4cCI6MjA3MTM0MDUxOH0.orSkIBG-3jVd1Trv9mKT6UD5JVNw7Opy4xLJa_A5E5I';

// Initialize Stripe
const stripeInstance = Stripe('pk_live_51RFSO1GHx57yahd0fA0HLVYo9OS4tLN7GYNPL09WiliQaTO2pDda4slh5Se6E4eAMjmHyMWoLH5F0UT5pmfD8qi300ZiV95GDz');

async function initializeOrderSuccess() {
    try {
        // Clear any pending session ID
        localStorage.removeItem('pending_session_id');
        
        // Clear the cart
        localStorage.removeItem('cart');
        
        // Get the session ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (!sessionId) {
            throw new Error('No session ID found in URL');
        }

        // Show loading state
        document.getElementById('order-details').innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading order details...</p>
            </div>
        `;

        // Fetch the order details from Stripe
        const response = await fetch(`${SUPABASE_URL}/get-order?session_id=${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }

        const orderData = await response.json();
        
        // Update the order details section
        const orderDetails = document.getElementById('order-details');
        orderDetails.innerHTML = `
            <div class="order-summary">
                <h3>Order Summary</h3>
                <p><strong>Order Number:</strong> ${orderData.order_id}</p>
                <p><strong>Order Status:</strong> Processing</p>
                <p><strong>Shipping Address:</strong><br>
                    ${orderData.shipping.name}<br>
                    ${orderData.shipping.address.line1}<br>
                    ${orderData.shipping.address.line2 ? orderData.shipping.address.line2 + '<br>' : ''}
                    ${orderData.shipping.address.city}, ${orderData.shipping.address.state} ${orderData.shipping.address.postal_code}<br>
                    ${orderData.shipping.address.country}
                </p>
                <div class="order-items">
                    <h4>Items</h4>
                    ${orderData.items.map(item => `
                        <div class="order-item">
                            <div class="item-details">
                                <p class="item-name">${item.description}</p>
                                <p class="item-quantity">Quantity: ${item.quantity}</p>
                            </div>
                            <p class="item-price">$${(item.amount_total / 100).toFixed(2)}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="order-totals">
                    <div class="total-line">
                        <span>Subtotal:</span>
                        <span>$${(orderData.amount_subtotal / 100).toFixed(2)}</span>
                    </div>
                    <div class="total-line">
                        <span>Shipping:</span>
                        <span>$${(orderData.shipping_cost / 100).toFixed(2)}</span>
                    </div>
                    ${orderData.tax_total ? `
                        <div class="total-line">
                            <span>Tax:</span>
                            <span>$${(orderData.tax_total / 100).toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="total-line total">
                        <span><strong>Total:</strong></span>
                        <span><strong>$${(orderData.amount_total / 100).toFixed(2)}</strong></span>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading order details:', error);
        document.getElementById('order-details').innerHTML = `
            <div class="error-message">
                <h3>Failed to load order details</h3>
                <p>${error.message}</p>
                <p>Please contact support for assistance.</p>
            </div>
        `;
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeOrderSuccess);
