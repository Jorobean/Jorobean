// Test the products API endpoint
async function testProductsAPI() {
    console.group('Testing Products API');
    try {
        const response = await fetch('https://vkdvweyatwcfqbocezjv.supabase.co/functions/v1/products', {
            headers: {
                'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZ3ZXlhdHdjZnFib2Nlemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjQ1MTgsImV4cCI6MjA3MTM0MDUxOH0.orSkIBG-3jVd1Trv9mKT6UD5JVNw7Opy4xLJa_A5E5I`
            }
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        try {
            const data = JSON.parse(responseText);
            console.log('Parsed data:', data);
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
        }

    } catch (error) {
        console.error('Network error:', error);
    }
    console.groupEnd();
}

// Run the test
testProductsAPI();
