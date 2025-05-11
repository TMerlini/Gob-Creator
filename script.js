const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// Set fixed dimensions
canvas.width = 1500;
canvas.height = 1500;

// Prevent default touch behaviors
document.body.addEventListener('touchstart', function(e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener('touchmove', function(e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

// Simplified touch handlers
function handleTouchStart(e) {
    const rect = canvas.getBoundingClientRect();
    
    // Handle pinch gesture (2 fingers)
    if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // Convert touch positions to canvas coordinates
        const touch1X = (touch1.clientX - rect.left) * (canvas.width / rect.width);
        const touch1Y = (touch1.clientY - rect.top) * (canvas.height / rect.height);
        
        // Check if at least one touch is on layer2
        const img2 = layer2.getCurrentImage();
        if (img2) {
            const originalAspectRatio = img2.width / img2.height;
            const baseSize = canvas.width * layer2.scale;
            const scaledWidth = originalAspectRatio > 1 ? baseSize : baseSize * originalAspectRatio;
            const scaledHeight = originalAspectRatio > 1 ? baseSize / originalAspectRatio : baseSize;
            
            if (touch1X >= layer2.x && 
                touch1X <= layer2.x + scaledWidth && 
                touch1Y >= layer2.y && 
                touch1Y <= layer2.y + scaledHeight) {
                isPinching = true;
                selectedLayer = layer2;
                initialTouchDistance = getTouchDistance(touch1, touch2);
                initialScale = layer2.scale;
                e.preventDefault();
                return;
            }
        }
    }
    
    // Handle single touch (moving)
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const canvasX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const canvasY = (touch.clientY - rect.top) * (canvas.height / rect.height);
        
        const img2 = layer2.getCurrentImage();
        if (img2) {
            const originalAspectRatio = img2.width / img2.height;
            const baseSize = canvas.width * layer2.scale;
            const scaledWidth = originalAspectRatio > 1 ? baseSize : baseSize * originalAspectRatio;
            const scaledHeight = originalAspectRatio > 1 ? baseSize / originalAspectRatio : baseSize;
            
            if (canvasX >= layer2.x && 
                canvasX <= layer2.x + scaledWidth && 
                canvasY >= layer2.y && 
                canvasY <= layer2.y + scaledHeight) {
                isDragging = true;
                selectedLayer = layer2;
                dragStartX = canvasX - layer2.x;
                dragStartY = canvasY - layer2.y;
            }
        }
    }

    // Check for flip handle
    if (selectedLayer === layer2 && isInFlipHandle(canvasX, canvasY)) {
        layer2.isFlipped = !layer2.isFlipped;
        drawLayers();
        e.preventDefault();
        return;
    }

    e.preventDefault();
}

function handleTouchMove(e) {
    // Handle pinch gesture
    if (isPinching && e.touches.length === 2) {
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scaleFactor = currentDistance / initialTouchDistance;
        
        // Calculate new scale based on the initial scale and pinch gesture
        let newScale = initialScale * scaleFactor;
        
        // Constrain scale between 0.1 and 1.0
        newScale = Math.max(0.1, Math.min(1.0, newScale));
        
        layer2.scale = newScale;
        drawLayers();
        e.preventDefault();
        return;
    }
    
    // Handle dragging
    if (isDragging && selectedLayer && e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const currentX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const currentY = (touch.clientY - rect.top) * (canvas.height / rect.height);
        
        const img2 = layer2.getCurrentImage();
        if (img2) {
            const originalAspectRatio = img2.width / img2.height;
            const baseSize = canvas.width * layer2.scale;
            const scaledWidth = originalAspectRatio > 1 ? baseSize : baseSize * originalAspectRatio;
            const scaledHeight = originalAspectRatio > 1 ? baseSize / originalAspectRatio : baseSize;
            
            let newX = currentX - dragStartX;
            let newY = currentY - dragStartY;
            
            newX = Math.max(0, Math.min(newX, canvas.width - scaledWidth));
            newY = Math.max(0, Math.min(newY, canvas.height - scaledHeight));
            
            selectedLayer.x = newX;
            selectedLayer.y = newY;
            drawLayers();
        }
    }
    e.preventDefault();
}

function handleTouchEnd(e) {
    isDragging = false;
    isPinching = false;
    if (e.touches.length === 0) {
        selectedLayer = null;
    }
    e.preventDefault();
}

// Update event listeners
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

// Set canvas size with proper scaling
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    // Set canvas size to match container while maintaining 1:1 aspect ratio
    const size = Math.min(containerWidth, containerHeight);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    
    // Set actual canvas dimensions (for rendering)
    canvas.width = 1500;  // Fixed internal size
    canvas.height = 1500;
}

// Initial resize
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Layer class with proportional scaling
class Layer {
    constructor(id) {
        this.id = id;
        this.images = [];
        this.originalImages = [];
        this.currentImageIndex = 0;
        this.x = 0;
        this.y = 0;
        this.width = 800;  // Updated to match new canvas size
        this.height = 800;
        this.scale = id === 2 ? 0.4 : 1;
        this.aspectRatio = 1;
        this.isCustomImage = false;
        this.isFlipped = false;
        this.rotation = 0;
        
        // Clear any cached image for Layer 1 on page load
        if (id === 1) {
            localStorage.removeItem('layer1CustomImage');
            this.imageCount = 3; // Layer 1 keeps fixed count
        }
        
        this.loadImages();
    }

    loadCachedImage(cachedData) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            this.images = [img];
            this.currentImageIndex = 0;
            this.aspectRatio = img.width / img.height;
            this.isCustomImage = true;
            drawLayers();
            updatePreviews();
        };
        img.src = cachedData;
    }

    resetToOriginal() {
        this.images = [...this.originalImages];
        this.isCustomImage = false;
        this.currentImageIndex = 0;
        localStorage.removeItem('layer1CustomImage');
        drawLayers();
        updatePreviews();
    }

    nextImage() {
        if (this.id === 1 && this.isCustomImage) {
            this.resetToOriginal();
            return;
        }
        if (this.images.length > 0) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
            drawLayers();
            updatePreviews();
        }
    }

    previousImage() {
        if (this.id === 1 && this.isCustomImage) {
            this.resetToOriginal();
            return;
        }
        if (this.images.length > 0) {
            this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
            drawLayers();
            updatePreviews();
        }
    }

    loadImages() {
        if (this.id === 1) {
            // Layer 1 keeps its original fixed loading
            for (let i = 1; i <= this.imageCount; i++) {
                this.loadSingleImage(i);
            }
        } else {
            // New improved loading for Layer 2
            const maxImages = 200; // Increase this number to match your total images
            let loadedCount = 0;
            let errors = 0;

            const preloadImage = (index) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    
                    img.onload = () => {
                        console.log(`Successfully loaded image${index}.png`);
                        this.images[index - 1] = img;
                        this.originalImages[index - 1] = img;
                        loadedCount++;
                        resolve(true);
                    };
                    
                    img.onerror = () => {
                        console.log(`Failed to load image${index}.png`);
                        errors++;
                        resolve(false);
                    };

                    const imagePath = `images/layer${this.id}/image${index}.png`;
                    img.src = imagePath;
                });
            };

            // Load all images concurrently
            const loadAllImages = async () => {
                const loadPromises = [];
                for (let i = 1; i <= maxImages; i++) {
                    loadPromises.push(preloadImage(i));
                }

                await Promise.all(loadPromises);
                
                // Clean up array by removing undefined entries
                this.images = this.images.filter(img => img);
                this.originalImages = this.originalImages.filter(img => img);
                
                console.log(`Layer ${this.id} loading complete:`);
                console.log(`Successfully loaded: ${loadedCount} images`);
                console.log(`Failed to load: ${errors} images`);
                console.log(`Total images in array: ${this.images.length}`);
                
                // Update display after loading
                if (this.images.length > 0) {
                    this.currentImageIndex = 0;
                    this.aspectRatio = this.images[0].width / this.images[0].height;
                    drawLayers();
                    updatePreviews();
                }
            };

            loadAllImages();
        }
    }

    loadSingleImage(index) {
        const img = new Image();
        img.onload = () => {
            if (index === 1) {
                this.aspectRatio = img.width / img.height;
            }
            this.images.push(img);
            this.originalImages.push(img);
            drawLayers();
            updatePreviews();
        };
        img.onerror = (err) => {
            console.error(`Failed to load image${index} for layer ${this.id}:`, err);
        };
        img.src = `images/layer${this.id}/image${index}.png`;
    }

    getCurrentImage() {
        return this.images[this.currentImageIndex];
    }

    // Add this helper method to check loaded images
    debugImages() {
        console.log(`Layer ${this.id} images:`);
        this.images.forEach((img, index) => {
            console.log(`Image ${index + 1}: ${img.src}`);
        });
    }
}

