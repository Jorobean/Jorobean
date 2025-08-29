// API Configuration
const SUPABASE_URL = 'https://vkdvweyatwcfqbocezjv.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZ3ZXlhdHdjZnFib2Nlemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjQ1MTgsImV4cCI6MjA3MTM0MDUxOH0.orSkIBG-3jVd1Trv9mKT6UD5JVNw7Opy4xLJa_A5E5I';

// Store state
const state = {
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

        // Fetch products from Supabase Edge Function
        const response = await fetch(`${SUPABASE_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        const data = JSON.parse(responseText);

        if (data.error) {
            throw new Error(data.error);
        }

        // Reorder products - swap Keep Loading tee with Red Boot tee
        const keepLoadingTee = data.find(p => p.sync_product.name.includes('Keep Loading'));
        const redBootTee = data.find(p => p.sync_product.name.includes('Red Boot'));
        if (keepLoadingTee && redBootTee) {
            const keepLoadingIndex = data.indexOf(keepLoadingTee);
            const redBootIndex = data.indexOf(redBootTee);
            [data[keepLoadingIndex], data[redBootIndex]] = [data[redBootIndex], data[keepLoadingIndex]];
        }
        
        state.products = data;
        console.log(`Loaded ${data.length} products successfully`);
        renderProducts();

    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <h3>Failed to load products</h3>
                <p>${error.message}</p>
                <button onclick="initStore()">Try Again</button>
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

    const productsHTML = state.products.map(product => {
        if (!product.sync_product) {
            console.error('Product missing sync_product data');
            return '';
        }

        const imageUrl = product.sync_product.thumbnail_url;
        const productName = product.sync_product.name;
        const productId = product.sync_product.id;
        const price = product.sync_variants && product.sync_variants[0] ? 
            parseFloat(product.sync_variants[0].retail_price).toFixed(2) : '0.00';

        return `
            <div class="product-card" data-product-id="${productId}" role="button" tabindex="0" onclick="showProductDetails('${productId}')">
                <div class="product-image-container">
                    <img 
                        src="${imageUrl}" 
                        alt="${productName}"
                        class="product-image"
                        loading="lazy"
                        onerror="this.src='broken-heart.png'"
                    >
                </div>
                <div class="product-info">
                    <h3 class="product-title">${productName}</h3>
                    <p class="product-price">$${price}</p>
                    <button 
                        class="view-variants-btn" 
                        onclick="event.stopPropagation(); showProductDetails('${productId}')"
                    >
                        Select Size
                    </button>
                </div>
            </div>
        `;
    }).join('');

    productsContainer.innerHTML = productsHTML;
}

// Show product details
function showProductDetails(productId) {
    try {
        console.log('Opening details for product ID:', productId);
        
        const product = state.products.find(p => String(p.sync_product.id) === String(productId));
        if (!product) {
            throw new Error('Product not found');
        }

        if (!product.sync_variants || !product.sync_variants.length) {
            throw new Error('No variants available for this product');
        }

        // Function to handle image zoom
        function handleImageZoom(imageContainer, image) {
            const ZOOM_LEVEL = 2.5;
            
            function onMouseMove(e) {
                const rect = imageContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const xPercent = x / rect.width * 100;
                const yPercent = y / rect.height * 100;
                
                image.style.transformOrigin = `${xPercent}% ${yPercent}%`;
                image.style.transform = `scale(${ZOOM_LEVEL})`;
            }
            
            function onMouseLeave() {
                image.style.transformOrigin = 'center';
                image.style.transform = 'scale(1)';
            }
            
            imageContainer.addEventListener('mousemove', onMouseMove);
            imageContainer.addEventListener('mouseleave', onMouseLeave);
            
            // Cleanup function
            return () => {
                imageContainer.removeEventListener('mousemove', onMouseMove);
                imageContainer.removeEventListener('mouseleave', onMouseLeave);
            };
        }

        // Get unique colors and sizes from variants
        const colors = [...new Set(product.sync_variants.map(v => v.color))];
        const sizes = [...new Set(product.sync_variants.map(v => v.size))];
        
        // Sort sizes in standard order
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
        const sortedSizes = sizes.sort((a, b) => {
            const indexA = sizeOrder.indexOf(a);
            const indexB = sizeOrder.indexOf(b);
            
            // If both sizes are in our order array, sort by their index
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            
            // If only one size is in our order array, put it first
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            
            // If neither size is in our order array, maintain their original order
            return 0;
        });
        
        // Group variants by color
        const variantsByColor = {};
        colors.forEach(color => {
            variantsByColor[color] = product.sync_variants.filter(v => v.color === color);
        });

        const modal = document.createElement('div');
        modal.className = 'product-dialog';
        modal.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <button class="close-button-top-right" id="closeProductDialog">×</button>
                <div class="dialog-body">
                    <div class="product-main-content">
                        <div class="product-image-section">
                            <img src="${product.sync_product.thumbnail_url}" 
                                 alt="${product.sync_product.name}" 
                                 class="dialog-image">
                        </div>
                        <div class="product-details">
                            <h2>${product.sync_product.name}</h2>
                            
                            ${colors.length > 1 ? `
                            <div class="color-selector">
                                <h3>Color</h3>
                                <div class="color-grid">
                                    ${colors.map(color => `
                                        <button 
                                            class="color-button ${color.toLowerCase()}"
                                            data-color="${color}"
                                            title="${color}"
                                        >
                                            <span class="color-swatch" style="background-color: ${color.toLowerCase()}"></span>
                                            <span class="color-name">${color}</span>
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        
                        <div class="size-selector">
                            <h3>Size</h3>
                            <div class="size-grid">
                                ${sortedSizes.map(size => `
                                    <button 
                                        class="size-button" 
                                        data-size="${size}"
                                        disabled
                                    >
                                        ${size}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="quantity-selector">
                            <h3>Quantity</h3>
                            <div class="quantity-controls">
                                <button class="quantity-decrease">−</button>
                                <span>1</span>
                                <button class="quantity-increase">+</button>
                            </div>
                        </div>

                        <p class="price">$${parseFloat(product.sync_variants[0].retail_price).toFixed(2)}</p>
                        <button class="add-to-cart-btn" disabled>Add to cart</button>
                        </div>
                    </div>

                    <div class="product-description">
                        <h3>About product</h3>
                        <div class="product-description-content">
                            <div class="product-description-main">
                                ${product.sync_product.name.toLowerCase().includes('trucker') ? `
                                    <p>This six-panel trucker cap with a mesh back will be a comfy and classic choice for a perfect day in the sun.</p>
                                ` : product.sync_product.name.toLowerCase().includes('bucket') ? `
                                    <p>Combine practicality, comfort, and fashion in one. Keep the sun out of your eyes with this 100% cotton twill bucket hat. Cotton fabric and sewn eyelets are sure to help you stay cool during any activity, be it a stroll in the park or an intense game of sports.</p>
                                ` : `
                                    <p>This t-shirt is everything you've dreamed of and more. It feels soft and lightweight, with the right amount of stretch. It's comfortable and flattering for all.</p>
                                `}
                            </div>
                            <div class="product-description-details">
                                <div class="product-features">
                                    <h4>Features</h4>
                                    ${product.sync_product.name.toLowerCase().includes('trucker') ? `
                                        <p>• 26% cotton, 74% polyester</p>
                                        <p>• Mid-profile cap with a low-profile embroidery area</p>
                                        <p>• Structured, six-panel cap</p>
                                        <p>• 3.5″ crown (8.9 cm)</p>
                                        <p>• Hard buckram front panels</p>
                                        <p>• Mesh back</p>
                                        <p>• Permacurv® visor, matching undervisor</p>
                                        <p>• Plastic adjustable closure</p>
                                        <p>• Head circumference: 21⅝″–23⅝″ (54.9 cm–60 cm)</p>
                                        <p>• Blank product sourced from Vietnam or Bangladesh</p>
                                    ` : product.sync_product.name.toLowerCase().includes('bucket') ? `
                                        <p>• 100% cotton twill</p>
                                        <p>• 3 ¾″ (7.6 cm) crown</p>
                                        <p>• 2 ¼″ (5.1 cm) brim</p>
                                        <p>• One size fits most</p>
                                        <p>• Sewn eyelets for breathability</p>
                                    ` : `
                                        <p>• 100% combed and ring-spun cotton (Heather colors contain polyester)</p>
                                        <p>• Fabric weight: 4.2 oz./yd.² (142 g/m²)</p>
                                        <p>• Pre-shrunk fabric</p>
                                        <p>• Side-seamed construction</p>
                                        <p>• Shoulder-to-shoulder taping</p>
                                        <p>• Blank product sourced from Nicaragua, Mexico, Honduras, or the US</p>
                                    `}
                                </div>
                                <div class="product-note">
                                    <h4>Sustainability</h4>
                                    <p>This product is made especially for you as soon as you place an order, which is why it takes us a bit longer to deliver it to you. Making products on demand instead of in bulk helps reduce overproduction, so thank you for making thoughtful purchasing decisions!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize image zoom
        const imageContainer = modal.querySelector('.product-image-section');
        const image = modal.querySelector('.dialog-image');
        const cleanup = handleImageZoom(imageContainer, image);

        const closeBtn = modal.querySelector('#closeProductDialog');
        const overlay = modal.querySelector('.dialog-overlay');
        
        function handleClose(e) {
            e.preventDefault();
            e.stopPropagation();
            cleanup(); // Remove event listeners
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }
        
        closeBtn.onclick = handleClose;
        overlay.onclick = handleClose;

        // Add event listeners for color buttons
        let selectedColor = colors[0];
        let selectedSize = null;

        function updateAvailableSizes(color) {
            const availableSizes = variantsByColor[color].map(v => v.size);
            modal.querySelectorAll('.size-button').forEach(button => {
                const size = button.dataset.size;
                const variant = variantsByColor[color].find(v => v.size === size);
                button.disabled = !variant || variant.availability_status !== 'active';
                button.classList.remove('active');
            });
            selectedSize = null;
            
            // Reset add to cart button
            const addToCartBtn = modal.querySelector('.add-to-cart-btn');
            addToCartBtn.disabled = true;
            addToCartBtn.classList.remove('added');
            addToCartBtn.innerHTML = 'Add to cart';
        }

        function updateSelectedVariant() {
            const addToCartBtn = modal.querySelector('.add-to-cart-btn');
            
            // Reset the button state
            addToCartBtn.classList.remove('added');
            addToCartBtn.innerHTML = 'Add to cart';
            
            if (selectedColor && selectedSize) {
                state.selectedVariant = product.sync_variants.find(v => 
                    v.color === selectedColor && v.size === selectedSize
                );
                
                if (state.selectedVariant) {
                    modal.querySelector('.price').textContent = 
                        `$${parseFloat(state.selectedVariant.retail_price).toFixed(2)}`;
                    addToCartBtn.disabled = false;
                }
            }
        }

        if (colors.length > 1) {
            modal.querySelectorAll('.color-button').forEach(button => {
                button.addEventListener('click', () => {
                    const color = button.dataset.color;
                    modal.querySelectorAll('.color-button').forEach(b => 
                        b.classList.remove('active'));
                    button.classList.add('active');
                    selectedColor = color;
                    updateAvailableSizes(color);
                });
            });
            
            // Initialize with first color
            modal.querySelector('.color-button').classList.add('active');
            updateAvailableSizes(selectedColor);
        } else {
            updateAvailableSizes(selectedColor);
        }

        // Add event listeners for size buttons
        modal.querySelectorAll('.size-button').forEach(button => {
            button.addEventListener('click', () => {
                if (!button.disabled) {
                    modal.querySelectorAll('.size-button').forEach(b => 
                        b.classList.remove('active'));
                    button.classList.add('active');
                    selectedSize = button.dataset.size;
                    updateSelectedVariant();
                }
            });
        });

        // Add quantity control functionality
        let quantity = 1;
        const quantitySpan = modal.querySelector('.quantity-controls span');
        const decreaseBtn = modal.querySelector('.quantity-decrease');
        const increaseBtn = modal.querySelector('.quantity-increase');

        decreaseBtn.addEventListener('click', () => {
            if (quantity > 1) {
                quantity--;
                quantitySpan.textContent = quantity;
            }
        });

        increaseBtn.addEventListener('click', () => {
            if (quantity < 10) {  // Set a reasonable maximum
                quantity++;
                quantitySpan.textContent = quantity;
            }
        });

        // Add to cart functionality
        const addToCartBtn = modal.querySelector('.add-to-cart-btn');
        addToCartBtn.addEventListener('click', () => {
            if (state.selectedVariant) {
                // Save original button text
                const originalText = addToCartBtn.innerHTML;
                
                // Change button to show checkmark
                addToCartBtn.innerHTML = '✓';
                addToCartBtn.classList.add('added');
                addToCartBtn.disabled = true;
                
                addToCart({
                    id: product.id,
                    name: product.sync_product.name,
                    thumbnail_url: product.sync_product.thumbnail_url,
                    selectedVariant: state.selectedVariant,
                    quantity: quantity
                });
                
                // After a short delay, close the modal
                setTimeout(() => {
                    closeModal();
                }, 1000);
            }
        });

    } catch (error) {
        console.error('Error showing product details:', error);
    }
}

// Cart functionality
function addToCart(product) {
    const cartItem = {
        id: product.selectedVariant.id,
        productId: product.id,
        name: product.name,
        price: parseFloat(product.selectedVariant.retail_price),
        size: product.selectedVariant.size,
        color: product.selectedVariant.color,
        thumbnail: product.thumbnail_url,
        quantity: product.quantity || 1
    };

    const existingItem = state.cart.find(item => String(item.id) === String(cartItem.id));
    if (existingItem) {
        existingItem.quantity += product.quantity || 1;
    } else {
        state.cart.push(cartItem);
    }

    updateCartCount();
    updateCartSidebar();
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    console.log('Cart total items:', totalItems);
    console.log('Current cart state:', state.cart);
    
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    } else {
        console.error('Cart count element not found');
    }
}

function updateCartSidebar() {
    // Ensure cart structure exists
    initCartStructure();

    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartSidebar = document.getElementById('cart-sidebar');
    
    console.log('Updating cart sidebar');
    console.log('Cart items element exists:', !!cartItems);
    console.log('Cart total element exists:', !!cartTotal);
    console.log('Cart sidebar element exists:', !!cartSidebar);

    // Try to initialize again if elements are missing
    if (!cartItems || !cartTotal || !cartSidebar) {
        console.warn('Cart elements not found, reinitializing...');
        initCartStructure();
        // Get references again without redeclaring
        cartItems = document.getElementById('cart-items');
        cartTotal = document.getElementById('cart-total');
        cartSidebar = document.getElementById('cart-sidebar');
        
        if (!cartItems || !cartTotal || !cartSidebar) {
            console.error('Cart elements still not found after reinitialization');
            return;
        }
    }

    if (state.cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = '$0.00';
        return;
    }

    cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item" data-item-id="${item.id}">
            <img src="${item.thumbnail}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>Size: ${item.size}</p>
                <p>Color: ${item.color}</p>
                <div class="quantity-controls">
                    <button class="quantity-decrease" data-item-id="${item.id}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-increase" data-item-id="${item.id}">+</button>
                </div>
            </div>
            <div class="cart-item-price">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
        </div>
    `).join('');

    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;

    // Add checkout button to cart footer
    const cartFooter = document.createElement('div');
    cartFooter.className = 'cart-footer';
    cartFooter.innerHTML = `
        <div class="cart-total-section">
            <strong>Total:</strong>
            <span class="cart-total">$${total.toFixed(2)}</span>
        </div>
        <button class="checkout-btn">Proceed to Checkout</button>
    `;
    
    // Remove any existing footer
    const existingFooter = cartSidebar.querySelector('.cart-footer');
    if (existingFooter) {
        existingFooter.remove();
    }
    
    cartSidebar.appendChild(cartFooter);

    // Add event listener to checkout button
    cartFooter.querySelector('.checkout-btn').addEventListener('click', showCheckoutForm);

    // Add event listeners for quantity controls
    cartItems.querySelectorAll('.quantity-decrease').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.itemId;
            const item = state.cart.find(item => String(item.id) === String(itemId));
            if (item) {
                updateQuantity(itemId, item.quantity - 1);
            }
        });
    });

    cartItems.querySelectorAll('.quantity-increase').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.itemId;
            const item = state.cart.find(item => String(item.id) === String(itemId));
            if (item) {
                updateQuantity(itemId, item.quantity + 1);
            }
        });
    });
}

function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        state.cart = state.cart.filter(item => String(item.id) !== String(itemId));
    } else {
        const item = state.cart.find(item => String(item.id) === String(itemId));
        if (item) {
            item.quantity = newQuantity;
        }
    }
    updateCartCount();
    updateCartSidebar();
}

// Checkout functionality
async function showCheckoutForm() {
    // First, close the cart sidebar
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.remove('open');
        cartOverlay.style.display = 'none';
    }

    // Prepare cart data for Stripe
    const cartData = state.cart.map(item => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: item.name,
                description: `Size: ${item.size}${item.color ? `, Color: ${item.color}` : ''}`,
                images: [item.thumbnail]
            },
            unit_amount: Math.round(item.price * 100) // Stripe expects amounts in cents
        },
        quantity: item.quantity
    }));

    // Show loading state
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-message';
    loadingMessage.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Preparing checkout...</p>
        </div>
    `;
    document.body.appendChild(loadingMessage);

    try {
        await createCheckoutSession(cartData);
    } catch (error) {
        console.error('Checkout error:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = error.message;
        document.body.appendChild(errorMessage);
        setTimeout(() => errorMessage.remove(), 3000);
    } finally {
        loadingMessage.remove();
    }
    const modal = document.createElement('div');
    modal.className = 'checkout-modal';
    modal.innerHTML = `
        <div class="checkout-overlay"></div>
        <div class="checkout-content">
            <div class="dialog-header">
                <h2>Checkout</h2>
                <button class="close-button" id="closeCheckout">×</button>
            </div>
            <div class="dialog-body">
                <form id="checkout-form" class="checkout-form">
                    <div class="form-section">
                        <h3>Contact Information</h3>
                        <div class="form-group">
                            <label for="name">Full Name</label>
                            <input type="text" id="name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h3>Shipping Address</h3>
                        <div class="form-group">
                            <label for="address1">Street Address</label>
                            <input type="text" id="address1" name="address1" required>
                        </div>
                        <div class="form-group">
                            <label for="address2">Apartment, suite, etc. (optional)</label>
                            <input type="text" id="address2" name="address2">
                        </div>
                        <div class="form-row">
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
                                <input type="text" id="zip" name="zip" required pattern="[0-9]{5}">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>Payment Information</h3>
                        <div class="form-group">
                            <div id="card-element"></div>
                            <div id="card-errors" class="error-text"></div>
                        </div>
                    </div>

                    <div class="order-summary">
                        <h3>Order Summary</h3>
                        <div class="order-items">
                            ${state.cart.map(item => `
                                <div class="order-item">
                                    <img src="${item.thumbnail}" alt="${item.name}">
                                    <div class="order-item-details">
                                        <p class="item-name">${item.name}</p>
                                        <p class="item-variant">Size: ${item.size}</p>
                                        <p class="item-quantity">Qty: ${item.quantity}</p>
                                    </div>
                                    <p class="item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            `).join('')}
                        </div>
                        <div class="order-total">
                            <p><strong>Total:</strong> $${state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</p>
                        </div>
                    </div>

                    <button type="submit" class="submit-btn" id="submit-payment">
                        <span>Pay and Place Order</span>
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M4 12h16M16 6l6 6-6 6"/>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById('closeCheckout');
    const overlay = modal.querySelector('.checkout-overlay');
    const form = document.getElementById('checkout-form');

    const closeModal = () => modal.remove();
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Processing...</span>';
        
        try {
            const formData = new FormData(e.target);
            // First, calculate the total amount
            const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            // 1. Create a payment intent with Stripe
            const orderData = {
                amount: total * 100, // Stripe expects amount in cents
                recipient: {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    address1: formData.get('address1'),
                    address2: formData.get('address2'),
                    city: formData.get('city'),
                    state_code: formData.get('state'),
                    country_code: 'US',
                    zip: formData.get('zip')
                },
                items: state.cart.map(item => ({
                    sync_variant_id: item.id,
                    quantity: item.quantity,
                    retail_price: item.price
                }))
            };

            // Create payment intent
            const paymentResponse = await fetch(`${SUPABASE_URL}/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const paymentData = await paymentResponse.json();
            if (!paymentResponse.ok) {
                throw new Error(paymentData.error || 'Failed to create payment intent');
            }

            // 2. Confirm the payment with Stripe.js
            const { error: stripeError } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/order-confirmation`,
                }
            });

            if (stripeError) {
                throw new Error(stripeError.message);
            }

            // 3. If payment successful, create order in Printful
            const printfulResponse = await fetch(`${SUPABASE_URL}/create-printful-order`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paymentIntentId: paymentData.paymentIntentId,
                    ...orderData
                })
            });

            const data = await response.json();
            if (response.ok) {
                state.cart = [];
                updateCartCount();
                updateCartSidebar();
                closeModal();
                
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = 'Order placed successfully!';
                document.body.appendChild(successMessage);
                setTimeout(() => successMessage.remove(), 3000);
            } else {
                throw new Error(data.error || 'Failed to place order');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = error.message;
            document.body.appendChild(errorMessage);
            setTimeout(() => errorMessage.remove(), 3000);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Place Order</span>';
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

// Initialize product click handlers
function initProductClickHandlers() {
    const productsContainer = document.getElementById('products-container');
    if (productsContainer) {
        productsContainer.addEventListener('click', (event) => {
            const productCard = event.target.closest('.product-card');
            if (productCard) {
                event.preventDefault();
                const productId = productCard.dataset.productId;
                showProductDetails(productId);
            }
        });

        // Add keyboard accessibility
        productsContainer.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                const productCard = event.target.closest('.product-card');
                if (productCard) {
                    event.preventDefault();
                    const productId = productCard.dataset.productId;
                    if (productId) {
                        showProductDetails(productId);
                    }
                }
            }
        });
    }
}

