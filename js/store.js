// Configuration
const config = {
    // Netlify Function endpoints - use absolute URL in production
    apiEndpoint: 'https://bean9.netlify.app/.netlify/functions/printful',
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
        console.log('Fetching products from:', config.apiEndpoint + '/products');
        const response = await fetch(config.apiEndpoint + '/products');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Products data:', data);
        
        state.products = data;
        renderProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
        elements.productsContainer.innerHTML = `
            <div class="error-message">
                Failed to load products. Please try again later.<br>
                Error: ${error.message}
            </div>
        `;
        throw error;
    }
}

// Render products in the grid
function renderProducts() {
    const filteredProducts = state.activeCategory === 'all'
        ? state.products
        : state.products.filter(product => {
            const category = product.sync_product.type || '';
            return config.categories[state.activeCategory].includes(category.toUpperCase());
        });

    const productsHTML = filteredProducts.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <img 
                src="${product.sync_product.thumbnail_url}" 
                alt="${product.sync_product.name}"
                class="product-image"
            >
            <div class="product-info">
                <h3 class="product-title">${product.sync_product.name}</h3>
                <div class="product-price">$${product.sync_product.retail_price}</div>
                <button class="add-to-cart" data-product-id="${product.id}">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');

    elements.productsContainer.innerHTML = productsHTML || '<div class="no-products">No products found in this category</div>';
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