// Create layers
const layer1 = new Layer(1); // Static layer
const layer2 = new Layer(2); // Movable layer

// Variables for drag functionality
let isDragging = false;
let dragStartX, dragStartY;
let selectedLayer = null;

// Add these variables for resize handling
let isResizing = false;
let resizeStartX, resizeStartY;
const HANDLE_RADIUS = 8;

// Event listeners for layer 2 movement
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Check for flip handle first
    if (selectedLayer === layer2 && isInFlipHandle(mouseX, mouseY)) {
        layer2.isFlipped = !layer2.isFlipped;
        drawLayers();
        return;
    }

    // Get current Layer 2 dimensions
    const img2 = layer2.getCurrentImage();
    if (img2) {
        const originalAspectRatio = img2.width / img2.height;
        const baseSize = canvas.width * layer2.scale;
        let scaledWidth, scaledHeight;
        
        if (originalAspectRatio > 1) {
            scaledWidth = baseSize;
            scaledHeight = baseSize / originalAspectRatio;
        } else {
            scaledHeight = baseSize;
            scaledWidth = baseSize * originalAspectRatio;
        }

        // Check for resize handle first
        if (selectedLayer === layer2 && isInResizeHandle(mouseX, mouseY)) {
            isResizing = true;
            resizeStartX = mouseX;
            resizeStartY = mouseY;
            initialScale = layer2.scale;
            return;
        }

        // Check for regular dragging
        if (mouseX >= layer2.x && mouseX <= layer2.x + scaledWidth &&
            mouseY >= layer2.y && mouseY <= layer2.y + scaledHeight) {
            isDragging = true;
            selectedLayer = layer2;
            dragStartX = mouseX - layer2.x;
            dragStartY = mouseY - layer2.y;
        }
    }
    drawLayers();
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (isResizing && selectedLayer === layer2) {
        const dx = mouseX - resizeStartX;
        const dy = mouseY - resizeStartY;
        const maxDelta = Math.max(dx, dy);
        
        const newScale = layer2.scale + (maxDelta / canvas.width);
        layer2.scale = Math.max(0.1, Math.min(1.0, newScale));
        
        resizeStartX = mouseX;
        resizeStartY = mouseY;
        
        drawLayers();
    } else if (isDragging && selectedLayer) {
        const img2 = layer2.getCurrentImage();
        if (img2) {
            const originalAspectRatio = img2.width / img2.height;
            const baseSize = canvas.width * layer2.scale;
            let scaledWidth, scaledHeight;
            
            if (originalAspectRatio > 1) {
                scaledWidth = baseSize;
                scaledHeight = baseSize / originalAspectRatio;
            } else {
                scaledHeight = baseSize;
                scaledWidth = baseSize * originalAspectRatio;
            }

            let newX = mouseX - dragStartX;
            let newY = mouseY - dragStartY;
            
            newX = Math.max(0, Math.min(newX, canvas.width - scaledWidth));
            newY = Math.max(0, Math.min(newY, canvas.height - scaledHeight));

            selectedLayer.x = newX;
            selectedLayer.y = newY;

            drawLayers();
        }
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
});

