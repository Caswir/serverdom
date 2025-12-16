// server.js (for deploying on Vercel/Glitch/etc.)

const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// --- YOUR ORIGINAL GOOGLE APPS SCRIPT URL ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyChNzI09HEZ9rwvgS7XB98B8kvoE27XqeStWsVMrW7lekupQnsKp7QS6FYwa7SXWzuLA/exec';

// Allow CORS for all origins, required for Vercel/Glitch deployment
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200); // Handle preflight requests
    }
    next();
});


// Proxy endpoint: /api/feed
app.all('/api/feed', async (req, res) => {
    const isGet = req.method === 'GET';
    const isPost = req.method === 'POST';
    
    // 1. Build the target URL for GAS
    let targetUrl = GAS_URL;
    
    if (isGet) {
        // For GET requests, append all query parameters (e.g., ?tokenId=9&action=get)
        const queryParams = new URLSearchParams(req.query).toString();
        if (queryParams) {
            targetUrl += `?${queryParams}`;
        }
    }

    try {
        let fetchOptions = {
            method: req.method,
            // The proxy server initiates this request, so CORS is not an issue here
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (isPost) {
            // For POST, include the JSON body
            fetchOptions.body = JSON.stringify(req.body);
        }

        // 2. Fetch data from the Google Apps Script URL
        const gasResponse = await fetch(targetUrl, fetchOptions);

        // 3. Forward the status and JSON body back to the frontend
        const data = await gasResponse.json();
        return res.status(gasResponse.status).json(data);

    } catch (error) {
        console.error('Proxy Error contacting GAS:', error);
        return res.status(500).json({ 
            error: 'Proxy server failed to communicate with the Google Apps Script.', 
            details: error.message 
        });
    }
});

// For Vercel, use a simple API endpoint structure
module.exports = app;

// If running locally, uncomment this:
/* app.listen(PORT, () => {
    console.log(`Proxy running on http://localhost:${PORT}`);
});
*/