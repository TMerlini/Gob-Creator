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

// Ensure all necessary directories exist
const directories = [
    './images/layer1',
    './images/layer2',
    './images/background',
    './music'
];

// Create directories if they don't exist
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Log for debugging
        console.log('Upload request body:', req.body);

        const layer = req.body.layer || 'layer1';
        const dir = path.join(__dirname, 'images', layer);

        console.log('Uploading to layer:', layer);
        console.log('Directory:', dir);

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

// Make sure multer processes the form data before accessing req.body
const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const layer = req.query.layer || 'layer1';
        
        // Validate files based on layer type
        if (layer === 'layer1' || layer === 'layer2') {
            // Accept only PNG files for layer1 and layer2
            if (file.mimetype !== 'image/png') {
                return cb(new Error('Only PNG images are allowed for Layer 1 and Layer 2!'), false);
            }
        } else if (layer === 'background') {
            // Accept image files for background
            if (!file.mimetype.startsWith('image/')) {
                return cb(new Error('Only image files are allowed for Background!'), false);
            }
        } else if (layer === 'music') {
            // Accept audio files for music
            if (!file.mimetype.startsWith('audio/')) {
                return cb(new Error('Only audio files are allowed for Music!'), false);
            }
        }
        
        cb(null, true);
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB size limit
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
app.post('/api/upload', (req, res) => {
    // Process layer field before multer processes file
    const layer = req.query.layer || 'layer1';
    
    console.log('Upload request for layer:', layer);

    // Create a single-use multer instance with dynamic destination
    const singleUpload = multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                let dir;
                
                // Determine the correct directory based on layer type
                if (layer === 'music') {
                    dir = path.join(__dirname, 'music');
                } else if (layer === 'background') {
                    // Ensure background directory exists
                    dir = path.join(__dirname, 'images', 'background');
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                        console.log('Created missing background directory:', dir);
                    }
                } else {
                    dir = path.join(__dirname, 'images', layer);
                }
                
                console.log('Uploading to layer:', layer);
                console.log('Directory:', dir);

                // Create directory if it doesn't exist
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                cb(null, dir);
            },
            filename: function (req, file, cb) {
                const layer = req.query.layer || 'layer1';
                let dir;
                
                if (layer === 'music') {
                    dir = path.join(__dirname, 'music');
                } else if (layer === 'background') {
                    dir = path.join(__dirname, 'images', 'background');
                } else {
                    dir = path.join(__dirname, 'images', layer);
                }
                
                let counter = 1;
                // Preserve original extension for background and music
                const ext = layer === 'background' ? path.extname(file.originalname).toLowerCase() || '.png' : 
                           (layer === 'music' ? path.extname(file.originalname).toLowerCase() || '.mp3' : '.png');
                const filePrefix = layer === 'music' ? 'track' : 'image';
                
                console.log(`Upload to ${layer}, directory: ${dir}, extension: ${ext}`);

                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir);
                    const filePattern = new RegExp(`^${filePrefix}(\\d+)\\.[a-z0-9]+$`);
                    const matchingFiles = files.filter(file => filePattern.test(file));

                    if (matchingFiles.length > 0) {
                        // Extract numbers from filenames
                        const numbers = matchingFiles.map(file => {
                            const match = file.match(filePattern);
                            return match ? parseInt(match[1], 10) : 0;
                        });

                        counter = Math.max(...numbers) + 1;
                    }
                }

                cb(null, `${filePrefix}${counter}${ext}`);
            }
        }),
        fileFilter: function (req, file, cb) {
            const layer = req.query.layer || 'layer1';
            
            // Validate files based on layer type
            if (layer === 'layer1' || layer === 'layer2') {
                // Accept only PNG files for layer1 and layer2
                if (file.mimetype !== 'image/png') {
                    return cb(new Error('Only PNG images are allowed for Layer 1 and Layer 2!'), false);
                }
            } else if (layer === 'background') {
                // Accept image files for background
                if (!file.mimetype.startsWith('image/')) {
                    return cb(new Error('Only image files are allowed for Background!'), false);
                }
            } else if (layer === 'music') {
                // Accept audio files for music
                if (!file.mimetype.startsWith('audio/')) {
                    return cb(new Error('Only audio files are allowed for Music!'), false);
                }
            }
            
            cb(null, true);
        },
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB size limit
        }
    }).single('image');

    singleUpload(req, res, function(err) {
        if (err) {
            console.error('Upload error:', err);
            return res.status(500).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.json({
            success: true,
            filename: req.file.filename,
            path: req.file.path,
            layer: layer
        });
    });
});