// Initialize cart structure
function initCartStructure() {
    // Create cart count if it doesn't exist
    if (!document.querySelector('.cart-count')) {
        const cartButton = document.getElementById('cart-button');
        if (cartButton) {
            const cartCount = document.createElement('span');
            cartCount.className = 'cart-count';
            cartCount.style.display = 'none';
            cartButton.appendChild(cartCount);
        }
    }

    // Create cart sidebar if it doesn't exist
    if (!document.getElementById('cart-sidebar')) {
        // Create container for all cart elements
        const cartContainer = document.createElement('div');
        cartContainer.id = 'cart-container';
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'cart-overlay';
        overlay.className = 'cart-overlay';
        cartContainer.appendChild(overlay);
        
        // Create sidebar
        const sidebar = document.createElement('div');
        sidebar.id = 'cart-sidebar';
        sidebar.className = 'cart-sidebar';
        
        // Add cart content
        sidebar.innerHTML = `
            <div class="cart-header">
                <button class="close-cart">×</button>
                <h2>Shopping Cart</h2>
            </div>
            <div id="cart-items" class="cart-items"></div>
            <div class="cart-footer">
                <div class="cart-total-section">
                    <strong>Total:</strong>
                    <span id="cart-total">$0.00</span>
                </div>
            </div>
        `;
        
        cartContainer.appendChild(sidebar);
        document.body.appendChild(cartContainer);
        
        // Reinitialize cart event listeners
        document.querySelector('.close-cart')?.addEventListener('click', () => {
            document.getElementById('cart-sidebar').classList.remove('open');
            document.getElementById('cart-overlay').style.display = 'none';
        });

        document.getElementById('cart-overlay')?.addEventListener('click', () => {
            document.getElementById('cart-sidebar').classList.remove('open');
            document.getElementById('cart-overlay').style.display = 'none';
        });
    }
}

// Initialize the store
document.addEventListener('DOMContentLoaded', () => {
    initCartStructure();
    initStore();
    initProductClickHandlers();
});
