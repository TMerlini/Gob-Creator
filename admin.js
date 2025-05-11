
// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Authentication variables
    const ADMIN_PASSWORD = 'GobAdmin123'; // Change this to your desired password
    const AUTH_TOKEN_KEY = 'gobAdmin_auth';
    
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminContent = document.getElementById('adminContent');
    
    const layer1Dropzone = document.getElementById('layer1Dropzone');
    const layer2Dropzone = document.getElementById('layer2Dropzone');
    const layer1Input = document.getElementById('layer1Input');
    const layer2Input = document.getElementById('layer2Input');
    const layer1Queue = document.getElementById('layer1Queue');
    const layer2Queue = document.getElementById('layer2Queue');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    const layer1Gallery = document.getElementById('layer1Gallery');
    const layer2Gallery = document.getElementById('layer2Gallery');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // File queues for uploads
    let layer1Files = [];
    let layer2Files = [];
    
    // Check authentication on page load
    checkAuth();
    
    // Authentication functions
    function checkAuth() {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token === ADMIN_PASSWORD) {
            showAdminPanel();
        }
    }
    
    function showAdminPanel() {
        loginForm.style.display = 'none';
        logoutBtn.style.display = 'block';
        adminContent.style.display = 'block';
        loadGalleries();
    }
    
    // Event listeners for authentication
    loginBtn.addEventListener('click', function() {
        if (passwordInput.value === ADMIN_PASSWORD) {
            localStorage.setItem(AUTH_TOKEN_KEY, ADMIN_PASSWORD);
            showAdminPanel();
        } else {
            alert('Incorrect password. Please try again.');
        }
    });
    
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        loginForm.style.display = 'flex';
        logoutBtn.style.display = 'none';
        adminContent.style.display = 'none';
    });
    
    // File upload event listeners
    layer1Dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('active');
    });
    
    layer1Dropzone.addEventListener('dragleave', function() {
        this.classList.remove('active');
    });
    
    layer1Dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('active');
        handleFiles(e.dataTransfer.files, 'layer1');
    });
    
    layer2Dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('active');
    });
    
    layer2Dropzone.addEventListener('dragleave', function() {
        this.classList.remove('active');
    });
    
    layer2Dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('active');
        handleFiles(e.dataTransfer.files, 'layer2');
    });
    
    layer1Input.addEventListener('change', function() {
        handleFiles(this.files, 'layer1');
    });
    
    layer2Input.addEventListener('change', function() {
        handleFiles(this.files, 'layer2');
    });
    
    // Tab functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const target = this.dataset.target;
            
            // Update active state for buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show the target gallery
            document.querySelectorAll('.gallery').forEach(gallery => {
                gallery.classList.remove('active');
            });
            document.getElementById(target).classList.add('active');
        });
    });
    
    // Handle file selection
    function handleFiles(files, layerType) {
        const filesArray = Array.from(files).filter(file => file.type === 'image/png');
        
        if (filesArray.length === 0) {
            alert('Please select PNG images only.');
            return;
        }
        
        const targetQueue = layerType === 'layer1' ? layer1Queue : layer2Queue;
        const filesList = layerType === 'layer1' ? layer1Files : layer2Files;
        
        filesArray.forEach(file => {
            // Check if we already have this file
            const isDuplicate = filesList.some(existingFile => 
                existingFile.name === file.name && 
                existingFile.size === file.size
            );
            
            if (!isDuplicate) {
                filesList.push(file);
                addFileToQueue(file, targetQueue, filesList);
            }
        });
        
        // Update references
        if (layerType === 'layer1') {
            layer1Files = filesList;
        } else {
            layer2Files = filesList;
        }
    }
    
    // Add file to the visual queue
    function addFileToQueue(file, queueElement, filesList) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', function() {
            // Find index and remove from list
            const index = filesList.findIndex(f => f === file);
            if (index !== -1) {
                filesList.splice(index, 1);
            }
            fileItem.remove();
        });
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(removeBtn);
        queueElement.appendChild(fileItem);
    }
    
    // Handle upload process
    uploadBtn.addEventListener('click', async function() {
        const totalFiles = layer1Files.length + layer2Files.length;
        
        if (totalFiles === 0) {
            alert('Please select files to upload first.');
            return;
        }
        
        this.disabled = true;
        progressContainer.style.display = 'block';
        
        let uploadedCount = 0;
        let errorCount = 0;
        
        // Helper function to update progress
        const updateProgress = () => {
            const progress = Math.round(((uploadedCount + errorCount) / totalFiles) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Uploading... ${progress}% (${uploadedCount} successful, ${errorCount} failed)`;
        };
        
        // Upload layer1 files
        for (const file of layer1Files) {
            try {
                await uploadFile(file, 'layer1');
                uploadedCount++;
            } catch (error) {
                console.error('Upload error:', error);
                errorCount++;
            }
            updateProgress();
        }
        
        // Upload layer2 files
        for (const file of layer2Files) {
            try {
                await uploadFile(file, 'layer2');
                uploadedCount++;
            } catch (error) {
                console.error('Upload error:', error);
                errorCount++;
            }
            updateProgress();
        }
        
        // Reset the queues
        layer1Queue.innerHTML = '';
        layer2Queue.innerHTML = '';
        layer1Files = [];
        layer2Files = [];
        
        // Complete the progress
        progressText.textContent = `Upload complete! ${uploadedCount} files uploaded successfully, ${errorCount} failed.`;
        
        // Re-enable the upload button after a delay
        setTimeout(() => {
            uploadBtn.disabled = false;
            progressContainer.style.display = 'none';
            // Reload galleries to show new images
            loadGalleries();
        }, 2000);
    });
    
    // Upload a single file to the server
    async function uploadFile(file, layerType) {
        const formData = new FormData();
        formData.append('image', file);
        
        console.log(`Uploading file to ${layerType}:`, file.name);
        
        const response = await fetch(`/api/upload?layer=${layerType}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    // Load existing images for galleries
    function loadGalleries() {
        loadGallery('layer1');
        loadGallery('layer2');
    }
    
    async function loadGallery(layerType) {
        const galleryElement = layerType === 'layer1' ? layer1Gallery : layer2Gallery;
        const gridElement = galleryElement.querySelector('.gallery-grid');
        const loadingElement = galleryElement.querySelector('.gallery-loading');
        
        gridElement.innerHTML = '';
        loadingElement.style.display = 'block';
        
        try {
            const response = await fetch(`/api/images/${layerType}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.images && data.images.length > 0) {
                data.images.forEach(image => {
                    addImageToGallery(image, gridElement, layerType);
                });
            } else {
                gridElement.innerHTML = '<p class="empty-gallery">No images found in this layer.</p>';
            }
        } catch (error) {
            console.error('Error loading gallery:', error);
            gridElement.innerHTML = '<p class="empty-gallery">Failed to load images. Please try again later.</p>';
        } finally {
            loadingElement.style.display = 'none';
        }
    }
    
    function addImageToGallery(image, galleryGrid, layerType) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.className = 'gallery-img';
        img.src = `/images/${layerType}/${image}`;
        img.alt = image;
        img.loading = 'lazy';
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'gallery-item-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete image';
        deleteBtn.addEventListener('click', function() {
            if (confirm(`Are you sure you want to delete ${image}?`)) {
                deleteImage(image, layerType, galleryItem);
            }
        });
        
        actionsDiv.appendChild(deleteBtn);
        galleryItem.appendChild(img);
        galleryItem.appendChild(actionsDiv);
        galleryGrid.appendChild(galleryItem);
    }
    
    async function deleteImage(image, layerType, galleryItem) {
        try {
            const response = await fetch('/api/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    layer: layerType,
                    filename: image
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Remove from gallery if successful
            galleryItem.remove();
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete the image. Please try again.');
        }
    }
});