// Get images for a layer
app.get('/api/images/:layer', (req, res) => {
    try {
        const { layer } = req.params;
        console.log(`API request for images in layer: ${layer}`);
        
        if (!['layer1', 'layer2', 'background', 'music'].includes(layer)) {
            return res.status(400).json({ error: 'Invalid layer specified' });
        }

        let dir;
        if (layer === 'music') {
            dir = path.join(__dirname, 'music');
        } else if (layer === 'background') {
            // Check both locations for background images
            const bgDir1 = path.join(__dirname, 'images', 'background');
            const bgDir2 = path.join(__dirname, 'background');
            
            // First check the background directory at root (this is where it actually exists)
            if (fs.existsSync(bgDir2) && fs.readdirSync(bgDir2).length > 0) {
                console.log('Using background directory at root');
                dir = bgDir2;
            }
            // Then check the images/background directory
            else if (fs.existsSync(bgDir1) && fs.readdirSync(bgDir1).length > 0) {
                console.log('Using images/background directory');
                dir = bgDir1;
            }
            // Default to background at root
            else {
                dir = bgDir2;
                if (!fs.existsSync(dir)) {
                    console.log('Creating missing background directory');
                    fs.mkdirSync(dir, { recursive: true });
                }
            }
        } else {
            dir = path.join(__dirname, 'images', layer);
        }

        console.log(`Looking for files in directory: ${dir}`);
        
        if (!fs.existsSync(dir)) {
            console.log(`Directory ${dir} does not exist, creating it`);
            fs.mkdirSync(dir, { recursive: true });
            return res.json({ files: [] });
        }

        const files = fs.readdirSync(dir);
        console.log(`Found ${files.length} files in ${dir}`);
        let filteredFiles;
        
        if (layer === 'music') {
            filteredFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
            });
        } else if (layer === 'background') {
            filteredFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
            });
        } else {
            filteredFiles = files.filter(file => file.endsWith('.png'));
        }

        res.json({ files: filteredFiles });
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

        if (!['layer1', 'layer2', 'background', 'music'].includes(layer)) {
            return res.status(400).json({ error: 'Invalid layer specified' });
        }

        // Ensure filename is just a basename without path traversal
        const basename = path.basename(filename);
        
        let filePath;
        if (layer === 'music') {
            filePath = path.join(__dirname, 'music', basename);
        } else {
            filePath = path.join(__dirname, 'images', layer, basename);
        }

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

// Site settings API endpoints
app.get('/api/site-settings', (req, res) => {
    try {
        // Check if settings file exists
        const settingsPath = path.join(__dirname, 'settings.json');
        if (fs.existsSync(settingsPath)) {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            res.json({ settings });
        } else {
            // Return default settings if file doesn't exist
            const defaultSettings = {
                title: 'GOBLINARINOS',
                subtitle: 'Merry Christmas Gobos',
                subtext: 'Put you´r hat on!, Das it & Das all!'
            };
            res.json({ settings: defaultSettings });
        }
    } catch (error) {
        console.error('Error getting site settings:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/site-settings', (req, res) => {
    try {
        const { settings } = req.body;
        
        if (!settings || !settings.title) {
            return res.status(400).json({ error: 'Invalid settings data' });
        }
        
        // Save settings to file
        const settingsPath = path.join(__dirname, 'settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving site settings:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoint: /api/nft/:tokenId`);
    console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});