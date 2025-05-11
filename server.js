require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your frontend domain
app.use(cors({
    origin: ['https://goblinarinos-xmas.ordinarinos.xyz', 'http://localhost:3000'],
    optionsSuccessStatus: 200
}));

// Middleware for parsing JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static('./'));

// API credentials and constants
const ME_API_KEY = process.env.ME_API_KEY;
const ME_USERNAME = process.env.ME_USERNAME;
const API_BASE_URL = 'https://api-mainnet.magiceden.dev/v3/rtp/ethereum';
const COLLECTION_ADDRESS = '0x616f2ac5dd4f760db693c21e9ca7a8aa962cf93b';

// Admin password (same as in admin.js)
const ADMIN_PASSWORD = 'GobAdmin123';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const layer = req.body.layer || 'layer1';
        const dir = path.join(__dirname, 'images', layer);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Find the next available index for the image
        const layer = req.body.layer || 'layer1';
        const dir = path.join(__dirname, 'images', layer);
        let counter = 1;
        
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const imageFiles = files.filter(file => file.startsWith('image') && file.endsWith('.png'));
            
            if (imageFiles.length > 0) {
                // Extract numbers from filenames
                const numbers = imageFiles.map(file => {
                    const match = file.match(/image(\d+)\.png/);
                    return match ? parseInt(match[1], 10) : 0;
                });
                
                counter = Math.max(...numbers) + 1;
            }
        }
        
        cb(null, `image${counter}.png`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept only PNG files
        if (file.mimetype !== 'image/png') {
            return cb(new Error('Only PNG images are allowed!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB size limit
    }
});

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

// Admin API endpoints
// Upload image endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        res.json({
            success: true,
            filename: req.file.filename,
            path: req.file.path
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get images for a layer
app.get('/api/images/:layer', (req, res) => {
    try {
        const { layer } = req.params;
        if (!['layer1', 'layer2'].includes(layer)) {
            return res.status(400).json({ error: 'Invalid layer specified' });
        }
        
        const dir = path.join(__dirname, 'images', layer);
        
        if (!fs.existsSync(dir)) {
            return res.json({ images: [] });
        }
        
        const files = fs.readdirSync(dir);
        const imageFiles = files.filter(file => file.endsWith('.png'));
        
        res.json({ images: imageFiles });
    } catch (error) {
        console.error('Error getting images:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete image endpoint
app.post('/api/delete', (req, res) => {
    try {
        const { layer, filename } = req.body;
        
        if (!layer || !filename) {
            return res.status(400).json({ error: 'Layer and filename are required' });
        }
        
        if (!['layer1', 'layer2'].includes(layer)) {
            return res.status(400).json({ error: 'Invalid layer specified' });
        }
        
        // Ensure filename is just a basename without path traversal
        const basename = path.basename(filename);
        const filePath = path.join(__dirname, 'images', layer, basename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoint: /api/nft/:tokenId`);
    console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});