// API Configuration
const SUPABASE_URL = 'https://vkdvweyatwcfqbocezjv.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZ3ZXlhdHdjZnFib2Nlemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjQ1MTgsImV4cCI6MjA3MTM0MDUxOH0.orSkIBG-3jVd1Trv9mKT6UD5JVNw7Opy4xLJa_A5E5I';

// Store state
let state = {
    products: [],
    cart: [],
    selectedVariant: null,
    currentCategory: 'all',
    currentSort: 'featured' // Options: featured, price-low-high, price-high-low, name-a-z
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

        console.log('Fetching from:', `${SUPABASE_URL}/products`);
        console.log('With auth:', SUPABASE_ANON_KEY);

        // Fetch products from Supabase Edge Function
        const response = await fetch(`${SUPABASE_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        const data = JSON.parse(responseText);
        console.log('Raw API Response:', responseText);
        console.log('Parsed data:', data);

        if (data.error) {
            throw new Error(data.error);
        }

        // Log detailed structure of the first product
        if (data.length > 0) {
            const sampleProduct = data[0];
            console.log('Sample product structure:', {
                id: sampleProduct.id,
                idType: typeof sampleProduct.id,
                hasSync: !!sampleProduct.sync_product,
                syncName: sampleProduct.sync_product?.name,
                fullProduct: sampleProduct
            });
        }

        console.log('Total products received:', data.length);
        state.products = data;
        renderProducts();

    } catch (error) {
        console.error('Detailed error:', error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <h3>Failed to load products</h3>
                <p>${error.message}</p>
                <button onclick="initStore()">Try Again</button>
            </div>
        `;
    }
}

// Filter products by category
function filterProducts(products, category) {
    if (category === 'all') return products;
    return products.filter(product => {
        const tags = product.sync_product.name.toLowerCase();
        switch(category) {
            case 'hats':
                return tags.includes("hat") || tags.includes("cap") || tags.includes("beanie");
            default:
                return true;
        }
    });
}

