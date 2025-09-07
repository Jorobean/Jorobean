// API Configuration
const SUPABASE_URL = 'https://vkdvweyatwcfqbocezjv.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZ3ZXlhdHdjZnFib2Nlemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjQ1MTgsImV4cCI6MjA3MTM0MDUxOH0.orSkIBG-3jVd1Trv9mKT6UD5JVNw7Opy4xLJa_A5E5I';

// Initialize Stripe
const stripeInstance = Stripe('pk_live_51RFSO1GHx57yahd0fA0HLVYo9OS4tLN7GYNPL09WiliQaTO2pDda4slh5Se6E4eAMjmHyMWoLH5F0UT5pmfD8qi300ZiV95GDz');

// Store state with persistent cart
const state = {
    products: [],
    selectedVariant: null,
    cart: JSON.parse(localStorage.getItem('cart')) || []
};

// Cart helper functions
const saveCart = () => {
    localStorage.setItem('cart', JSON.stringify(state.cart));
};

window.clearCart = function() {
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;

    // Animate all items fading out
    const cartItems = cartItemsContainer.querySelectorAll('.cart-item');
    cartItems.forEach(item => {
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = '0';
        item.style.height = '0';
    });

    // After animation, clear the cart
    setTimeout(() => {
        state.cart = [];
        saveCart();
        updateCartCount();
        
        // Clear the cart items container
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        
        // Update the total
        updateCartTotal();
        
        // Disable checkout button
        const checkoutButton = document.getElementById('checkout-button');
        if (checkoutButton) {
            checkoutButton.disabled = true;
        }
    }, 300);

    // Update the total immediately
    updateCartTotal();
};

