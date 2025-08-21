// Store configuration
const config = {
    apiEndpoint: '/.netlify/functions/printful'
};

// Store state
let state = {
    products: [],
    cart: []
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

        // Fetch products
        const response = await fetch(config.apiEndpoint + '/products');
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // The API returns an array of products in the result property
        const products = data.result || [];
        if (!Array.isArray(products)) {
            throw new Error('Invalid response format');
        }

        // Transform the Printful API response to our format
        state.products = products.map(p => ({
            id: p.id,
            name: p.name,
            thumbnail_url: p.thumbnail_url || null,
            variants: p.variants ? p.variants.length : 0
        }));
        
        renderProducts();

    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <h3>Failed to load products</h3>
                <p>Please try refreshing the page. If the problem persists, contact support.</p>
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
        const productClasses = product.thumbnail_url ? 'product-card' : 'product-card coming-soon';
        return `
            <div class="${productClasses}" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img 
                        src="${product.thumbnail_url || 'https://via.placeholder.com/400x500?text=Coming+Soon'}" 
                        alt="${product.name}"
                        class="product-image"
                        loading="lazy"
                    >
                    ${!product.thumbnail_url ? '<div class="coming-soon-badge">Coming Soon</div>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-variants">${product.variants} styles available</p>
                    ${product.thumbnail_url ? 
                        `<button class="view-variants-btn" onclick="showProductDetails(${product.id})">
                            View Styles
                        </button>` :
                        `<button class="notify-btn" onclick="notifyMe(${product.id})">
                            Notify When Available
                        </button>`
                    }
                </div>
            </div>
        `;
    }).join('');

    productsContainer.innerHTML = productsHTML;
}

// Show product details
async function showProductDetails(productId) {
    try {
        const response = await fetch(`${config.apiEndpoint}/variants/${productId}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // The API returns product details in the result property
        const details = data.result;
        if (!details) {
            throw new Error('No product details available');
        }
        
        // For now, just show the variants data in an alert
        // Later we can create a modal to display this properly
        alert(`Product: ${details.name}\nVariants: ${details.variants ? details.variants.length : 0}\n\n${JSON.stringify(details.variants, null, 2)}`);
        
    } catch (error) {
        console.error('Error fetching product details:', error);
        alert('Failed to load product details. Please try again.');
    }
}

// Notification function
function notifyMe(productId) {
    // We'll implement this function for the notification feature
    alert('Notification feature coming soon!');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initStore);