// Add these variables after your existing declarations
let currentScale = 0.2; // Starting scale for layer 2
const MIN_SCALE = 0.1;
const MAX_SCALE = 1.0;
const SCALE_STEP = 0.02;

// Add keyboard controls for resizing Layer 2
window.addEventListener('keydown', (e) => {
    if (!selectedLayer || selectedLayer.id !== 2) return;

    switch(e.key) {
        case 'ArrowUp':
            // Increase size
            currentScale = Math.min(currentScale + SCALE_STEP, MAX_SCALE);
            layer2.scale = currentScale;
            break;
        case 'ArrowDown':
            // Decrease size
            currentScale = Math.max(currentScale - SCALE_STEP, MIN_SCALE);
            layer2.scale = currentScale;
            break;
        case 'f':
        case 'F':
            // Toggle flip
            layer2.isFlipped = !layer2.isFlipped;
            break;
    }

    // Ensure layer stays within canvas bounds after resizing
    const scaledWidth = canvas.width * layer2.scale;
    const scaledHeight = canvas.height * layer2.scale;
    
    layer2.x = Math.min(layer2.x, canvas.width - scaledWidth);
    layer2.y = Math.min(layer2.y, canvas.height - scaledHeight);

    drawLayers();
});

// Helper function to draw layers without UI elements
function drawLayersClean(ctx, width, height) {
    // Clear the canvas completely first
    ctx.clearRect(0, 0, width, height);
    
    // Draw layer 1 (static background)
    const img1 = layer1.getCurrentImage();
    if (img1) {
        ctx.drawImage(img1, 0, 0, width, height);
    }

    // Draw layer 2 (movable) with rotation support
    const img2 = layer2.getCurrentImage();
    if (img2) {
        const originalAspectRatio = img2.width / img2.height;
        const baseSize = width * layer2.scale;
        const scaledWidth = originalAspectRatio > 1 ? baseSize : baseSize * originalAspectRatio;
        const scaledHeight = originalAspectRatio > 1 ? baseSize / originalAspectRatio : baseSize;
        
        ctx.save();
        
        // Move to the center of the image's position
        ctx.translate(layer2.x + scaledWidth/2, layer2.y + scaledHeight/2);
        
        // Apply rotation
        ctx.rotate(layer2.rotation * Math.PI / 180);
        
        if (layer2.isFlipped) {
            ctx.scale(-1, 1);
        }
        
        // Draw the image centered at the origin
        ctx.drawImage(img2, -scaledWidth/2, -scaledHeight/2, scaledWidth, scaledHeight);
        
        ctx.restore();
    }
}

