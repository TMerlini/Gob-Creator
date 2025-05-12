// Global variables for shapes
let layer1 = { images: [], currentImageIndex: 0, aspectRatio: 1, isCustomImage: false };
let layer2 = { images: [], currentImageIndex: 0, aspectRatio: 1, x: 0, y: 0, scale: 0.2, angle: 0, isFlipped: false, isDragging: false };
let isResizing = false;
let isRotating = false;
let startX, startY;
let lastX, lastY;
let startAngle = 0;
let startDistance = 0;
let startScale = 0.2;

// Set up global variables
let downloadBtn;
let canvas;
let ctx;
let flipBtn;

// Global settings
let DISPLAY_GRID = false;
let SNAP_TO_GRID = false;
let GRID_SIZE = 10;

// Initialize the canvas when the page loads
function initCanvas() {
    canvas = document.getElementById('canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');

    // Responsive canvas sizing based on viewport
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Set up event listeners for canvas interactions
    setupCanvasListeners();

    // Set up event listeners for UI controls
    setupUIControls();

    // Load images
    loadImages();

    // Setup main loop
    setInterval(drawLayers, 1000 / 60); // 60 FPS
}

// Resize canvas based on window size
function resizeCanvas() {
    if (!canvas) return;

    // Get current transform to restore after resize
    let currentTransform = ctx ? ctx.getTransform() : null;

    // Set canvas dimensions
    const size = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.7);
    canvas.width = size;
    canvas.height = size;

    // Restore transform if it existed
    if (currentTransform) {
        ctx.setTransform(currentTransform);
    }

    // Draw layers after resize
    if (ctx) {
        drawLayers();
    }
}

// Setup canvas interaction listeners
function setupCanvasListeners() {
    // Mouse down event
    canvas.addEventListener('mousedown', function(e) {
        handleMouseDown(e);
    });

    // Touch start event
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        handleMouseDown(mouseEvent);
    });

    // Mouse move event
    window.addEventListener('mousemove', function(e) {
        handleMouseMove(e);
    });

    // Touch move event
    window.addEventListener('touchmove', function(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            handleMouseMove(mouseEvent);
        } else if (e.touches.length === 2) {
            // Pinch to resize/rotate
            handleTouchPinch(e);
        }
    });

    // Mouse up event
    window.addEventListener('mouseup', function() {
        handleMouseUp();
    });

    // Touch end event
    window.addEventListener('touchend', function() {
        handleMouseUp();
    });
}

// Setup UI control listeners
function setupUIControls() {
    // Previous and Next buttons for Layer 1
    document.getElementById('prevLayer1').addEventListener('click', () => {
        prevImage(1);
    });

    document.getElementById('nextLayer1').addEventListener('click', () => {
        nextImage(1);
    });

    // Previous and Next buttons for Layer 2
    document.getElementById('prevLayer2').addEventListener('click', () => {
        prevImage(2);
    });

    document.getElementById('nextLayer2').addEventListener('click', () => {
        nextImage(2);
    });

    // Download button
    downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            downloadImage();
        });
    }

    // Flip button
    flipBtn = document.querySelector('.flip-btn');
    if (flipBtn) {
        flipBtn.addEventListener('click', () => {
            if (layer2) {
                layer2.isFlipped = !layer2.isFlipped;
                drawLayers();
            }
        });
    }

    // Center hat button
    const centerHatBtn = document.getElementById('centerHatBtn');
    if (centerHatBtn) {
        centerHatBtn.addEventListener('click', centerLayer2);
    }

    // Grid toggle
    const gridToggle = document.getElementById('gridToggle');
    if (gridToggle) {
        gridToggle.addEventListener('change', function() {
            DISPLAY_GRID = this.checked;
            drawLayers();
        });
    }

    // Snap to grid toggle
    const snapToggle = document.getElementById('snapToggle');
    if (snapToggle) {
        snapToggle.addEventListener('change', function() {
            SNAP_TO_GRID = this.checked;
            drawLayers();
        });
    }

    // Play music button
    const playMusicBtn = document.getElementById('playMusicBtn');
    if (playMusicBtn) {
        playMusicBtn.addEventListener('click', function() {
            const bgMusic = document.getElementById('bgMusic');
            if (bgMusic.paused) {
                bgMusic.play();
                this.textContent = 'Pause Music';
            } else {
                bgMusic.pause();
                this.textContent = 'Play Music';
            }
        });
    }
}

