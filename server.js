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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
    './images/contributors',
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

    // Create a single-use multer instance with dynamic destination
    const singleUpload = multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                let dir;

                // Determine the correct directory based on layer type
                if (layer === 'music') {
                    dir = path.join(__dirname, 'music');
                } else if (layer === 'background') {
                    dir = path.join(__dirname, 'images', 'background');
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
                const dir = layer === 'music' ? path.join(__dirname, 'music') : path.join(__dirname, 'images', layer);
                let counter = 1;
                const ext = path.extname(file.originalname).toLowerCase() || 
                           (layer === 'music' ? '.mp3' : '.png');
                const filePrefix = layer === 'music' ? 'track' : 'image';

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

// API endpoint for reordering images
app.post('/api/reorder-images', async (req, res) => {
    try {
        const { layer, order } = req.body;

        if (!layer || !Array.isArray(order)) {
            return res.status(400).json({ error: 'Invalid request parameters' });
        }

        // Create a settings file that stores the image order
        const settingsPath = path.join(__dirname, `${layer}_order.json`);

        // Write the order to the file
        fs.writeFileSync(settingsPath, JSON.stringify({ order }));

        // Return success
        res.json({ success: true });
    } catch (error) {
        console.error('Error reordering images:', error);
        res.status(500).json({ error: 'Failed to reorder images' });
    }
});

// Modify the get images API to respect order
app.get('/api/images/:layer', (req, res) => {
    const layer = req.params.layer;
    let imagesDir;

    // Determine the correct directory based on the layer
    if (layer === 'layer1' || layer === 'layer2') {
        imagesDir = path.join(__dirname, 'images', layer);
    } else if (layer === 'background') {
        imagesDir = path.join(__dirname, 'images', 'background');
    } else if (layer === 'music') {
        imagesDir = path.join(__dirname, 'music');
    } else {
        return res.status(400).json({ error: 'Invalid layer parameter' });
    }

    try {
        // Check if directory exists
        if (!fs.existsSync(imagesDir)) {
            return res.json({ images: [] });
        }

        // Get all files in the directory
        let files = fs.readdirSync(imagesDir)
            .filter(file => {
                // Filter based on file type
                if (layer === 'layer1' || layer === 'layer2' || layer === 'background') {
                    return file.match(/\.(png|jpg|jpeg|gif|webp)$/i);
                } else if (layer === 'music') {
                    return file.match(/\.(mp3|wav|ogg)$/i);
                }
                return false;
            });

        // Check if a custom order exists
        const orderFilePath = path.join(__dirname, `${layer}_order.json`);
        if (fs.existsSync(orderFilePath)) {
            try {
                const orderData = JSON.parse(fs.readFileSync(orderFilePath, 'utf8'));

                if (orderData.order && Array.isArray(orderData.order)) {
                    // Create a map for O(1) lookup to check if files exist in the directory
                    const fileMap = new Set(files);

                    // Filter the order to only include files that actually exist
                    const validOrderedFiles = orderData.order.filter(file => fileMap.has(file));

                    // Find files that are in the directory but not in the order
                    const unorderedFiles = files.filter(file => !orderData.order.includes(file));

                    // Combine ordered files with any new files that aren't in the order yet
                    files = [...validOrderedFiles, ...unorderedFiles];
                }
            } catch (error) {
                console.error('Error reading image order:', error);
                // If there's an error reading the order, just use the default order
            }
        }

        res.json({ images: files });
    } catch (error) {
        console.error('Error getting images:', error);
        res.status(500).json({ error: 'Failed to get images' });
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
        const settings = req.body.settings;

        // Validate required fields
        if (!settings || !settings.title) {
            return res.status(400).send('Invalid settings data');
        }

        // Ensure all color fields exist
        if (!settings.subtitleColor) settings.subtitleColor = '#000000';
        if (!settings.subtextColor) settings.subtextColor = '#000000';
        if (!settings.buttonColor) settings.buttonColor = '#ffffff';
        if (!settings.buttonTextColor) settings.buttonTextColor = '#000000';
        if (!settings.downloadBtnColor) settings.downloadBtnColor = '#1f78cc';
        if (!settings.downloadBtnTextColor) settings.downloadBtnTextColor = '#ffffff';

        // Save settings to file
        fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving site settings:', error);
        res.status(500).send('Failed to save settings');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoint: /api/nft/:tokenId`);
    console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});

// Contributors API endpoints
app.get('/api/contributors', (req, res) => {
    try {
        // Check if contributors file exists
        const contributorsPath = path.join(__dirname, 'contributors.json');
        if (fs.existsSync(contributorsPath)) {
            const contributorsData = fs.readFileSync(contributorsPath, 'utf8');
            const contributors = JSON.parse(contributorsData);
            res.json(contributors);
        } else {
            // Return default contributors data
            const defaultContributors = {
                developers: [
                    {
                        xAccount: '@ordinarino35380',
                        name: '@ordinarino35380',
                        role: 'Developer',
                        image: '/images/contributors/image3.png'
                    },
                    {
                        xAccount: '@MerloOfficial',
                        name: '@MerloOfficial',
                        role: 'Developer',
                        image: '/images/contributors/image2.png'
                    }
                ],
                contributors: [
                    {
                        xAccount: '@Franku271',
                        name: '@Franku271',
                        role: 'Artist/Developer',
                        image: '/images/contributors/image1.png'
                    },
                    {
                        xAccount: '@BetterBen33',
                        name: '@BetterBen33',
                        role: 'Artist/Developer',
                        image: '/images/contributors/image4.png'
                    }
                ]
            };
            res.json(defaultContributors);
        }
    } catch (error) {
        console.error('Error getting contributors:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/contributors', (req, res) => {
    try {
        const contributors = req.body.contributors;

        console.log('Received contributors data:', JSON.stringify(contributors, null, 2));

        // Validate the data
        if (!contributors || !Array.isArray(contributors.developers) || !Array.isArray(contributors.contributors)) {
            console.error('Invalid contributors data structure:', contributors);
            return res.status(400).json({ error: 'Invalid contributors data structure' });
        }

        // Process image data (convert base64 to files)
        processContributorImages(contributors.developers);
        processContributorImages(contributors.contributors);

        // Save contributors to file
        fs.writeFileSync('./contributors.json', JSON.stringify(contributors, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving contributors:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to process contributor images
function processContributorImages(contributors) {
    const contributorsDir = path.join(__dirname, 'images', 'contributors');

    // Ensure directory exists
    if (!fs.existsSync(contributorsDir)) {
        fs.mkdirSync(contributorsDir, { recursive: true });
    }

    contributors.forEach((contributor, index) => {
        // Check if the image is a base64 data URL
        if (contributor.image && contributor.image.startsWith('data:image')) {
            // Extract the base64 data
            const matches = contributor.image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);

            if (matches && matches.length === 3) {
                const imageType = matches[1];
                const imageData = matches[2];
                const buffer = Buffer.from(imageData, 'base64');

                // Generate a filename
                const filename = `contributor_${index + 1}.${imageType}`;
                const filePath = path.join(contributorsDir, filename);

                // Save the file
                fs.writeFileSync(filePath, buffer);

                // Update the contributor object with the file path
                contributor.image = `/images/contributors/${filename}`;
            }
        }
    });
}