// Sort products
function sortProducts(products, sortType) {
    const productsArray = [...products];
    switch(sortType) {
        case 'price-low-high':
            return productsArray.sort((a, b) => 
                (a.retail_price || 0) - (b.retail_price || 0));
        case 'price-high-low':
            return productsArray.sort((a, b) => 
                (b.retail_price || 0) - (a.retail_price || 0));
        case 'name-a-z':
            return productsArray.sort((a, b) => 
                a.name.localeCompare(b.name));
        default: // 'featured'
            return productsArray;
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

    const filteredProducts = filterProducts(state.products, state.currentCategory);
    const sortedProducts = sortProducts(filteredProducts, state.currentSort);

    if (sortedProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-products">
                <h3>No Products in This Category</h3>
                <p>Check out our other categories!</p>
            </div>
        `;
        return;
    }

    console.log('Products data:', sortedProducts); // Add this to debug the data structure

    console.log('Rendering products:', sortedProducts);
    
    const productsHTML = sortedProducts.map(product => {
        // Debug logging for each product being rendered
        console.log('Rendering product:', {
            id: product.id,
            idType: typeof product.id,
            name: product.sync_product?.name
        });

        // Get the lowest price from all variants
        const variants = product.sync_variants || [];
        const prices = variants.map(v => parseFloat(v.retail_price)).filter(p => !isNaN(p));
        const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
        const priceDisplay = lowestPrice ? `$${lowestPrice.toFixed(2)}` : 'Price varies by size';
        
        // Store the product ID both as a number and string to handle both cases
        const productId = product.id;
        
        return `
            <div class="product-card" data-product-id="${productId}">
                <div class="product-image-container">
                    <img 
                        src="${product.sync_product.thumbnail_url}" 
                        alt="${product.sync_product.name}"
                        class="product-image"
                        loading="lazy"
                    >
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.sync_product.name}</h3>
                    <button class="view-variants-btn" onclick="handleProductClick(${productId})">${priceDisplay}</button>
                </div>
            </div>
        `;
    }).join('');

    productsContainer.innerHTML = productsHTML;
}

// Show product details
// Global handler for product clicks
function handleProductClick(productId) {
    console.log('handleProductClick called with:', productId, typeof productId);
    showProductDetails(productId);
    return false; // Prevent default and stop propagation
}

async function showProductDetails(productId, event) {
    try {
        // Prevent any event bubbling if event is provided
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        console.log('showProductDetails called with:', {
            productId: productId,
            idType: typeof productId,
            availableProducts: state.products.length
        });
        
        // Find the product by ID
        const foundProduct = state.products.find(p => String(p.id) === String(productId));
        
        if (!foundProduct) {
            console.error('Product lookup failed:', {
                searchId: productId,
                searchIdType: typeof productId,
                availableIds: state.products.map(p => ({
                    id: p.id,
                    idType: typeof p.id
                }))
            });
            throw new Error(`Product not found: ${productId}`);
        }
        
        console.log('Found product:', foundProduct);
        
        // Find the product in the existing state first
        const product = state.products.find(p => p.id === numericId);
        if (!product) {
            console.error('Product not found:', numericId);
            throw new Error(`Product not found: ${numericId}`);
        }
        
        console.log('Found product:', product);

        // Remove any existing dialog
        const existingDialog = document.querySelector('.product-dialog');
        if (existingDialog) {
            existingDialog.close();
            existingDialog.remove();
        }

        // Create and show the modal dialog
        const modalDialog = document.createElement('dialog');
        modalDialog.className = 'product-dialog';
        
        // Ensure dialog is properly removed when closed
        modalDialog.addEventListener('close', () => {
            modalDialog.remove();
        });
        
        // Create the modal content with variants
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
        const variants = (product.sync_variants || []).sort((a, b) => {
            return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
        });
        
        const variantsHtml = variants
            .map(v => `
                <button 
                    class="size-button" 
                    data-variant-id="${v.id}"
                    data-price="${v.retail_price}"
                    ${v.availability_status !== 'active' ? 'disabled' : ''}
                >
                    ${v.size}
                </button>
            `)
            .join('');

        console.log('Product details:', product);
        const description = product.sync_product?.description || product.description || 'No description available';
        modalDialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h2>${product.sync_product?.name || 'Product Details'}</h2>
                    <button class="close-button" onclick="this.closest('dialog').close()">×</button>
                </div>
                <div class="dialog-body">
                    <div class="product-image-section">
                        <img src="${product.sync_product?.thumbnail_url}" 
                             alt="${product.sync_product?.name || 'Product'}" 
                             class="dialog-image">
                    </div>
                    <div class="product-details">
                        <p class="price">$${product.sync_variants?.[0]?.retail_price || '0.00'}</p>
                        <div class="product-description" style="white-space: pre-line">
                            ${description}
                        </div>
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
        
        document.body.appendChild(modalDialog);
        modalDialog.showModal();

        // Add event listeners for size buttons
        modalDialog.querySelectorAll('.size-button').forEach(button => {
            button.addEventListener('click', () => {
                modalDialog.querySelectorAll('.size-button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                modalDialog.querySelector('.add-to-cart-btn').disabled = false;
                const variantId = button.dataset.variantId;
                state.selectedVariant = product.sync_variants.find(v => v.id === parseInt(variantId));
            });
        });

        // Add to cart functionality
        modalDialog.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            if (state.selectedVariant) {
                const productData = {
                    id: product.id,
                    name: product.sync_product.name,
                    thumbnail_url: product.sync_product.thumbnail_url,
                    selectedVariant: state.selectedVariant
                };
                addToCart(productData);
                modalDialog.close();
                
                // Show confirmation toast
                const toast = document.createElement('div');
                toast.className = 'toast';
                toast.textContent = 'Added to cart';
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.classList.add('show');
                    setTimeout(() => {
                        toast.classList.remove('show');
                        setTimeout(() => toast.remove(), 300);
                    }, 2000);
                }, 100);
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
    if (!product.selectedVariant) {
        console.error('No variant selected');
        return;
    }

    const cartItem = {
        id: product.selectedVariant.id,
        productId: product.id,
        name: product.name,
        price: parseFloat(product.selectedVariant.retail_price),
        size: product.selectedVariant.size,
        color: product.selectedVariant.color || '',
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
    const cartButton = document.querySelector('.cart-button');
    const cartCount = document.querySelector('.cart-count');
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    
    // Add or remove has-items class based on cart state
    if (totalItems > 0) {
        cartButton.classList.add('has-items');
    } else {
        cartButton.classList.remove('has-items');
    }
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

    // Add checkout button if there are items in cart
    const checkoutBtn = document.createElement('button');
    checkoutBtn.className = 'checkout-btn';
    checkoutBtn.textContent = 'Proceed to Checkout';
    checkoutBtn.onclick = showCheckoutForm;
    cartItems.appendChild(checkoutBtn);
}

function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        state.cart = state.cart.filter(item => item.id !== parseInt(itemId));
    } else {
        const item = state.cart.find(item => item.id === parseInt(itemId));
        if (item) {
            item.quantity = newQuantity;
        }
    }
    updateCartCount();
    updateCartSidebar();
}

// Checkout functionality
async function showCheckoutForm() {
    const modalDialog = document.createElement('dialog');
    modalDialog.className = 'checkout-dialog';
    modalDialog.innerHTML = `
        <div class="dialog-content">
            <div class="dialog-header">
                <h2>Checkout</h2>
                <button class="close-button" onclick="this.closest('dialog').close()">×</button>
            </div>
            <div class="dialog-body">
                <form id="checkout-form">
                    <div class="form-group">
                        <label for="name">Full Name</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="address1">Address</label>
                        <input type="text" id="address1" name="address1" required>
                    </div>
                    <div class="form-group">
                        <label for="city">City</label>
                        <input type="text" id="city" name="city" required>
                    </div>
                    <div class="form-group">
                        <label for="state">State</label>
                        <input type="text" id="state" name="state" required>
                    </div>
                    <div class="form-group">
                        <label for="zip">ZIP Code</label>
                        <input type="text" id="zip" name="zip" required>
                    </div>
                    <button type="submit" class="submit-btn">Place Order</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modalDialog);
    modalDialog.showModal();

    // Handle form submission
    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const orderData = {
            recipient: {
                name: formData.get('name'),
                address1: formData.get('address1'),
                city: formData.get('city'),
                state_code: formData.get('state'),
                country_code: 'US',
                zip: formData.get('zip')
            },
            items: state.cart.map(item => ({
                sync_variant_id: item.id,
                quantity: item.quantity
            }))
        };

        try {
            const response = await fetch(`${SUPABASE_URL}/order`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();
            if (response.ok) {
                alert('Order placed successfully!');
                state.cart = []; // Clear cart
                updateCartCount();
                updateCartSidebar();
                modalDialog.close();
            } else {
                throw new Error(data.error || 'Failed to place order');
            }
        } catch (error) {
            alert(error.message);
        }
    });
}

// Cart sidebar toggle
document.getElementById('cart-button')?.addEventListener('click', () => {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').style.display = 'block';
});

document.querySelector('.close-cart')?.addEventListener('click', () => {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').style.display = 'none';
});

document.getElementById('cart-overlay')?.addEventListener('click', () => {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').style.display = 'none';
});

// Handle category selection
function initCategoryButtons() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update state and re-render
            state.currentCategory = button.dataset.category;
            renderProducts();
        });
    });
}

// Initialize sort select
function initSortSelect() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            state.currentSort = e.target.value;
            renderProducts();
        });
    }
}

// Initialize the store
document.addEventListener('DOMContentLoaded', () => {
    initStore();
    initCategoryButtons();
    initSortSelect();
});