// Mouse down handler
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    lastX = mouseX;
    lastY = mouseY;

    // Check if we're in the resize handle
    if (isInResizeHandle(mouseX, mouseY)) {
        isResizing = true;
        startDistance = Math.sqrt(Math.pow(mouseX - (layer2.x + layer2.images[layer2.currentImageIndex].width * layer2.scale / 2), 2) + 
                                 Math.pow(mouseY - (layer2.y + layer2.images[layer2.currentImageIndex].height * layer2.scale / 2), 2));
        startScale = layer2.scale;
        return;
    }

    // Check if we're in the rotate handle
    if (isInRotateHandle(mouseX, mouseY)) {
        isRotating = true;
        const centerX = layer2.x + layer2.images[layer2.currentImageIndex].width * layer2.scale / 2;
        const centerY = layer2.y + layer2.images[layer2.currentImageIndex].height * layer2.scale / 2;
        startAngle = Math.atan2(mouseY - centerY, mouseX - centerX) - layer2.angle;
        return;
    }

    // Check if we're in the flip handle
    if (isInFlipHandle(mouseX, mouseY)) {
        layer2.isFlipped = !layer2.isFlipped;
        drawLayers();
        return;
    }

    // Check if we're clicking on layer2
    if (isPointInLayer2(mouseX, mouseY)) {
        layer2.isDragging = true;
        startX = mouseX - layer2.x;
        startY = mouseY - layer2.y;
    }
}

// Mouse move handler
function handleMouseMove(e) {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Update cursor based on what's under it
    updateCursor(mouseX, mouseY);

    // Handle resizing
    if (isResizing && layer2.images.length > 0) {
        const centerX = layer2.x + layer2.images[layer2.currentImageIndex].width * layer2.scale / 2;
        const centerY = layer2.y + layer2.images[layer2.currentImageIndex].height * layer2.scale / 2;
        const currentDistance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
        const scaleFactor = currentDistance / startDistance;
        layer2.scale = startScale * scaleFactor;

        // Constrain scale
        if (layer2.scale < 0.05) layer2.scale = 0.05;
        if (layer2.scale > 2) layer2.scale = 2;

        drawLayers();
        return;
    }

    // Handle rotating
    if (isRotating && layer2.images.length > 0) {
        const centerX = layer2.x + layer2.images[layer2.currentImageIndex].width * layer2.scale / 2;
        const centerY = layer2.y + layer2.images[layer2.currentImageIndex].height * layer2.scale / 2;
        const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
        layer2.angle = angle - startAngle;
        drawLayers();
        return;
    }

    // Handle dragging
    if (layer2.isDragging) {
        let newX = mouseX - startX;
        let newY = mouseY - startY;

        // Apply snap to grid if enabled
        if (SNAP_TO_GRID) {
            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        }

        layer2.x = newX;
        layer2.y = newY;

        drawLayers();
    }

    lastX = mouseX;
    lastY = mouseY;
}

// Mouse up handler
function handleMouseUp() {
    layer2.isDragging = false;
    isResizing = false;
    isRotating = false;
}

// Handle touch pinch (two-finger) gesture
function handleTouchPinch(e) {
    if (e.touches.length !== 2) return;

    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    const rect = canvas.getBoundingClientRect();
    const x1 = (touch1.clientX - rect.left) * (canvas.width / rect.width);
    const y1 = (touch1.clientY - rect.top) * (canvas.height / rect.height);
    const x2 = (touch2.clientX - rect.left) * (canvas.width / rect.width);
    const y2 = (touch2.clientY - rect.top) * (canvas.height / rect.height);

    // Calculate distance between touches
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    // If we haven't started resizing yet
    if (!isResizing) {
        isResizing = true;
        startDistance = distance;
        startScale = layer2.scale;
    } else {
        // Adjust scale based on pinch
        const scaleFactor = distance / startDistance;
        layer2.scale = startScale * scaleFactor;

        // Constrain scale
        if (layer2.scale < 0.05) layer2.scale = 0.05;
        if (layer2.scale > 2) layer2.scale = 2;
    }

    // Calculate angle for rotation
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // If we haven't started rotating yet
    if (!isRotating) {
        isRotating = true;
        startAngle = angle - layer2.angle;
    } else {
        // Adjust rotation
        layer2.angle = angle - startAngle;
    }

    drawLayers();
}

