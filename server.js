// server.js (Final, Robust Proxy Logic)

const express = require('express');
// We still need node-fetch if we use an older Node runtime on Vercel
const fetch = require('node-fetch'); 
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// --- CRITICAL: REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT URL ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxcMPoZvuyVLnB4dZGnQ5clbR6sKJPtWEeUM7JdE1sM4Nd372Df_LAWlJG_KAOuj5A1/exec';
// -------------------------------------------------------------------------


// --- CORS HANDLING: Allow all origins and handle preflight requests ---
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    if (req.method === 'OPTIONS') {
        // Vercel should return the CORS headers for preflight
        return res.sendStatus(200); 
    }
    next();
});


// Proxy endpoint: /api/feed
app.all('/api/feed', async (req, res) => {
    
    // --- ROBUST QUERY STRING PASSING ---
    let queryString = '';
    
    // Check if the incoming request has a query string. This is the most reliable method.
    if (req.url.includes('?')) {
        queryString = req.url.substring(req.url.indexOf('?'));
    }
    
    const targetUrl = GAS_URL + queryString;
    
    console.log(`Proxy forwarding request to: ${targetUrl}`);
    // ------------------------------------


    try {
        let fetchOptions = {
            method: req.method,
            credentials: 'omit', 
            headers: {
                // *** CRITICAL CHANGE: MIMIC A BROWSER ***
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // ***************************************
                'Content-Type': 'application/json',
            },
        };
        // ... rest of the proxy logic remains the same

        if (req.method === 'POST' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        // 2. Fetch data from the Google Apps Script URL
        const gasResponse = await fetch(targetUrl, fetchOptions);

        // 3. Forward the status and JSON body back to the frontend
        const data = await gasResponse.json();
        
        // This line ensures the correct status code is returned, which is important
        return res.status(gasResponse.status).json(data);

    } catch (error) {
        console.error('Proxy FAILED to contact Google Apps Script:', error);
        // Return a clean 502 Bad Gateway or 500 Server error
        return res.status(500).json({ 
            error: 'Backend API access failed.', 
            details: error.message,
            target: targetUrl
        });
    }
});

module.exports = app;