const getCartTotal = () => {
    return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const getCartCount = () => {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
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
        console.log('Fetching products from:', `${SUPABASE_URL}/products`);
        const response = await fetch(`${SUPABASE_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const responseText = await response.text();
        const data = JSON.parse(responseText);

        if (data.error) {
            throw new Error(data.error);
        }

        // Reorder products: Trail Tee first, Hoodie second, Test Postcard last, others keep relative order
        const withIndex = data.map((p, idx) => ({ p, idx }));
        const priorityFor = (name) => {
            const n = name.toLowerCase();
            if (n.includes('trail tee') || n.includes('trail')) return 0; // Trail Tee first
            if (n.includes('hoodie')) return 1; // Hoodie second
            if (n.includes('test postcard') || n.includes('postcard')) return 999; // Postcard last
            return 10; // Others in the middle
        };
        withIndex.sort((a, b) => {
            const pa = priorityFor(a.p.sync_product?.name || '');
            const pb = priorityFor(b.p.sync_product?.name || '');
            if (pa !== pb) return pa - pb;
            // Stable order for same priority
            return a.idx - b.idx;
        });
        const reordered = withIndex.map(x => x.p);
        data.length = 0;
        Array.prototype.push.apply(data, reordered);
        
        state.products = data;
        
        console.log('Full product data:', data);
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
            <div class="product-card" data-product-id="${productId}" role="button" tabindex="0">
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
                    <button 
                        class="view-variants-btn" 
                        data-product-id="${productId}"
                    >
                        $${price}
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
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const ZOOM_LEVEL = isMobile ? 1.75 : 2.5;
            let isZoomed = false;
            let lastTouchX = 0;
            let lastTouchY = 0;
            
            function updateZoom(x, y) {
                const rect = imageContainer.getBoundingClientRect();
                const xPercent = Math.max(0, Math.min(100, (x - rect.left) / rect.width * 100));
                const yPercent = Math.max(0, Math.min(100, (y - rect.top) / rect.height * 100));
                
                image.style.transformOrigin = `${xPercent}% ${yPercent}%`;
                image.style.transform = isZoomed ? `scale(${ZOOM_LEVEL})` : 'scale(1)';
            }
            
            function onMouseMove(e) {
                if (!isMobile && isZoomed) {
                    updateZoom(e.clientX, e.clientY);
                }
            }
            
            function onMouseEnter(e) {
                if (!isMobile) {
                    isZoomed = true;
                    updateZoom(e.clientX, e.clientY);
                }
            }
            
            function onMouseLeave() {
                if (!isMobile) {
                    isZoomed = false;
                    image.style.transformOrigin = 'center';
                    image.style.transform = 'scale(1)';
                }
            }
            
            function onTouchStart(e) {
                if (isMobile) {
                    isZoomed = !isZoomed;
                    const touch = e.touches[0];
                    lastTouchX = touch.clientX;
                    lastTouchY = touch.clientY;
                    updateZoom(touch.clientX, touch.clientY);
                }
            }
            
            function onTouchMove(e) {
                if (isMobile && isZoomed) {
                    e.preventDefault();
                    const touch = e.touches[0];
                    updateZoom(touch.clientX, touch.clientY);
                }
            }
            
            if (isMobile) {
                imageContainer.addEventListener('touchstart', onTouchStart);
                imageContainer.addEventListener('touchmove', onTouchMove, { passive: false });
            } else {
                imageContainer.addEventListener('mouseenter', onMouseEnter);
                imageContainer.addEventListener('mousemove', onMouseMove);
                imageContainer.addEventListener('mouseleave', onMouseLeave);
            }
            
            // Cleanup function
            return () => {
                if (isMobile) {
                    imageContainer.removeEventListener('touchstart', onTouchStart);
                    imageContainer.removeEventListener('touchmove', onTouchMove);
                } else {
                    imageContainer.removeEventListener('mouseenter', onMouseEnter);
                    imageContainer.removeEventListener('mousemove', onMouseMove);
                    imageContainer.removeEventListener('mouseleave', onMouseLeave);
                }
            };
        }

        // Function to update product images
        function updateProductImages(variant) {
            const previewImage = modal.querySelector('.dialog-image');
            const mockupGallery = modal.querySelector('.mockup-gallery');
            
            if (previewImage && mockupGallery) {
                let mockupUrls = [];
                
                // Collect all available mockup URLs
                if (variant.mockup_urls && variant.mockup_urls.length > 0) {
                    mockupUrls = variant.mockup_urls;
                } else if (variant.files && variant.files.length > 0) {
                    mockupUrls = variant.files
                        .filter(f => f.preview_url)
                        .map(f => f.preview_url);
                }

                                // Handle specific products
                const productName = product.sync_product.name.toLowerCase();
                
                // Handle specific products with additional images
                if (productName.includes('bucket')) {
                    // Add bucket hat additional images
                    const bucketImages = [
                        mockupUrls[mockupUrls.length - 1],
                        '/product-variants/bucket1.png'
                    ];
                    mockupUrls = bucketImages;
                }
                else if (productName.includes('trucker')) {
                    // Add trucker cap additional images
                    const capImages = [
                        mockupUrls[mockupUrls.length - 1],
                        '/product-variants/cap1.png',
                        '/product-variants/cap2.png',
                        '/product-variants/cap3.png',
                        '/product-variants/cap4.png',
                        '/product-variants/cap5.png'
                    ];
                    mockupUrls = capImages;
                }
                else if (productName.includes('wear the love')) {
                    const lastImage = mockupUrls[mockupUrls.length - 1];
                    if (productName.includes('black')) {
                        // Add black wear love tee additional images
                        const blackImages = [
                            lastImage,
                            '/product-variants/black1.png',
                            '/product-variants/black2.png',
                            '/product-variants/black3.png',
                            '/product-variants/black4.png',
                            '/product-variants/black5.png'
                        ];
                        mockupUrls = blackImages;
                    } else if (productName.includes('red')) {
                        // Add red wear love tee additional images
                        const redImages = [
                            lastImage,
                            '/product-variants/red1.png',
                            '/product-variants/red2.png',
                            '/product-variants/red3.png',
                            '/product-variants/red4.png',
                            '/product-variants/red5.png',
                            '/product-variants/red6.png'
                        ];
                        mockupUrls = redImages;
                    } else {
                        mockupUrls = [lastImage];
                    }
                }
                else if (productName.includes('hoodie')) {
                    // Keep only the last image for hoodies
                    mockupUrls = [mockupUrls[mockupUrls.length - 1]];
                }
                // Trail tee specific handling
                else if (product.sync_product.name.includes('Trail')) {
                    // Add additional trail images
                    const additionalTrailImages = [
                        '/product-variants/trail5.png',
                        '/product-variants/trail6.png',
                        '/product-variants/trail7.png',
                        '/product-variants/trail8.png',
                        '/product-variants/trail9.png'
                    ];
                    mockupUrls = [mockupUrls[2], mockupUrls[0], ...additionalTrailImages];
                }
                // Default behavior for other products
                else if (mockupUrls.length > 1) {
                    const lastImage = mockupUrls[mockupUrls.length - 1];
                    mockupUrls = [lastImage, ...mockupUrls.slice(0, -1)];
                }
                
                // Update main image
                if (mockupUrls.length > 0) {
                    previewImage.src = mockupUrls[0];
                } else if (variant.preview_url) {
                    previewImage.src = variant.preview_url;
                }
                
                // Always update mockup gallery
                mockupGallery.innerHTML = mockupUrls
                    .map((url, index) => `
                        <img src="${url}"
                             class="mockup-thumbnail ${index === 0 ? 'active' : ''}"
                             alt="Product view ${index + 1}"
                             onclick="updateMainImage(this, '${url}')"
                        >
                    `).join('');
            }
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
                            <div class="mockup-gallery">
                                <!-- Additional mockup thumbnails will be added here -->
                            </div>
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

            // Create and setup the main image container
            const mainImage = modal.querySelector('.dialog-image');
            const mainImageContainer = document.createElement('div');
            mainImageContainer.className = 'main-image-container';
            mainImage.parentElement.insertBefore(mainImageContainer, mainImage);
            mainImageContainer.appendChild(mainImage);
            
            const image = modal.querySelector('.dialog-image');
            const cleanup = handleImageZoom(mainImageContainer, image);

            // Show initial product images for the first available variant
            const defaultVariant = product.sync_variants.find(v => v.availability_status === 'active');
            if (defaultVariant) {
                updateProductImages(defaultVariant);
            }        const closeBtn = modal.querySelector('#closeProductDialog');
        const overlay = modal.querySelector('.dialog-overlay');
        
        let isClosing = false;

        function handleClose(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            if (isClosing) return; // Prevent double-closing
            isClosing = true;
            
            cleanup(); // Remove event listeners
            document.removeEventListener('keydown', handleEscape);
            
            // Add fade out animation
            const overlay = modal.querySelector('.dialog-overlay');
            const content = modal.querySelector('.dialog-content');
            
            if (overlay && content) {
                overlay.style.opacity = '0';
                content.style.opacity = '0';
                content.style.transform = 'scale(0.95)';
            }
            
            modal.style.pointerEvents = 'none'; // Prevent further interactions
            
            // Remove after animation
            setTimeout(() => {
                if (modal && modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                isClosing = false;
            }, 200);
        }
        
        // Also handle Escape key
        function handleEscape(e) {
            if (e.key === 'Escape') {
                handleClose();
            }
        }
        document.addEventListener('keydown', handleEscape);
        
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
            
            // For products without color variants (like postcards), treat them as having a default color
            if (colors.length <= 1) {
                selectedColor = colors[0] || 'default';
            }
            
            if (selectedSize) {
                // Find variant by size only if there's no color, or by both size and color if there is a color
                state.selectedVariant = product.sync_variants.find(v => 
                    colors.length <= 1 ? 
                    v.size === selectedSize :
                    v.color === selectedColor && v.size === selectedSize
                );
                
                // Update product images based on variant
                if (state.selectedVariant) {
                    updateProductImages(state.selectedVariant);
                }
                
                if (state.selectedVariant) {
                    modal.querySelector('.price').textContent = 
                        `$${parseFloat(state.selectedVariant.retail_price).toFixed(2)}`;
                    addToCartBtn.disabled = false;
                    console.log('Variant selected:', state.selectedVariant); // Debug log
                } else {
                    console.log('No variant found for size:', selectedSize, 'color:', selectedColor); // Debug log
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
                    
                    // Find the first available variant for this color
                    const colorVariant = product.sync_variants.find(v => 
                        v.color === color && v.availability_status === 'active'
                    );
                    
                    // Update images immediately when color changes
                    if (colorVariant) {
                        updateProductImages(colorVariant);
                    }
                    
                    // Update available sizes
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
        
        // Automatically select the size if there's only one option
        const enabledSizeButtons = Array.from(modal.querySelectorAll('.size-button')).filter(button => !button.disabled);
        if (enabledSizeButtons.length === 1) {
            enabledSizeButtons[0].classList.add('active');
            selectedSize = enabledSizeButtons[0].dataset.size;
            console.log('Auto-selecting size:', selectedSize); // Debug log
            updateSelectedVariant();
        }
        
        // Log the initial state
        console.log('Initial state:', {
            selectedSize,
            selectedColor,
            availableVariants: product.sync_variants,
            enabledSizeButtons: enabledSizeButtons.length
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
                    if (modal && modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 1000);
            }
        });

    } catch (error) {
        console.error('Error showing product details:', error);
    }
}

// Cart functionality
function addToCart(product) {
    // Determine the correct thumbnail URL
    let thumbnailUrl = product.thumbnail_url;
    
    // For hoodies, use the variant-specific image
    if (product.name.toLowerCase().includes('hoodie') && product.selectedVariant) {
        // Try to get the variant-specific image
        if (product.selectedVariant.files && product.selectedVariant.files.length > 0) {
            thumbnailUrl = product.selectedVariant.files[product.selectedVariant.files.length - 1].preview_url;
        } else if (product.selectedVariant.preview_url) {
            thumbnailUrl = product.selectedVariant.preview_url;
        } else if (product.selectedVariant.mockup_urls && product.selectedVariant.mockup_urls.length > 0) {
            thumbnailUrl = product.selectedVariant.mockup_urls[product.selectedVariant.mockup_urls.length - 1];
        }
    }
    
    const cartItem = {
        id: product.selectedVariant.id,
        variant_id: product.selectedVariant.variant_id, // Using the Printful variant_id instead of sync_variant_id
        productId: product.id,
        name: product.name,
        price: parseFloat(product.selectedVariant.retail_price),
        size: product.selectedVariant.size,
        color: product.selectedVariant.color,
        thumbnail: thumbnailUrl,
        quantity: product.quantity || 1
    };

    // Ensure cart structure exists first
    initCartStructure();

    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;

    const existingItem = state.cart.find(item => String(item.id) === String(cartItem.id));
    
    if (existingItem) {
        // Update existing item
        existingItem.quantity += cartItem.quantity;
        
        // Update the visual quantity in the cart immediately
        const existingElement = cartItems.querySelector(`[data-item-id="${existingItem.id}"]`);
        if (existingElement) {
            const quantitySpan = existingElement.querySelector('.quantity-value');
            const priceDisplay = existingElement.querySelector('.cart-item-price');
            if (quantitySpan) quantitySpan.textContent = existingItem.quantity;
            if (priceDisplay) priceDisplay.textContent = `$${(existingItem.price * existingItem.quantity).toFixed(2)}`;
        }
    } else {
        // Add new item
        state.cart.push(cartItem);
        
        // Add new item to cart visually immediately
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.dataset.itemId = cartItem.id;
        itemElement.innerHTML = `
            <img src="${cartItem.thumbnail}" alt="${cartItem.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4>${cartItem.name}</h4>
                <p>Size: ${cartItem.size}</p>
                ${cartItem.color ? `<p>Color: ${cartItem.color}</p>` : ''}
                <div class="quantity-controls">
                    <button type="button" class="quantity-decrease" data-item-id="${cartItem.id}" aria-label="Decrease quantity">-</button>
                    <span class="quantity-value">${cartItem.quantity}</span>
                    <button type="button" class="quantity-increase" data-item-id="${cartItem.id}" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <div class="cart-item-price">
                $${(cartItem.price * cartItem.quantity).toFixed(2)}
            </div>
        `;
        cartItems.appendChild(itemElement);
    }
    
    // Save cart state and update displays
    saveCart();
    updateCartCount();
    updateCartTotal();

    // Update checkout button state
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.disabled = false;
        checkoutButton.removeEventListener('click', showCheckoutForm);
        checkoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await showCheckoutForm();
        });
    }

    // Show the cart sidebar
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartSidebar && cartOverlay) {
        // Remove any empty cart message if it exists
        const emptyMessage = cartItems.querySelector('.empty-cart');
        if (emptyMessage) emptyMessage.remove();
        
        cartSidebar.classList.add('open');
        cartOverlay.style.display = 'block';
    }
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
    // Always ensure cart structure exists first
    initCartStructure();

    // Get all necessary cart elements
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartSidebar = document.getElementById('cart-sidebar');
    const checkoutButton = document.getElementById('checkout-button');
    
    // Verify all elements exist
    if (!cartItems || !cartTotal || !cartSidebar || !checkoutButton) {
        console.error('Required cart elements not found');
        return;
    }

    console.log('Current cart state before rendering:', state.cart);
    
    if (state.cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = '$0.00';
        if (checkoutButton) {
            checkoutButton.disabled = true;
            checkoutButton.removeEventListener('click', showCheckoutForm);
        }
        return;
    }
    
    // Enable checkout button if cart has items
    if (checkoutButton) {
        checkoutButton.disabled = false;
        // Remove any existing listeners before adding a new one
        checkoutButton.removeEventListener('click', showCheckoutForm);
        checkoutButton.addEventListener('click', showCheckoutForm);
    }

    // Clear existing content
    cartItems.innerHTML = '';
    
    // Add each item individually
    state.cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.dataset.itemId = item.id;
        
        // Set proper height for the image container to prevent layout shifts
        const imageStyle = 'object-fit: cover; width: 100%; height: 100%;';
        
        itemElement.innerHTML = `
            <div class="cart-item-image-container" style="width: 80px; height: 80px; overflow: hidden; border-radius: 4px;">
                <img 
                    src="${item.thumbnail}" 
                    alt="${item.name}" 
                    class="cart-item-image"
                    style="${imageStyle}"
                >
            </div>
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>Size: ${item.size}</p>
                ${item.color ? `<p>Color: ${item.color}</p>` : ''}
                <div class="quantity-controls">
                    <button type="button" class="quantity-decrease" data-item-id="${item.id}" aria-label="Decrease quantity">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button type="button" class="quantity-increase" data-item-id="${item.id}" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <div class="cart-item-price">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
        `;
        cartItems.appendChild(itemElement);
    });

    const total = getCartTotal();
    cartTotal.textContent = `$${total.toFixed(2)}`;

    // Add checkout button to cart footer
    const cartFooter = document.createElement('div');
    cartFooter.className = 'cart-footer';
    cartFooter.innerHTML = `
        <div class="cart-total-section">
            <strong>Total:</strong>
            <span class="cart-total">$${total.toFixed(2)}</span>
        </div>
        <button class="checkout-button" id="checkout-button" onclick="showCheckoutForm()">Proceed to Checkout</button>
    `;
    
    // Update existing footer instead of replacing it
    const existingFooter = cartSidebar.querySelector('.cart-footer');
    if (existingFooter) {
        existingFooter.querySelector('.cart-total').textContent = `$${total.toFixed(2)}`;
    }

    // Add event listeners for quantity controls
    // Add direct click handlers to the cart items container using event delegation
    cartItems.addEventListener('click', (e) => {
        const decreaseBtn = e.target.closest('.quantity-decrease');
        const increaseBtn = e.target.closest('.quantity-increase');
        
        if (decreaseBtn) {
            e.preventDefault();
            e.stopPropagation();
            const itemId = decreaseBtn.dataset.itemId;
            const item = state.cart.find(item => String(item.id) === String(itemId));
            if (item) {
                updateQuantity(itemId, item.quantity - 1);
            }
        } else if (increaseBtn) {
            e.preventDefault();
            e.stopPropagation();
            const itemId = increaseBtn.dataset.itemId;
            const item = state.cart.find(item => String(item.id) === String(itemId));
            if (item) {
                updateQuantity(itemId, item.quantity + 1);
            }
        }
    });
}

function updateCartTotal() {
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update all cart total elements (there might be multiple on the page)
    const cartTotalElements = document.querySelectorAll('.cart-total, #cart-total');
    cartTotalElements.forEach(element => {
        if (element) {
            element.textContent = `$${total.toFixed(2)}`;
        }
    });

    // Update checkout button state
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        const hasItems = state.cart.length > 0;
        checkoutButton.disabled = !hasItems;
        
        if (hasItems) {
            checkoutButton.removeEventListener('click', showCheckoutForm);
            checkoutButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await showCheckoutForm();
            });
        }
    }
}

function updateQuantity(itemId, newQuantity) {
    console.log('Updating quantity for item:', itemId, 'to:', newQuantity);
    
    // Find the specific cart item
    const cartItem = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
    if (!cartItem) return;
    
    // Find the specific item in the cart state
    const item = state.cart.find(item => String(item.id) === String(itemId));
    if (!item) return;

    // Find the quantity span within this specific cart item
    const quantitySpan = cartItem.querySelector('.quantity-value');
    if (quantitySpan) {
        quantitySpan.textContent = Math.max(0, newQuantity);
    }
    
    if (newQuantity <= 0) {
        console.log('Removing item from cart');
        // Animate item removal
        cartItem.style.transition = 'all 0.3s ease';
        cartItem.style.opacity = '0';
        cartItem.style.height = '0';
        setTimeout(() => {
            state.cart = state.cart.filter(item => String(item.id) !== String(itemId));
            saveCart();
            updateCartCount();
            updateCartTotal();
            cartItem.remove(); // Remove the element from DOM
            
            // If cart is empty, show empty message
            if (state.cart.length === 0) {
                const cartItems = document.getElementById('cart-items');
                if (cartItems) {
                    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
                }
            }
        }, 300);
    } else {
        const item = state.cart.find(item => String(item.id) === String(itemId));
        if (item) {
            item.quantity = newQuantity;
            // Update the price display within this specific cart item
            const priceDisplay = cartItem.querySelector('.cart-item-price');
            if (priceDisplay) {
                priceDisplay.textContent = `$${(item.price * newQuantity).toFixed(2)}`;
            }
            saveCart();
            updateCartCount();
            updateCartTotal();
        }
    }
}

// Checkout functionality
async function showCheckoutForm() {
    console.log('showCheckoutForm called');
    
    // Prevent multiple checkout attempts
    if (window.checkoutInProgress) {
        console.log('Checkout already in progress');
        return;
    }
    
    window.checkoutInProgress = true;
    
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.classList.add('loading');
        checkoutButton.disabled = true;
    }

    // Prepare cart data for Stripe
    console.log('Cart state before preparing data:', state.cart);
    const cartData = state.cart.map(item => {
        // Log each item as we process it
        console.log('Processing cart item:', item);
        return {
            price_data: {
                currency: 'usd',
                unit_amount: Math.round(item.price * 100), // Convert to cents
                product_data: {
                    name: item.name,
                    description: `Size: ${item.size}${item.color ? `, Color: ${item.color}` : ''}`,
                    images: [item.thumbnail]
                }
            },
            quantity: item.quantity,
            variant_id: item.variant_id // Use the correct Printful variant_id
        };
    });
    console.log('Prepared cart data:', cartData);

        // Show loading state
        const loadingMessage = document.createElement('div');
        loadingMessage.id = 'checkout-loading-message';
        loadingMessage.className = 'loading-message';
        loadingMessage.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Preparing checkout...</p>
            </div>
        `;
        document.body.appendChild(loadingMessage);

        // Add visibility change listener to handle browser back button
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const existingLoadingMessage = document.getElementById('checkout-loading-message');
                if (existingLoadingMessage) {
                    existingLoadingMessage.remove();
                }
                if (checkoutButton) {
                    checkoutButton.classList.remove('loading');
                    checkoutButton.disabled = false;
                }
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Clean up the listener after 5 minutes (longer than typical checkout duration)
        setTimeout(() => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }, 300000);    try {
        console.log('Sending cart data:', cartData);
        
        // Create a Checkout Session
        const response = await fetch(`${SUPABASE_URL}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                items: cartData
            })
        });

        let errorMessage;
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Checkout session error:', errorData);
            
            try {
                // Try to parse the error as JSON
                const errorJson = JSON.parse(errorData);
                errorMessage = errorJson.error || 'Failed to create checkout session';
            } catch {
                // If not JSON, use the raw error text
                errorMessage = errorData;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Received response:', data);

        if (!data.sessionId) {
            throw new Error('No session ID returned from server');
        }

        // Only proceed with Stripe redirect if we have a valid session ID
        if (data.sessionId) {
            // Redirect to Stripe Checkout
            const result = await stripeInstance.redirectToCheckout({
                sessionId: data.sessionId
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            // Clear cart only after successful redirect
            clearCart();

            // Only close cart if checkout redirect is successful
            const cartSidebar = document.getElementById('cart-sidebar');
            const cartOverlay = document.getElementById('cart-overlay');
            if (cartSidebar && cartOverlay) {
                cartSidebar.classList.remove('open');
                cartOverlay.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Checkout error:', error);
        
        // Only show error message for actual errors, not redirects
        if (!error.message?.includes('redirectToCheckout') && 
            !error.message?.includes('loadFail') && 
            !error.message?.includes('stripe.com')) {
            
            // Create a styled error message container
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.style.position = 'fixed';
            errorMessage.style.top = '20px';
            errorMessage.style.left = '50%';
            errorMessage.style.transform = 'translateX(-50%)';
            errorMessage.style.backgroundColor = '#ff4444';
            errorMessage.style.color = 'white';
            errorMessage.style.padding = '1rem 2rem';
            errorMessage.style.borderRadius = '4px';
            errorMessage.style.zIndex = '2000';
            errorMessage.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            errorMessage.style.textAlign = 'center';
            
            // Show a user-friendly error message
            errorMessage.textContent = error.message || 'An error occurred during checkout. Please try again.';
            document.body.appendChild(errorMessage);
            setTimeout(() => {
                errorMessage.style.opacity = '0';
                setTimeout(() => errorMessage.remove(), 300);
            }, 4700);
        }
    } finally {
        // Reset checkout state
        window.checkoutInProgress = false;
        
        // Clean up loading message if it exists
        const existingLoadingMessage = document.getElementById('checkout-loading-message');
        if (existingLoadingMessage) {
            existingLoadingMessage.remove();
        }
        
        // Reset checkout button
        const checkoutButton = document.getElementById('checkout-button');
        if (checkoutButton) {
            checkoutButton.classList.remove('loading');
            checkoutButton.disabled = false;
        }
    }
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
            event.preventDefault();
            const priceButton = event.target.closest('.view-variants-btn');
            const productCard = event.target.closest('.product-card');
            
            // If clicked on price button, use that product ID
            if (priceButton) {
                const productId = priceButton.dataset.productId;
                if (productId) {
                    showProductDetails(productId);
                }
            }
            // If clicked anywhere else on the card, use the card's product ID
            else if (productCard && !event.target.closest('.view-variants-btn')) {
                const productId = productCard.dataset.productId;
                if (productId) {
                    showProductDetails(productId);
                }
            }
        });

        // Add keyboard accessibility
        productsContainer.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const productCard = event.target.closest('.product-card');
                if (productCard) {
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
                <h2>Shopping Cart</h2>
                <div class="cart-header-buttons">
                    <button class="close-cart" aria-label="Close Cart">×</button>
                </div>
            </div>
            <div id="cart-items" class="cart-items"></div>
            <div class="cart-footer" id="cart-footer">
                <div class="cart-total-row">
                    <div class="cart-total">
                        Total: <span id="cart-total">$0.00</span>
                    </div>
                    <button type="button" class="clear-cart-btn" onclick="clearCart()">Clear Cart</button>
                </div>
                <button class="checkout-button" id="checkout-button" ${state.cart.length === 0 ? 'disabled' : ''}>
                    Proceed to Checkout
                </button>
            </div>
        `;
        
        cartContainer.appendChild(sidebar);
        document.body.appendChild(cartContainer);
        
        // Initialize checkout button state
        const checkoutButton = document.getElementById('checkout-button');
        if (checkoutButton) {
            const hasItems = state.cart.length > 0;
            checkoutButton.disabled = !hasItems;
            
            if (hasItems) {
                checkoutButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await showCheckoutForm();
                });
            }
        }
        
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

// Function to update main image when clicking thumbnails
window.updateMainImage = function(thumbnailElement, newSrc) {
    const mainImage = thumbnailElement.closest('.product-image-section').querySelector('.dialog-image');
    const allThumbnails = thumbnailElement.closest('.mockup-gallery').querySelectorAll('.mockup-thumbnail');
    
    // Update main image
    mainImage.src = newSrc;
    
    // Update thumbnail active states
    allThumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnailElement.classList.add('active');
};

// Initialize the store
// Reset any lingering checkout state when the page loads
window.addEventListener('pageshow', (event) => {
    // Reset checkout state even if the page is loaded from the bfcache
    window.checkoutInProgress = false;
    
    // Clean up any lingering loading messages
    const existingLoadingMessage = document.getElementById('checkout-loading-message');
    if (existingLoadingMessage) {
        existingLoadingMessage.remove();
    }
    
    // Reset checkout button state
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.classList.remove('loading');
        checkoutButton.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Initialize cart structure first
    initCartStructure();
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            state.cart = JSON.parse(savedCart);
            // Ensure we have a valid cart array
            if (!Array.isArray(state.cart)) {
                state.cart = [];
            }
        } catch (e) {
            console.error('Error loading cart from localStorage:', e);
            state.cart = [];
        }
    }
    
    // Update cart display
    updateCartCount();
    updateCartSidebar();
    
    // Initialize store and product handlers
    initStore();
    initProductClickHandlers();
    
    // Add checkout button event listener
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.removeEventListener('click', showCheckoutForm);
        checkoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await showCheckoutForm();
        });
    }
});