// Update cursor based on what's under the mouse
function updateCursor(mouseX, mouseY) {
    if (isInResizeHandle(mouseX, mouseY)) {
        canvas.style.cursor = 'nwse-resize';
    } else if (isInRotateHandle(mouseX, mouseY)) {
        canvas.style.cursor = 'grab';
    } else if (isInFlipHandle(mouseX, mouseY)) {
        canvas.style.cursor = 'pointer';
    } else if (isPointInLayer2(mouseX, mouseY)) {
        canvas.style.cursor = 'move';
    } else {
        canvas.style.cursor = 'default';
    }
}

// Check if point is in resize handle
function isInResizeHandle(x, y) {
    if (!layer2.images.length) return false;

    const img = layer2.images[layer2.currentImageIndex];
    const handleSize = 20;
    const handleX = layer2.x + img.width * layer2.scale - handleSize / 2;
    const handleY = layer2.y + img.height * layer2.scale - handleSize / 2;

    return x >= handleX && x <= handleX + handleSize && y >= handleY && y <= handleY + handleSize;
}

// Check if point is in rotate handle
function isInRotateHandle(x, y) {
    if (!layer2.images.length) return false;

    const img = layer2.images[layer2.currentImageIndex];
    const handleSize = 20;
    const handleX = layer2.x + img.width * layer2.scale / 2;
    const handleY = layer2.y - handleSize / 2;

    return x >= handleX - handleSize / 2 && x <= handleX + handleSize / 2 && y >= handleY && y <= handleY + handleSize;
}

// Check if point is in flip handle
function isInFlipHandle(x, y) {
    if (!layer2.images.length) return false;

    const img = layer2.images[layer2.currentImageIndex];
    const handleSize = 20;
    const handleX = layer2.x - handleSize / 2;
    const handleY = layer2.y + img.height * layer2.scale / 2;

    return x >= handleX && x <= handleX + handleSize && y >= handleY - handleSize / 2 && y <= handleY + handleSize / 2;
}

// Check if point is in layer2
function isPointInLayer2(x, y) {
    if (!layer2.images.length) return false;

    // Transform the point to account for rotation
    const img = layer2.images[layer2.currentImageIndex];
    const centerX = layer2.x + img.width * layer2.scale / 2;
    const centerY = layer2.y + img.height * layer2.scale / 2;

    // Translate point to origin
    const translatedX = x - centerX;
    const translatedY = y - centerY;

    // Rotate point
    const rotatedX = translatedX * Math.cos(-layer2.angle) - translatedY * Math.sin(-layer2.angle);
    const rotatedY = translatedX * Math.sin(-layer2.angle) + translatedY * Math.cos(-layer2.angle);

    // Translate back
    const finalX = rotatedX + centerX;
    const finalY = rotatedY + centerY;

    // Check if point is in bounding box
    return finalX >= layer2.x && finalX <= layer2.x + img.width * layer2.scale && 
           finalY >= layer2.y && finalY <= layer2.y + img.height * layer2.scale;
}

// Load images for both layers
function loadImages() {
    // For demo purposes, hard-coded number of images to try loading
    const numImagesToTry = 50;

    // Load Layer 1 images
    loadLayerImages(1, numImagesToTry).then(() => {
        console.log("Layer 1 loading complete:");
        console.log("Successfully loaded: " + layer1.images.length + " images");
        console.log("Failed to load: " + (numImagesToTry - layer1.images.length) + " images");
        console.log("Total images in array: " + layer1.images.length);

        // If we have images, use the first one initially
        if (layer1.images.length > 0) {
            layer1.currentImageIndex = 0;

            // Update preview for layer 1
            updatePreviewForLayer(1);
        }
    });

    // Load Layer 2 images
    loadLayerImages(2, numImagesToTry).then(() => {
        console.log("Layer 2 loading complete:");
        console.log("Successfully loaded: " + layer2.images.length + " images");
        console.log("Failed to load: " + (numImagesToTry - layer2.images.length) + " images");
        console.log("Total images in array: " + layer2.images.length);

        // If we have images, use the first one initially
        if (layer2.images.length > 0) {
            layer2.currentImageIndex = 0;

            // Center layer2 initially
            centerLayer2();

            // Update preview for layer 2
            updatePreviewForLayer(2);
        }
    });

    // Load background images and set background
    loadBackground();
}

