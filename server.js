require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your frontend domain
app.use(cors({
    origin: 'https://goblinarinos-xmas.ordinarinos.xyz',
    optionsSuccessStatus: 200
}));

// Serve static files from the current directory
app.use(express.static('./'));

// API credentials and constants
const ME_API_KEY = process.env.ME_API_KEY;
const ME_USERNAME = process.env.ME_USERNAME;
const API_BASE_URL = 'https://api-mainnet.magiceden.dev/v3/rtp/ethereum';
const COLLECTION_ADDRESS = '0x616f2ac5dd4f760db693c21e9ca7a8aa962cf93b';

// Debug endpoint to check if server is running
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// NFT endpoint
app.get('/api/nft/:tokenId', async (req, res) => {
    try {
        const { tokenId } = req.params;
        console.log(`Fetching NFT ${tokenId}`); // Debug log

        const apiUrl = `${API_BASE_URL}/tokens/${COLLECTION_ADDRESS}/${tokenId}`;
        console.log(`Calling API: ${apiUrl}`); // Debug log
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'ME-Pub-API-Metadata': JSON.stringify({ paging: true }),
                'Authorization': `Bearer ${ME_API_KEY}`,
                'Type': 'Bearer Token',
                'Username': ME_USERNAME,
                'Credential': ME_API_KEY
            }
        });

        console.log(`API Response status: ${response.status}`); // Debug log

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ 
                error: 'Failed to fetch NFT data',
                details: errorText
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoint: /api/nft/:tokenId`);
});