// Helper function to create export canvas
function createExportCanvas() {
    try {
        // Get the main canvas
        const mainCanvas = document.getElementById('mainCanvas');
        if (!mainCanvas) {
            throw new Error('Main canvas not found');
        }

        // Create a new canvas for export
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        
        // Set dimensions
        exportCanvas.width = mainCanvas.width;
        exportCanvas.height = mainCanvas.height;
        
        // Copy the main canvas content
        exportCtx.drawImage(mainCanvas, 0, 0);
        
        return exportCanvas;
    } catch (error) {
        console.error('Error in createExportCanvas:', error);
        throw error;
    }
}

// Helper function to draw layers without UI elements
function drawLayersForExport(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw layer 1 (background)
    const img1 = layer1.getCurrentImage();
    if (img1) {
        ctx.drawImage(img1, 0, 0, canvas.width, canvas.height);
    }
    
    // Draw layer 2 (overlay) - only the image, no UI elements
    const img2 = layer2.getCurrentImage();
    if (img2) {
        const originalAspectRatio = img2.width / img2.height;
        const baseSize = canvas.width * layer2.scale;
        const scaledWidth = originalAspectRatio > 1 ? baseSize : baseSize * originalAspectRatio;
        const scaledHeight = originalAspectRatio > 1 ? baseSize / originalAspectRatio : baseSize;
        
        ctx.drawImage(img2, 
            layer2.x, layer2.y, 
            scaledWidth, scaledHeight);
    }
}