// Load images for a specific layer
function loadLayerImages(layerId, numImagesToTry) {
    const layerObj = layerId === 1 ? layer1 : layer2;
    const promises = [];

    for (let i = 1; i <= numImagesToTry; i++) {
        const image = new Image();
        image.crossOrigin = "Anonymous";
        const imageUrl = `images/layer${layerId}/image${i}.png`;

        const promise = new Promise((resolve) => {
            image.onload = function() {
                console.log(`Successfully loaded layer${layerId}/image${i}.png`);
                layerObj.images.push(image);
                resolve();
            };

            image.onerror = function() {
                console.log(`Failed to load layer${layerId}/image${i}.png`);
                resolve();
            };
        });

        image.src = imageUrl;
        promises.push(promise);
    }

    return Promise.all(promises);
}

// Load background images and set body background
async function loadBackground() {
    try {
        // Try to fetch uploaded backgrounds
        const response = await fetch('/api/images/background');
        if (response.ok) {
            const data = await response.json();
            console.log("Found uploaded backgrounds:", data);

            if (data.images && data.images.length > 0) {
                // Try multiple paths that might work for backgrounds
                const possiblePaths = [
                    `/images/background/${data.images[0]}`,
                    `/images/background/${data.images[0].replace('.gif', '.png')}`,
                    `/images/background/background.gif`,
                    `/background/background.gif`,
                    `background/background.gif`,
                    `/images/background/background.png`,
                    `/images/background/background.jpg`,
                    `/images/background/background.jpeg`
                ];

                console.log("Trying to load background from these paths:", possiblePaths);

                // Try each path
                for (const path of possiblePaths) {
                    try {
                        const img = new Image();
                        img.src = path;
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                        });

                        // If we made it here, the image loaded
                        document.body.style.backgroundImage = `url('${path}')`;
                        return;
                    } catch (err) {
                        // Image failed to load, try the next one
                        continue;
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error loading background:", error);
    }

    // Use default if all other options failed
    console.log('All background images failed to load, using fallback');
    document.body.style.backgroundImage = "url('background/background.gif')";
}

function centerLayer2() {
    if (!layer2.images.length || !layer1.images.length) return;

    const img1 = layer1.images[layer1.currentImageIndex];
    const img2 = layer2.images[layer2.currentImageIndex];

    // Center layer2 on layer1
    layer2.x = (canvas.width - img2.width * layer2.scale) / 2;
    layer2.y = (canvas.height - img2.height * layer2.scale) / 3;

    // Reset angle and scale
    layer2.angle = 0;
    layer2.scale = 0.2;

    drawLayers();
}

// Previous image for specified layer
function prevImage(layerId) {
    const layer = layerId === 1 ? layer1 : layer2;

    if (layer.images.length <= 1) return;

    layer.currentImageIndex--;
    if (layer.currentImageIndex < 0) {
        layer.currentImageIndex = layer.images.length - 1;
    }

    updatePreviewForLayer(layerId);

    // Reset angle if switching layer2 image
    if (layerId === 2) {
        layer2.angle = 0;
    }

    drawLayers();
}

// Next image for specified layer
function nextImage(layerId) {
    const layer = layerId === 1 ? layer1 : layer2;

    if (layer.images.length <= 1) return;

    layer.currentImageIndex++;
    if (layer.currentImageIndex >= layer.images.length) {
        layer.currentImageIndex = 0;
    }

    updatePreviewForLayer(layerId);

    // Reset angle if switching layer2 image
    if (layerId === 2) {
        layer2.angle = 0;
    }

    drawLayers();
}

// Update preview image for the specified layer
function updatePreviewForLayer(layerId) {
    const layer = layerId === 1 ? layer1 : layer2;
    const previewId = `layer${layerId}Preview`;

    if (!layer.images.length) return;

    const previewContainer = document.getElementById(previewId);
    if (!previewContainer) return;

    // Clear existing content
    previewContainer.innerHTML = '';

    // Create new preview image
    const previewImg = document.createElement('img');
    previewImg.classList.add('preview-image');
    previewImg.alt = `Layer ${layerId} Preview`;

    const currentImage = layer.images[layer.currentImageIndex];
    previewImg.src = currentImage.src;

    previewContainer.appendChild(previewImg);

    console.log(`Updated preview for layer ${layerId} with image: ${currentImage.src}`);
}

// Draw all layers to the canvas
function drawLayers() {
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (DISPLAY_GRID) {
        drawGrid();
    }

    // Draw layer 1 (always centered and fixed)
    if (layer1.images.length > 0) {
        const img = layer1.images[layer1.currentImageIndex];
        const scale = 0.8;
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }

    // Draw layer 2 (movable, resizable)
    if (layer2.images.length > 0) {
        const img = layer2.images[layer2.currentImageIndex];

        ctx.save();

        // Set up transform for rotation around center
        const centerX = layer2.x + img.width * layer2.scale / 2;
        const centerY = layer2.y + img.height * layer2.scale / 2;

        ctx.translate(centerX, centerY);
        ctx.rotate(layer2.angle);

        // Apply flip if needed
        if (layer2.isFlipped) {
            ctx.scale(-1, 1);
        }

        // Draw the image with translation and scaling
        ctx.drawImage(
            img, 
            -img.width * layer2.scale / 2, 
            -img.height * layer2.scale / 2,
            img.width * layer2.scale,
            img.height * layer2.scale
        );

        // Draw handles
        drawHandles();

        ctx.restore();
    }
}

// Draw control handles for layer 2
function drawHandles() {
    if (!layer2.images.length) return;

    const img = layer2.images[layer2.currentImageIndex];
    const handleSize = 10;

    // Draw resize handle (bottom-right corner)
    ctx.fillStyle = '#3498db';
    ctx.fillRect(
        img.width * layer2.scale / 2 - handleSize / 2,
        img.height * layer2.scale / 2 - handleSize / 2,
        handleSize,
        handleSize
    );

    // Draw rotate handle (top center)
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(
        0,
        -img.height * layer2.scale / 2,
        handleSize / 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Draw flip handle (left center)
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(
        -img.width * layer2.scale / 2,
        0,
        handleSize / 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Draw grid on canvas
function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    ctx.restore();
}

// Download the current canvas as an image
function downloadImage() {
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');

    // Match the new base size
    exportCanvas.width = 800;  // Reduced from 1500
    exportCanvas.height = 800;

    // Clear the export canvas
    exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw layer 1 (scaled for export)
    if (layer1.images.length > 0) {
        const img = layer1.images[layer1.currentImageIndex];
        const scale = 0.8 * (exportCanvas.width / canvas.width);
        const x = (exportCanvas.width - img.width * scale) / 2;
        const y = (exportCanvas.height - img.height * scale) / 2;

        exportCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }

    // Draw layer 2 (scaled for export)
    if (layer2.images.length > 0) {
        const img = layer2.images[layer2.currentImageIndex];

        // Scale factors for export
        const scaleRatio = exportCanvas.width / canvas.width;

        exportCtx.save();

        // Calculate the scaled position
        const scaledX = layer2.x * scaleRatio;
        const scaledY = layer2.y * scaleRatio;
        const scaledImgScale = layer2.scale * scaleRatio;

        // Set up transform for rotation around center
        const centerX = scaledX + img.width * scaledImgScale / 2;
        const centerY = scaledY + img.height * scaledImgScale / 2;

        exportCtx.translate(centerX, centerY);
        exportCtx.rotate(layer2.angle);

        // Apply flip if needed
        if (layer2.isFlipped) {
            exportCtx.scale(-1, 1);
        }

        // Draw the image with translation and scaling
        exportCtx.drawImage(
            img, 
            -img.width * scaledImgScale / 2, 
            -img.height * scaledImgScale / 2,
            img.width * scaledImgScale,
            img.height * scaledImgScale
        );

        exportCtx.restore();
    }

    // Create download link
    const link = document.createElement('a');
    link.download = 'my-ordinarinos.png';
    link.href = exportCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Update all layer previews
function updatePreviews() {
    if (layer1.images.length > 0) {
        updatePreviewForLayer(1);
    }

    if (layer2.images.length > 0) {
        updatePreviewForLayer(2);
    }

    // Print layer content for debugging
    console.log("Layer 1 images:");
    for (let i = 0; i < layer1.images.length; i++) {
        console.log(`Image ${i+1}: ${layer1.images[i].src}`);
    }

    console.log("Layer 2 images:");
    for (let i = 0; i < layer2.images.length; i++) {
        console.log(`Image ${i+1}: ${layer2.images[i].src}`);
    }
}

// Add image optimization before upload
function optimizeImage(img) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Set dimensions (limit max size)
    const maxDimension = 800;
    let width = img.width;
    let height = img.height;

    if (width > maxDimension || height > maxDimension) {
        if (width > height) {
            height = height * (maxDimension / width);
            width = maxDimension;
        } else {
            width = width * (maxDimension / height);
            height = maxDimension;
        }
    }

    tempCanvas.width = width;
    tempCanvas.height = height;

    // Draw and compress
    tempCtx.drawImage(img, 0, 0, width, height);
    return tempCanvas.toDataURL('image/png', 0.85); // Adjust quality as needed
}

// Helper function for delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const RATE_LIMIT_DELAY = 500;

// Function to fetch site settings
async function fetchSiteSettings() {
    try {
        const response = await fetch('/api/site-settings');
        if (response.ok) {
            return await response.json();
        }
        console.error('Failed to fetch site settings');
        return null;
    } catch (error) {
        console.error('Error fetching site settings:', error);
        return null;
    }
}

// Function to fetch contributors
async function fetchContributors() {
    try {
        const response = await fetch('/api/contributors');
        if (response.ok) {
            return await response.json();
        }
        console.error('Failed to fetch contributors');
        return null;
    } catch (error) {
        console.error('Error fetching contributors:', error);
        return null;
    }
}

// Function to fetch donation settings
async function fetchDonationSettings() {
    try {
        const response = await fetch('/api/donation-settings');
        if (response.ok) {
            return await response.json();
        }
        console.error('Failed to fetch donation settings');
        return null;
    } catch (error) {
        console.error('Error fetching donation settings:', error);
        return null;
    }
}

// Function to load and play background music
function setupBackgroundMusic() {
    const musicPlayer = document.getElementById('bgMusic');
    const playButton = document.getElementById('playMusicBtn');

    if (musicPlayer && playButton) {
        playButton.addEventListener('click', function() {
            if (musicPlayer.paused) {
                musicPlayer.volume = 0.3; // Lower volume
                musicPlayer.play().then(() => {
                    playButton.textContent = 'Pause Music';
                }).catch(error => {
                    console.error('Error playing music:', error);
                });
            } else {
                musicPlayer.pause();
                playButton.textContent = 'Play Music';
            }
        });
    }
}

// Set up donation buttons
async function setupDonationButtons() {
    try {
        const donationSettings = await fetchDonationSettings();
        if (!donationSettings) return;

        const donationContainer = document.getElementById('donationContainer');
        if (!donationContainer) return;

        const btcBtn = document.getElementById('btcDonateBtn');
        const ethBtn = document.getElementById('ethDonateBtn');
        const solBtn = document.getElementById('solBtn');

        if (btcBtn && donationSettings.settings.bitcoinAddress) {
            btcBtn.addEventListener('click', () => {
                copyToClipboard(donationSettings.settings.bitcoinAddress);
                showNotification('Bitcoin address copied to clipboard!');
            });
        }

        if (ethBtn && donationSettings.settings.ethereumAddress) {
            ethBtn.addEventListener('click', () => {
                copyToClipboard(donationSettings.settings.ethereumAddress);
                showNotification('Ethereum address copied to clipboard!');
            });
        }

        if (solBtn && donationSettings.settings.solanaAddress) {
            solBtn.addEventListener('click', () => {
                copyToClipboard(donationSettings.settings.solanaAddress);
                showNotification('Solana address copied to clipboard!');
            });
        }
    } catch (error) {
        console.error('Error setting up donation buttons:', error);
    }
}

// Helper function to copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show a temporary notification
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '1000';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.textContent = 'Copied to clipboard!';
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Show notification message
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Load and display site settings on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Fetch site settings
        const siteSettings = await fetchSiteSettings();
        if (siteSettings && siteSettings.settings) {
            // Apply site title and subtitle
            if (siteSettings.settings.title) {
                document.title = siteSettings.settings.title;
                const titleElement = document.getElementById('siteTitle');
                if (titleElement) titleElement.textContent = siteSettings.settings.title;
            }

            if (siteSettings.settings.subtitle) {
                const subtitleElement = document.getElementById('siteSubtitle');
                if (subtitleElement) {
                    subtitleElement.textContent = siteSettings.settings.subtitle;
                    if (siteSettings.settings.subtitleColor) {
                        subtitleElement.style.color = siteSettings.settings.subtitleColor;
                    }
                }
            }

            if (siteSettings.settings.subtext) {
                const subtextElement = document.getElementById('siteSubtext');
                if (subtextElement) {
                    subtextElement.textContent = siteSettings.settings.subtext;
                    if (siteSettings.settings.subtextColor) {
                        subtextElement.style.color = siteSettings.settings.subtextColor;
                    }
                }
            }

             // Apply button colors
            if (siteSettings.settings.buttonColor) {
                const buttons = document.querySelectorAll('.layer-row, .preview-btn, .rotation-control, .flip-btn');
                buttons.forEach(button => {
                    button.style.backgroundColor = siteSettings.settings.buttonColor;

                     if (siteSettings.settings.buttonTextColor) {
                       button.style.color = siteSettings.settings.buttonTextColor;
                     }
                });
            }

             // Apply download button colors
            if (siteSettings.settings.downloadBtnColor) {
                const downloadBtn = document.getElementById('downloadBtn');
                if (downloadBtn) {
                    downloadBtn.style.backgroundColor = siteSettings.settings.downloadBtnColor;

                     if (siteSettings.settings.downloadBtnTextColor) {
                       downloadBtn.style.color = siteSettings.settings.downloadBtnTextColor;
                     }
                }
            }
        }

        // Fetch and display contributors
        const contributors = await fetchContributors();
        if (contributors) {
            displayContributors(contributors);
        }
    } catch (error) {
        console.error('Error loading site settings or contributors:', error);
    }
});

// Function to display contributors
function displayContributors(contributors) {
    const contributorsContainer = document.getElementById('contributorsContainer');
    if (!contributorsContainer) return;

    // Clear existing content
    contributorsContainer.innerHTML = '';

    // Check if contributors is null or undefined
    if (!contributors) {
        console.warn('Contributors data is null or undefined.');
        return;
    }

    // Check if contributors is an array
    if (!Array.isArray(contributors)) {
        console.warn('Contributors data is not an array.');
        return;
    }

    // Iterate through contributors and create elements
    contributors.forEach(contributor => {
        const contributorDiv = document.createElement('div');
        contributorDiv.className = 'contributor';

        // Check for valid avatar URL
        if (contributor.avatar_url) {
            const avatarImg = document.createElement('img');
            avatarImg.src = contributor.avatar_url;
            avatarImg.alt = contributor.login;
            avatarImg.style.width = '50px';
            avatarImg.style.height = '50px';
            avatarImg.style.borderRadius = '50%';
            contributorDiv.appendChild(avatarImg);
        }

        // Add login name
        const loginSpan = document.createElement('span');
        loginSpan.textContent = contributor.login;
        contributorDiv.appendChild(loginSpan);

        // Check for valid URL
        if (contributor.html_url) {
            const profileLink = document.createElement('a');
            profileLink.href = contributor.html_url;
            profileLink.textContent = 'View Profile';
            profileLink.target = '_blank'; // Open in new tab
            contributorDiv.appendChild(profileLink);
        }

        contributorsContainer.appendChild(contributorDiv);
    });
}

// Call fetchSiteSettings, fetchContributors, and fetchDonationSettings on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
    // Setup site settings
    await fetchSiteSettings();

    // Setup contributors
    await fetchContributors();

    // Setup donation buttons
    await setupDonationButtons();

    // Setup background music
    setupBackgroundMusic();
});

// Call updatePreviews initially to ensure all previews start with the correct images
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        updatePreviews();
    }, 500); // Short delay to ensure images are loaded
});

// Init canvas size
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
});