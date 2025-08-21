const express = require('express');
const path = require('path');
const products = require('./products.js');
const variants = require('./variants.js');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.get('/api/products', async (req, res) => {
    try {
        const result = await products.handler(req, res);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/variants', async (req, res) => {
    try {
        const result = await variants.handler(req, res);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
