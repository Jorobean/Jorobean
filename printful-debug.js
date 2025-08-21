const PRINTFUL_API_KEY = 'QoVz5FTzBwcA4YXjASXR2bGjw8RRaPw62Gr3jvGd';
const PRINTFUL_API_URL = 'https://api.printful.com';

async function getStoreInfo() {
    const response = await fetch(`${PRINTFUL_API_URL}/stores`, {
        headers: {
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`
        }
    });
    const data = await response.json();
    console.log('\n=== Store Info ===');
    console.log(JSON.stringify(data, null, 2));
    return data.result[0].id;
}

async function getSyncProducts(storeId) {
    const response = await fetch(`${PRINTFUL_API_URL}/sync/products?store_id=${storeId}`, {
        headers: {
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`
        }
    });
    const data = await response.json();
    console.log('\n=== Synced Products ===');
    console.log(JSON.stringify(data, null, 2));
    return data.result;
}

async function getSyncVariants(storeId) {
    const response = await fetch(`${PRINTFUL_API_URL}/sync/variants?store_id=${storeId}`, {
        headers: {
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`
        }
    });
    const data = await response.json();
    console.log('\n=== Synced Variants ===');
    console.log(JSON.stringify(data, null, 2));
    return data.result;
}

async function testOrder(storeId, variantId) {
    const orderPayload = {
        recipient: {
            name: "Test Order",
            address1: "123 Test St",
            city: "Los Angeles",
            state_code: "CA",
            country_code: "US",
            zip: "90210"
        },
        items: [
            {
                sync_variant_id: variantId,
                quantity: 1
            }
        ],
        store_id: storeId
    };

    console.log('\n=== Testing Order with Payload ===');
    console.log(JSON.stringify(orderPayload, null, 2));

    const response = await fetch(`${PRINTFUL_API_URL}/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
    });
    const data = await response.json();
    console.log('\n=== Order Response ===');
    console.log(JSON.stringify(data, null, 2));
}

async function main() {
    try {
        const storeId = await getStoreInfo();
        console.log('\nStore ID:', storeId);

        const syncedProducts = await getSyncProducts(storeId);
        console.log('\nFirst synced product ID:', syncedProducts[0]?.id);

        const syncedVariants = await getSyncVariants(storeId);
        const firstVariantId = syncedVariants[0]?.id;
        console.log('\nFirst variant ID:', firstVariantId);

        if (firstVariantId) {
            await testOrder(storeId, firstVariantId);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the script
main();
