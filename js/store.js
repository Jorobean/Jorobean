// Configuration
const config = {
    // Netlify Function endpoints - use absolute URL in production
    apiEndpoint: 'https://bean9.netlify.app/.netlify/functions/printful',
    debug: true, // Enable debug logging
    // Categories mapping for Printful products
    categories: {
        footwear: ['SHOES'],
        accessories: ['ACCESSORIES']
    }
};

// State management
let state = {
    products: [],
    cart: [],
    activeCategory: 'all'
};

// DOM Elements
const elements = {
    productsContainer: document.getElementById('products-container'),
    cartButton: document.getElementById('cart-button'),
    cartSidebar: document.getElementById('cart-sidebar'),
    cartOverlay: document.getElementById('cart-overlay'),
    closeCart: document.querySelector('.close-cart'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    checkoutButton: document.getElementById('checkout-button'),
    categoryButtons: document.querySelectorAll('.category-btn')
};

// Initialize the store
async function initStore() {
    try {
        await fetchProducts();
        setupEventListeners();
        updateCartCount();
    } catch (error) {
        console.error('Failed to initialize store:', error);
        elements.productsContainer.innerHTML = 'Failed to load products. Please try again later.';
    }
}

// Fetch products from backend API
async function fetchProducts() {
    try {
        if (config.debug) {
            console.log('Starting product fetch...');
            console.log('API Endpoint:', config.apiEndpoint + '/products');
        }

        const response = await fetch(config.apiEndpoint + '/products', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (config.debug) {
            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
        }

        // Try to get the response text first
        const responseText = await response.text();

        if (config.debug) {
            console.log('Raw response:', responseText);
        }

        // Parse the text as JSON if possible
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            throw new Error('Invalid JSON response from server');
        }

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        if (config.debug) {
            console.log('Parsed data:', data);
        }

        // Check if data is in the expected format
        if (!Array.isArray(data)) {
            console.warn('Data is not an array:', data);
            // If data is wrapped in a result property, extract it
            if (data.result && Array.isArray(data.result)) {
                data = data.result;
            } else {
                throw new Error('Invalid data format received from server');
            }
        }

        state.products = data;
        
        if (config.debug) {
            console.log('Products loaded:', state.products.length);
        }

        renderProducts();
    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        });

        elements.productsContainer.innerHTML = `
            <div class="error-message">
                <h3>Failed to load products</h3>
                <p>Error: ${error.message}</p>
                <p>Please try refreshing the page. If the problem persists, contact support.</p>
                <pre style="text-align: left; margin-top: 1rem; font-size: 0.8em;">${error.stack}</pre>
            </div>
        `;
    }
}

// Render products in the grid
function renderProducts() {
    if (config.debug) {
        console.log('Rendering products. Current state:', {
            productsCount: state.products.length,
            activeCategory: state.activeCategory
        });
    }

    if (!state.products || state.products.length === 0) {
        elements.productsContainer.innerHTML = `
            <div class="no-products">
                <h3>No Products Available</h3>
                <p>Either the store is empty or there was an error loading products.</p>
            </div>`;
        return;
    }

    const filteredProducts = state.activeCategory === 'all'
        ? state.products
        : state.products.filter(product => {
            if (!product.sync_product) {
                console.warn('Product missing sync_product:', product);
                return false;
            }
            const category = product.sync_product.type || '';
            return config.categories[state.activeCategory].includes(category.toUpperCase());
        });

    if (config.debug) {
        console.log('Filtered products:', filteredProducts.length);
    }

    const productsHTML = filteredProducts.map(product => {
        try {
            if (!product.sync_product) {
                console.warn('Invalid product data:', product);
                return '';
            }

            return `
                <div class="product-card" data-product-id="${product.id}">
                    <img 
                        src="${product.sync_product.thumbnail_url || '/placeholder-image.png'}" 
                        alt="${product.sync_product.name}"
                        class="product-image"
                        onerror="this.src='/placeholder-image.png'"
                    >
                    <div class="product-info">
                        <h3 class="product-title">${product.sync_product.name}</h3>
                        <div class="product-price">$${product.sync_product.retail_price}</div>
                        <button class="add-to-cart" data-product-id="${product.id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering product:', error, product);
            return '';
        }
    }).join('');

    elements.productsContainer.innerHTML = productsHTML || `
        <div class="no-products">
            <h3>No Products Found</h3>
            <p>No products found in the ${state.activeCategory} category.</p>
        </div>`;
}
}

// Setup event listeners
function setupEventListeners() {
    // Category filters
    elements.categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            state.activeCategory = category;
            
            // Update active button state
            elements.categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            renderProducts();
        });
    });

    // Cart toggle
    elements.cartButton.addEventListener('click', toggleCart);
    elements.closeCart.addEventListener('click', toggleCart);
    elements.cartOverlay.addEventListener('click', toggleCart);

    // Add to cart buttons
    elements.productsContainer.addEventListener('click', e => {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = e.target.dataset.productId;
            addToCart(productId);
        }
    });

    // Checkout button
    elements.checkoutButton.addEventListener('click', initiateCheckout);
}

// Toggle cart sidebar
function toggleCart() {
    elements.cartSidebar.classList.toggle('open');
    elements.cartOverlay.style.display = 
        elements.cartOverlay.style.display === 'block' ? 'none' : 'block';
}

// Add product to cart
function addToCart(productId) {
    const product = state.products.find(p => p.id === parseInt(productId));
    if (!product) return;

    const cartItem = state.cart.find(item => item.id === parseInt(productId));
    
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        state.cart.push({
            id: product.id,
            name: product.sync_product.name,
            price: product.sync_product.retail_price,
            image: product.sync_product.thumbnail_url,
            quantity: 1
        });
    }

    updateCart();
}

// Update cart display
function updateCart() {
    // Update cart items
    const cartHTML = state.cart.map(item => `
        <div class="cart-item">
            <img 
                src="${item.image}" 
                alt="${item.name}"
                class="cart-item-image"
            >
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price}</div>
                <div class="cart-item-quantity">
                    Quantity: ${item.quantity}
                </div>
            </div>
        </div>
    `).join('');

    elements.cartItems.innerHTML = cartHTML || '<div class="empty-cart">Your cart is empty</div>';

    // Update total
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    elements.cartTotal.textContent = `$${total.toFixed(2)}`;

    // Update cart count
    updateCartCount();
}

// Update cart count badge
function updateCartCount() {
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartButton.querySelector('.cart-count').textContent = count;
}

// Initiate checkout process
async function initiateCheckout() {
    if (state.cart.length === 0) {
        alert('Your cart is empty');
        return;
    }

    try {
        const response = await fetch(config.apiEndpoint + '/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: state.cart
            })
        });

        const data = await response.json();

        if (data.success && data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
        } else {
            throw new Error(data.message || 'Checkout failed');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Failed to initiate checkout. Please try again.');
    }
}

// Initialize the store when the page loads
document.addEventListener('DOMContentLoaded', initStore);