// Update the download button click handler
document.getElementById('downloadBtn').addEventListener('click', function() {
    try {
        // Get the main canvas
        const canvas = document.getElementById('mainCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Create a temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        
        // Draw layers without UI elements
        drawLayersForExport(exportCanvas);

        // Generate filename
        const fileName = generateGobName();

        // Check if it's iOS/iPadOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0);

        if (isIOS) {
            // For iOS: Open in new window
            const dataURL = exportCanvas.toDataURL('image/png');
            const windowContent = `
                <html>
                    <head>
                        <title>${fileName}</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                            body {
                                margin: 0;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                background: #f0f0f0;
                            }
                            img {
                                max-width: 100%;
                                max-height: 100vh;
                                object-fit: contain;
                            }
                            .instructions {
                                position: fixed;
                                top: 10px;
                                left: 0;
                                right: 0;
                                text-align: center;
                                background: rgba(255,255,255,0.9);
                                padding: 10px;
                                font-family: sans-serif;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="instructions">
                            Tap and hold image to save as "${fileName}.png"
                        </div>
                        <img src="${dataURL}" alt="Gob Creation">
                    </body>
                </html>
            `;

            const win = window.open();
            if (win) {
                win.document.write(windowContent);
            } else {
                alert('Please allow pop-ups to download the image');
            }
        } else {
            // For other devices: Direct download
            const dataURL = exportCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${fileName}.png`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error('Download failed:', error);
        alert(`Failed to download image: ${error.message}`);
    }
});

// Random name generator function
function generateGobName() {
    const suffixes = [
        'inator', 'arino', 'enstein', 'ology', 'master', 
        'supreme', 'ultra', 'maximus', 'prime', 'deluxe',
        'wizard', 'chief', 'lord', 'king', 'boss'
    ];
    
    const randomNum = Math.floor(Math.random() * 1000);
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `Gob${randomSuffix}_${randomNum}`;
}

// Update the original drawLayers function to include UI elements
function drawLayers() {
    // First draw the images without UI
    drawLayersClean(ctx, canvas.width, canvas.height);
    
    // Then add UI elements only if needed
    if (selectedLayer === layer2) {
        const img2 = layer2.getCurrentImage();
        if (img2) {
            const originalAspectRatio = img2.width / img2.height;
            const baseSize = canvas.width * layer2.scale;
            const scaledWidth = originalAspectRatio > 1 ? baseSize : baseSize * originalAspectRatio;
            const scaledHeight = originalAspectRatio > 1 ? baseSize / originalAspectRatio : baseSize;
            
            // Draw resize handle
            const handleSize = window.innerWidth <= 768 ? 40 : 30;
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(layer2.x + scaledWidth, layer2.y + scaledHeight, 
                   handleSize/2, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw resize arrows
            ctx.beginPath();
            ctx.moveTo(layer2.x + scaledWidth - 10, layer2.y + scaledHeight);
            ctx.lineTo(layer2.x + scaledWidth + 10, layer2.y + scaledHeight);
            ctx.moveTo(layer2.x + scaledWidth, layer2.y + scaledHeight - 10);
            ctx.lineTo(layer2.x + scaledWidth, layer2.y + scaledHeight + 10);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw flip handle (bottom-left)
            ctx.beginPath();
            ctx.arc(layer2.x, layer2.y + scaledHeight, 
                   handleSize/1.69, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw flip arrows
            ctx.beginPath();
            // Left arrow
            ctx.moveTo(layer2.x - 8, layer2.y + scaledHeight);
            ctx.lineTo(layer2.x - 3, layer2.y + scaledHeight - 5);
            ctx.moveTo(layer2.x - 8, layer2.y + scaledHeight);
            ctx.lineTo(layer2.x - 3, layer2.y + scaledHeight + 5);
            // Right arrow
            ctx.moveTo(layer2.x + 8, layer2.y + scaledHeight);
            ctx.lineTo(layer2.x + 3, layer2.y + scaledHeight - 5);
            ctx.moveTo(layer2.x + 8, layer2.y + scaledHeight);
            ctx.lineTo(layer2.x + 3, layer2.y + scaledHeight + 5);

            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }
}

// Initial draw
drawLayers();

// Navigation buttons functionality
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const layerId = this.closest('.layer-row').querySelector('.preview-btn').getAttribute('data-layer');
        const layer = layerId === '1' ? layer1 : layer2;
        
        if (this.classList.contains('prev')) {
            layer.previousImage();
        } else {
            layer.nextImage();
        }
        
        drawLayers();
    });
});

// Initialize preview boxes within the buttons
document.querySelectorAll('.preview-btn').forEach(btn => {
    const layerId = btn.getAttribute('data-layer');
    
    // Create preview container inside the button
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    
    // Create preview image
    const previewImg = document.createElement('img');
    previewImg.className = 'preview-img';
    previewImg.alt = `Layer ${layerId} preview`;
    
    // Add them to the button
    previewContainer.appendChild(previewImg);
    btn.innerHTML = ''; // Clear the "PREVIEW LAYER X" text
    btn.appendChild(previewContainer);
    
    // Update preview image when layer image changes
    const layer = layerId === '1' ? layer1 : layer2;
    const updatePreview = () => {
        const currentImage = layer.getCurrentImage();
        if (currentImage) {
            previewImg.src = currentImage.src;
        }
    };
    
    // Initial preview update
    updatePreview();
    
    // Update preview when navigating images
    btn.closest('.layer-row').querySelectorAll('.nav-btn').forEach(navBtn => {
        navBtn.addEventListener('click', updatePreview);
    });
});

// Helper function to check if a point is inside the resize handle
function isInResizeHandle(x, y) {
    const img2 = layer2.getCurrentImage();
    if (!img2 || !selectedLayer || selectedLayer.id !== 2) return false;
    
    const originalAspectRatio = img2.width / img2.height;
    const baseSize = canvas.width * layer2.scale;
    
    let scaledWidth, scaledHeight;
    if (originalAspectRatio > 1) {
        scaledWidth = baseSize;
        scaledHeight = baseSize / originalAspectRatio;
    } else {
        scaledHeight = baseSize;
        scaledWidth = baseSize * originalAspectRatio;
    }
    
    const handleX = layer2.x + scaledWidth;
    const handleY = layer2.y + scaledHeight;
    const handleRadius = window.innerWidth <= 768 ? 20 : 15; // Increased touch area
    
    const dx = x - handleX;
    const dy = y - handleY;
    return Math.sqrt(dx * dx + dy * dy) <= handleRadius;
}

// Add preview functionality
function createPreviewBox(layerId) {
    const previewBox = document.createElement('div');
    previewBox.className = 'preview-box';
    previewBox.style.cssText = `
        width: 100px;
        height: 100px;
        background: #fff;
        border: 2px solid #ccc;
        position: absolute;
        right: 10px;
        display: none;
        overflow: hidden;
    `;
    
    const img = document.createElement('img');
    img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
    `;
    
    previewBox.appendChild(img);
    document.body.appendChild(previewBox);
    return previewBox;
}

// Create preview boxes for both layers
const previewBox1 = createPreviewBox(1);
const previewBox2 = createPreviewBox(2);

// Update preview buttons functionality
document.querySelectorAll('.preview-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const layerId = this.getAttribute('data-layer');
        const layer = layerId === '1' ? layer1 : layer2;
        const previewBox = layerId === '1' ? previewBox1 : previewBox2;
        
        // Position preview box next to the button
        const btnRect = this.getBoundingClientRect();
        previewBox.style.top = btnRect.top + 'px';
        
        // Get current image from layer
        const currentImage = layer.getCurrentImage();
        if (currentImage) {
            const img = previewBox.querySelector('img');
            img.src = currentImage.src;
            previewBox.style.display = 'block';
        }
    });
});

// Hide preview boxes when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('preview-btn')) {
        previewBox1.style.display = 'none';
        previewBox2.style.display = 'none';
    }
});

