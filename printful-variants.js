const PRINTFUL_API_KEY = 'QoVz5FTzBwcA4YXjASXR2bGjw8RRaPw62Gr3jvGd';
const PRINTFUL_API_URL = 'https://api.printful.com';

async function getProductDetails(productId) {
    const response = await fetch(`${PRINTFUL_API_URL}/sync/products/${productId}?store_id=16653468`, {
        headers: {
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`
        }
    });
    const data = await response.json();
    console.log('\n=== Product Details ===');
    console.log(JSON.stringify(data, null, 2));
}

// Get details for first t-shirt
getProductDetails(390390422);
