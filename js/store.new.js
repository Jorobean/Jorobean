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
        const products = await response.json();

        if (!Array.isArray(products)) {
            throw new Error('Invalid response format');
        }

        state.products = products;
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

    const productsHTML = state.products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image-container">
                <img 
                    src="${product.thumbnail_url || 'https://via.placeholder.com/400x500?text=Coming+Soon'}" 
                    alt="${product.name}"
                    class="product-image"
                >
                ${!product.thumbnail_url ? '<div class="coming-soon-badge">Coming Soon</div>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-variants">${product.variants} styles available</p>
                <button 
                    class="view-variants-btn" 
                    onclick="showProductDetails(${product.id})"
                >
                    View Details
                </button>
            </div>
        </div>
    `).join('');

    productsContainer.innerHTML = productsHTML;
}

// Show product details
async function showProductDetails(productId) {
    try {
        const response = await fetch(`${config.apiEndpoint}/variants/${productId}`);
        const data = await response.json();
        
        // For now, just show the variants data in an alert
        alert(`Product variants:\n${JSON.stringify(data, null, 2)}`);
        
    } catch (error) {
        console.error('Error fetching product details:', error);
        alert('Failed to load product details. Please try again.');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initStore);