function updatePreviews() {
    document.querySelectorAll('.preview-btn').forEach(btn => {
        const layerId = btn.getAttribute('data-layer');
        const layer = layerId === '1' ? layer1 : layer2;
        const previewImg = btn.querySelector('.preview-img');
        const currentImage = layer.getCurrentImage();
        if (currentImage) {
            previewImg.src = currentImage.src;
        }
    });
}

// Add navigation button functionality
document.querySelectorAll('.layer-row').forEach(row => {
    // Skip if this row doesn't have a preview button
    if (!row.querySelector('.preview-btn')) {
        const dataLayer = row.getAttribute('data-layer');
        if (dataLayer === '1-nav') {
            // This is the navigation row for layer 1
            row.querySelector('.nav-btn.prev').addEventListener('click', () => {
                layer1.previousImage();
            });
            
            row.querySelector('.nav-btn.next').addEventListener('click', () => {
                layer1.nextImage();
            });
        }
        return;
    }
    
    const layerId = row.querySelector('.preview-btn').getAttribute('data-layer');
    const layer = layerId === '1' ? layer1 : layer2;
    
    // Only attach event listeners if this row has navigation buttons
    const prevBtn = row.querySelector('.nav-btn.prev');
    const nextBtn = row.querySelector('.nav-btn.next');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            layer.previousImage();
        });
        
        nextBtn.addEventListener('click', () => {
            layer.nextImage();
        });
    }
});

// Update the file input in HTML to accept more formats
document.getElementById('uploadLayer1').setAttribute('accept', 'image/png, image/jpeg, image/jpg, image/gif, image/webp');

