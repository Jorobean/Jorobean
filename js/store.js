// Store state
let state = {
    products: [],
    cart: [],
    selectedVariant: null
};

// Initialize store
async function initStore() {
    const productsContainer = document.getElementById('products-container');
    
    try {
        // Show loading state
        productsContainer.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading products...</p>
            </div>
        `;

        // Fetch products from Vercel API
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        state.products = data.result;
        renderProducts();

    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <h3>Failed to load products</h3>
                <p>Please try refreshing the page</p>
            </div>
        `;
    }
}

// Render products
function renderProducts() {
    const productsContainer = document.getElementById('products-container');
    
    if (!state.products.length) {
        productsContainer.innerHTML = `
            <div class="no-products">
                <h3>No Products Available</h3>
                <p>Check back soon for new products!</p>
            </div>
        `;
        return;
    }

    const productsHTML = state.products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image-container">
                <img 
                    src="${product.thumbnail_url}" 
                    alt="${product.name}"
                    class="product-image"
                    loading="lazy"
                >
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price}</p>
                <button 
                    class="view-variants-btn" 
                    onclick="showProductDetails('${product.id}')"
                >
                    Select Size
                </button>
            </div>
        </div>
    `).join('');

    productsContainer.innerHTML = productsHTML;
}

// Show product details
async function showProductDetails(productId) {
    try {
        const modalDialog = document.createElement('dialog');
        modalDialog.className = 'product-dialog';
        modalDialog.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading product details...</p>
            </div>
        `;
        document.body.appendChild(modalDialog);
        modalDialog.showModal();

        // Fetch detailed product info including variants
        const response = await fetch(`/api/variants?id=${productId}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        const product = data.result;
        if (!product) {
            throw new Error('Product not found');
        }

        const variantsHtml = product.variants
            .map(v => `
                <button 
                    class="size-button" 
                    data-variant-id="${v.id}"
                    ${v.status !== 'in_stock' ? 'disabled' : ''}
                >
                    ${v.size}
                </button>
            `)
            .join('');

        modalDialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h2>${product.name}</h2>
                    <button class="close-button" onclick="this.closest('dialog').close()">×</button>
                </div>
                <div class="dialog-body">
                    <img src="${product.thumbnail_url}" alt="${product.name}" class="dialog-image">
                    <div class="product-details">
                        <p class="price">$${product.price}</p>
                        <p class="description">${product.description}</p>
                        <div class="size-selector">
                            <h3>Select Size:</h3>
                            <div class="size-grid">
                                ${variantsHtml}
                            </div>
                        </div>
                        <button class="add-to-cart-btn" disabled>Add to Cart</button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for size buttons
        modalDialog.querySelectorAll('.size-button').forEach(button => {
            button.addEventListener('click', () => {
                modalDialog.querySelectorAll('.size-button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                modalDialog.querySelector('.add-to-cart-btn').disabled = false;
                state.selectedVariant = product.variants.find(v => v.id === button.dataset.variantId);
            });
        });

        // Add to cart functionality
        modalDialog.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            if (state.selectedVariant) {
                addToCart({
                    ...product,
                    selectedVariant: state.selectedVariant
                });
                modalDialog.close();
            }
        });

    } catch (error) {
        console.error('Error loading product details:', error);
        const modalDialog = document.querySelector('.product-dialog');
        if (modalDialog) {
            modalDialog.innerHTML = `
                <div class="error-message">
                    <h3>Failed to load product details</h3>
                    <p>${error.message}</p>
                    <button onclick="this.closest('dialog').close()">Close</button>
                </div>
            `;
        }
    }
}

// Cart functionality
function addToCart(product) {
    const cartItem = {
        id: product.selectedVariant.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        size: product.selectedVariant.size,
        color: product.selectedVariant.color,
        thumbnail: product.thumbnail_url,
        quantity: 1
    };

    const existingItem = state.cart.find(item => item.id === cartItem.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push(cartItem);
    }

    updateCartCount();
    updateCartSidebar();
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'block' : 'none';
}

function updateCartSidebar() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (state.cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = '$0.00';
        return;
    }

    cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <img src="${item.thumbnail}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>Size: ${item.size}</p>
                <p>Color: ${item.color}</p>
                <div class="quantity-controls">
                    <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
            </div>
            <div class="cart-item-price">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
        </div>
    `).join('');

    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        state.cart = state.cart.filter(item => item.id !== itemId);
    } else {
        const item = state.cart.find(item => item.id === itemId);
        if (item) {
            item.quantity = newQuantity;
        }
    }
    updateCartCount();
    updateCartSidebar();
}

// Cart sidebar toggle
document.getElementById('cart-button').addEventListener('click', () => {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').style.display = 'block';
});

document.querySelector('.close-cart').addEventListener('click', () => {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').style.display = 'none';
});

document.getElementById('cart-overlay').addEventListener('click', () => {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').style.display = 'none';
});

// Initialize the store
document.addEventListener('DOMContentLoaded', initStore);