// Handle file uploads with layer selection
document.getElementById('uploadLayer1').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    
    if (file && allowedTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = function() {
                // Optimize image before storing
                const optimizedDataUrl = optimizeImage(img);
                localStorage.setItem('layer1CustomImage', optimizedDataUrl);
                
                // Update layer 1 with optimized image
                const optimizedImg = new Image();
                optimizedImg.onload = function() {
                    layer1.images = [optimizedImg];
                    layer1.currentImageIndex = 0;
                    layer1.aspectRatio = optimizedImg.width / optimizedImg.height;
                    layer1.isCustomImage = true;
                    
                    drawLayers();
                    updatePreviews();
                };
                optimizedImg.src = optimizedDataUrl;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Add image optimization before upload
function optimizeImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set maximum dimensions while maintaining aspect ratio
    const MAX_WIDTH = 1500;
    const MAX_HEIGHT = 1500;
    let width = img.width;
    let height = img.height;
    
    if (width > height) {
        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
        }
    } else {
        if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
        }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw and compress image
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/png', 0.8); // Adjust quality as needed
}

// Update upload handler to use optimization
document.getElementById('uploadLayer1').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    
    if (file && allowedTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = function() {
                // Optimize image before storing
                const optimizedDataUrl = optimizeImage(img);
                localStorage.setItem('layer1CustomImage', optimizedDataUrl);
                
                // Update layer 1 with optimized image
                const optimizedImg = new Image();
                optimizedImg.onload = function() {
                    layer1.images = [optimizedImg];
                    layer1.currentImageIndex = 0;
                    layer1.aspectRatio = optimizedImg.width / optimizedImg.height;
                    layer1.isCustomImage = true;
                    
                    drawLayers();
                    updatePreviews();
                };
                optimizedImg.src = optimizedDataUrl;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Background loader function
function loadBackground() {
    const bgFolder = 'background/';
    const validExtensions = ['png', 'jpg', 'jpeg', 'gif'];
    
    // Try each extension
    for (const ext of validExtensions) {
        const img = new Image();
        img.onload = function() {
            document.body.style.backgroundImage = `url(${bgFolder}background.${ext})`;
        };
        img.src = `${bgFolder}background.${ext}`;
    }
}

// Call the function when page loads
window.addEventListener('load', loadBackground);

function centerLayer2() {
    const img2 = layer2.getCurrentImage();
    if (img2) {
        const originalAspectRatio = img2.width / img2.height;
        const baseSize = canvas.width * layer2.scale;
        let scaledWidth, scaledHeight;
        
        if (originalAspectRatio > 1) {
            scaledWidth = baseSize;
            scaledHeight = baseSize / originalAspectRatio;
        } else {
            scaledHeight = baseSize;
            scaledWidth = baseSize * originalAspectRatio;
        }

        // Center the image
        layer2.x = (canvas.width - scaledWidth) / 2;
        layer2.y = (canvas.height - scaledHeight) / 2;
        
        drawLayers();
    }
}

// Add this to the Layer class loadImages method after line 107:
if (this.id === 2 && i === 1) {
    centerLayer2();
}

// Helper function to calculate distance between two touch points
function getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Update canvas size setup
function initCanvas() {
    // Set a more reasonable base size for the canvas
    const baseSize = 800; // Reduced from 1500
    canvas.width = baseSize;
    canvas.height = baseSize;
    
    // Initial draw
    drawLayers();
}

// Update export canvas size to match
function createExportCanvas() {
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    // Match the new base size
    exportCanvas.width = 800;  // Reduced from 1500
    exportCanvas.height = 800;
    
    // Rest of your export code...
}

// Add this after your other event listeners
document.querySelector('.flip-btn').addEventListener('click', () => {
    if (layer2) {
        layer2.isFlipped = !layer2.isFlipped;
        drawLayers();
    }
});

// Add flip handle check function
function isInFlipHandle(x, y) {
    const img2 = layer2.getCurrentImage();
    if (!img2 || !selectedLayer || selectedLayer.id !== 2) return false;
    
    const originalAspectRatio = img2.width / img2.height;
    const baseSize = canvas.width * layer2.scale;
    const scaledWidth = originalAspectRatio > 1 ? baseSize : baseSize * originalAspectRatio;
    const scaledHeight = originalAspectRatio > 1 ? baseSize / originalAspectRatio : baseSize;
    
    const handleX = layer2.x;  // Left side of the image
    const handleY = layer2.y + scaledHeight;  // Bottom of the image
    const handleRadius = window.innerWidth <= 768 ? 20 : 15;
    
    const dx = x - handleX;
    const dy = y - handleY;
    return Math.sqrt(dx * dx + dy * dy) <= handleRadius;
}

// Add rotation slider functionality
document.addEventListener('DOMContentLoaded', function() {
    const rotationSlider = document.getElementById('rotationSlider');
    const rotationValue = document.querySelector('.rotation-value');
    
    rotationSlider.addEventListener('input', function() {
        layer2.rotation = parseInt(this.value);
        rotationValue.textContent = `${this.value}°`;
        drawLayers();
    });
});

// Add this at the end of your script.js file
document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('bgMusic');
    const audioToggle = document.getElementById('audioToggle');
    const iconOn = audioToggle.querySelector('.audio-icon-on');
    const iconOff = audioToggle.querySelector('.audio-icon-off');
    let isPlaying = false;

    // Function to toggle audio
    function toggleAudio() {
        if (isPlaying) {
            audio.pause();
            iconOn.style.display = 'none';
            iconOff.style.display = 'block';
        } else {
            audio.play().catch(function(error) {
                console.log("Audio play failed:", error);
            });
            iconOn.style.display = 'block';
            iconOff.style.display = 'none';
        }
        isPlaying = !isPlaying;
    }

    // Add click event listener
    audioToggle.addEventListener('click', toggleAudio);

    // Optional: Add keyboard shortcut (M key)
    document.addEventListener('keydown', function(e) {
        if (e.key.toLowerCase() === 'm') {
            toggleAudio();
        }
    });

    // Set initial volume
    audio.volume = 0.5; // Adjust this value between 0.0 and 1.0
});

// Add this to help debug
window.addEventListener('load', () => {
    setTimeout(() => {
        if (layer2) {
            layer2.debugImages();
        }
    }, 2000); // Wait 2 seconds after load to check images
});

// Add delay helper function
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const RATE_LIMIT_DELAY = 500;

// Add your Cloudflare Worker URL
const WORKER_URL = 'https://your-worker.your-subdomain.workers.dev'; // Replace with your actual worker URL

async function fetchGoblinarino(tokenId) {
    try {
        console.log('Fetching NFT:', tokenId);
        await delay(RATE_LIMIT_DELAY);

        // Use the Cloudflare Worker endpoint
        const response = await fetch(`${WORKER_URL}/api/nft/${tokenId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const responseText = await response.text();
            console.error('Error Response Content:', responseText);
            throw new Error('Failed to fetch NFT data');
        }

        const data = await response.json();
        console.log('NFT Data:', data);

        if (!data || !data.image) {
            throw new Error('Invalid NFT data received');
        }

        return data;
    } catch (error) {
        console.error('Error fetching NFT:', error);
        throw error;
    }
}

// Update the click handler with better error handling
document.getElementById('loadNftBtn').addEventListener('click', async () => {
    const input = document.getElementById('nftIdInput');
    const tokenId = input.value.trim();
    
    if (!tokenId) {
        alert('Please enter an NFT ID');
        return;
    }

    const loadBtn = document.getElementById('loadNftBtn');
    loadBtn.textContent = 'Loading...';
    loadBtn.disabled = true;

    try {
        const nftData = await fetchGoblinarino(tokenId);
        
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            layer1.apiImage = img;
            drawLayers();
            
            // Update NFT preview
            const nftPreview = document.querySelector('.preview-btn[data-layer="nft"] .preview-img');
            if (nftPreview) {
                nftPreview.src = img.src;
            }
        };

        img.onerror = () => {
            throw new Error('Failed to load NFT image');
        };

        img.src = nftData.image;

    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Failed to load NFT. Please try again.');
    } finally {
        loadBtn.textContent = 'Load NFT';
        loadBtn.disabled = false;
    }
});

// Add clear button functionality for NFT preview
document.getElementById('clearNftBtn').addEventListener('click', () => {
    // Clear the API image
    layer1.apiImage = null;
    
    // Clear the input field
    document.getElementById('nftIdInput').value = '';
    
    // Clear the preview image
    const nftPreview = document.querySelector('.preview-btn[data-layer="nft"] .preview-img');
    if (nftPreview) {
        nftPreview.src = '';
    }
    
    // Redraw the canvas
    drawLayers();
});

// Add keyboard support for the input
document.getElementById('nftIdInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('loadNftBtn').click();
    }
});

// Add clear button functionality
document.getElementById('clearNftBtn').addEventListener('click', () => {
    // Clear the API image
    layer1.apiImage = null;
    
    // Clear the input field
    document.getElementById('nftIdInput').value = '';
    
    // Redraw the canvas
    drawLayers();
});