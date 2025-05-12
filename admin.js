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
    const backgroundDropzone = document.getElementById('backgroundDropzone');
    const musicDropzone = document.getElementById('musicDropzone');
    const layer1Input = document.getElementById('layer1Input');
    const layer2Input = document.getElementById('layer2Input');
    const backgroundInput = document.getElementById('backgroundInput');
    const musicInput = document.getElementById('musicInput');
    const layer1Queue = document.getElementById('layer1Queue');
    const layer2Queue = document.getElementById('layer2Queue');
    const backgroundQueue = document.getElementById('backgroundQueue');
    const musicQueue = document.getElementById('musicQueue');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    const layer1Gallery = document.getElementById('layer1Gallery');
    const layer2Gallery = document.getElementById('layer2Gallery');
    const backgroundGallery = document.getElementById('backgroundGallery');
    const musicGallery = document.getElementById('musicGallery');
    const tabButtons = document.querySelectorAll('.tab-btn');

    // File queues for uploads
    let layer1Files = [];
    let layer2Files = [];
    let backgroundFiles = [];
    let musicFiles = [];

    // Site text and color settings
    let siteTextSettings = {
        title: 'GOBLINARINOS',
        subtitle: 'Merry Christmas Gobos',
        subtext: 'Put you´r hat on!, Das it & Das all!',
        subtitleColor: '#000000',
        subtextColor: '#000000',
        buttonColor: '#ffffff',
        buttonTextColor: '#000000',
        downloadBtnColor: '#1f78cc',
        downloadBtnTextColor: '#ffffff'
    };

    // Contributors settings
    let contributorsSettings = {
        developers: [],
        contributors: []
    };
    
    // Donation settings
    let donationSettings = {
        solanaAddress: '',
        ethereumAddress: '',
        bitcoinAddress: '',
        donationText: 'Please consider donating'
    };

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

    backgroundDropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('active');
    });

    backgroundDropzone.addEventListener('dragleave', function() {
        this.classList.remove('active');
    });

    backgroundDropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('active');
        handleFiles(e.dataTransfer.files, 'background');
    });

    backgroundInput.addEventListener('change', function() {
        handleFiles(this.files, 'background');
    });

    musicDropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('active');
    });

    musicDropzone.addEventListener('dragleave', function() {
        this.classList.remove('active');
    });

    musicDropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('active');
        handleFiles(e.dataTransfer.files, 'music');
    });

    musicInput.addEventListener('change', function() {
        handleFiles(this.files, 'music');
    });

    // Toggle more uploads section
    const toggleMoreUploadsBtn = document.getElementById('toggleMoreUploads');
    const moreUploadsSection = document.getElementById('moreUploadsSection');

    if (toggleMoreUploadsBtn && moreUploadsSection) {
        toggleMoreUploadsBtn.addEventListener('click', function() {
            const isHidden = moreUploadsSection.style.display === 'none';
            moreUploadsSection.style.display = isHidden ? 'flex' : 'none';
            this.textContent = isHidden ? '- Less Upload Options' : '+ More Upload Options';
        });
    }

    // Toggle site text settings section
    const toggleSiteTextBtn = document.getElementById('toggleSiteTextSettings');
    const siteTextSection = document.getElementById('siteTextSettingsSection');

    if (toggleSiteTextBtn && siteTextSection) {
        toggleSiteTextBtn.addEventListener('click', function() {
            const isHidden = siteTextSection.style.display === 'none';
            siteTextSection.style.display = isHidden ? 'block' : 'none';
            this.textContent = isHidden ? '- Hide Site Text & Colors' : '+ Site Text & Colors';
        });
    }

    // Toggle contributors settings section
    const toggleContributorsBtn = document.getElementById('toggleContributorsSettings');
    const contributorsSection = document.getElementById('contributorsSettingsSection');

    if (toggleContributorsBtn && contributorsSection) {
        toggleContributorsBtn.addEventListener('click', function() {
            const isHidden = contributorsSection.style.display === 'none';
            contributorsSection.style.display = isHidden ? 'block' : 'none';
            this.textContent = isHidden ? '- Hide Contributors' : '+ Contributors';

            if (isHidden) {
                // Load contributors data when opening the section
                loadContributors();
            }
        });
    }
    
    // Toggle donation settings section
    const toggleDonationBtn = document.getElementById('toggleDonationSettings');
    const donationSection = document.getElementById('donationSettingsSection');

    if (toggleDonationBtn && donationSection) {
        toggleDonationBtn.addEventListener('click', function() {
            const isHidden = donationSection.style.display === 'none';
            donationSection.style.display = isHidden ? 'block' : 'none';
            this.textContent = isHidden ? '- Hide Donation Settings' : '+ Donation Settings';

            if (isHidden) {
                // Load donation data when opening the section
                loadDonationSettings();
            }
        });
    }

    // Handle contributor tabs
    const contributorTabBtns = document.querySelectorAll('.contributor-tab-btn');
    const developerPanel = document.getElementById('developersPanel');
    const contributorsPanel = document.getElementById('contributorsPanel');

    contributorTabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state for tab buttons
            contributorTabBtns.forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');

            // Show the correct panel
            const type = this.getAttribute('data-type');
            if (type === 'developers') {
                developerPanel.style.display = 'block';
                contributorsPanel.style.display = 'none';
            } else {
                developerPanel.style.display = 'none';
                contributorsPanel.style.display = 'block';
            }
        });
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
        let filesArray = [];

        // Filter files based on layer type
        if (layerType === 'layer1' || layerType === 'layer2') {
            filesArray = Array.from(files).filter(file => file.type === 'image/png');
            if (filesArray.length === 0) {
                alert('Please select PNG images only for Layer 1 and Layer 2.');
                return;
            }
        } else if (layerType === 'background') {
            filesArray = Array.from(files).filter(file => file.type.startsWith('image/'));
            if (filesArray.length === 0) {
                alert('Please select valid image files for Background.');
                return;
            }
        } else if (layerType === 'music') {
            filesArray = Array.from(files).filter(file => file.type.startsWith('audio/'));
            if (filesArray.length === 0) {
                alert('Please select valid audio files for Music.');
                return;
            }
        }

        // Determine target queue and files list
        let targetQueue, filesList;

        switch (layerType) {
            case 'layer1':
                targetQueue = layer1Queue;
                filesList = layer1Files;
                break;
            case 'layer2':
                targetQueue = layer2Queue;
                filesList = layer2Files;
                break;
            case 'background':
                targetQueue = backgroundQueue;
                filesList = backgroundFiles;
                break;
            case 'music':
                targetQueue = musicQueue;
                filesList = musicFiles;
                break;
        }

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
        switch (layerType) {
            case 'layer1':
                layer1Files = filesList;
                break;
            case 'layer2':
                layer2Files = filesList;
                break;
            case 'background':
                backgroundFiles = filesList;
                break;
            case 'music':
                musicFiles = filesList;
                break;
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
        const totalFiles = layer1Files.length + layer2Files.length + backgroundFiles.length + musicFiles.length;

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

        // Upload background files
        for (const file of backgroundFiles) {
            try {
                await uploadFile(file, 'background');
                uploadedCount++;
            } catch (error) {
                console.error('Upload error:', error);
                errorCount++;
            }
            updateProgress();
        }

        // Upload music files
        for (const file of musicFiles) {
            try {
                await uploadFile(file, 'music');
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
        backgroundQueue.innerHTML = '';
        musicQueue.innerHTML = '';
        layer1Files = [];
        layer2Files = [];
        backgroundFiles = [];
        musicFiles = [];

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
        loadGallery('background');
        loadGallery('music');
        loadSiteTextSettings();
        loadContributors();
        loadDonationSettings();
    }

    async function loadGallery(layerType) {
        // Select the correct gallery element based on the layer type
        let galleryElement;
        if (layerType === 'layer1') {
            galleryElement = layer1Gallery;
        } else if (layerType === 'layer2') {
            galleryElement = layer2Gallery;
        } else if (layerType === 'background') {
            galleryElement = backgroundGallery;
        } else if (layerType === 'music') {
            galleryElement = musicGallery;
        } else {
            console.error('Unknown layer type:', layerType);
            return;
        }

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

        // Create proper image or audio preview based on type
        if (layerType === 'music') {
            // For music files, show an audio player
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.className = 'gallery-audio';

            const source = document.createElement('source');
            source.src = `/music/${image}`;
            source.type = 'audio/' + image.split('.').pop(); // Get file extension

            audio.appendChild(source);
            galleryItem.appendChild(audio);

            // Add file name
            const fileName = document.createElement('p');
            fileName.className = 'gallery-filename';
            fileName.textContent = image;
            galleryItem.appendChild(fileName);
        } else {
            // For images, show an image preview
            const img = document.createElement('img');
            img.className = 'gallery-img';

            // Set correct path based on layer type
            if (layerType === 'background') {
                img.src = `/images/background/${image}`;
            } else {
                img.src = `/images/${layerType}/${image}`;
            }

            img.alt = image;
            img.loading = 'lazy';
            galleryItem.appendChild(img);
        }

        // Add action buttons
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

    // Load site text settings from server
    async function loadSiteTextSettings() {
        try {
            const response = await fetch('/api/site-settings');

            if (response.ok) {
                const data = await response.json();
                if (data.settings) {
                    siteTextSettings = data.settings;
                    document.getElementById('siteTitle').value = siteTextSettings.title || '';
                    document.getElementById('siteSubtitle').value = siteTextSettings.subtitle || '';
                    document.getElementById('siteSubtext').value = siteTextSettings.subtext || '';

                    // Load color values if they exist
                    if (siteTextSettings.subtitleColor) {
                        document.getElementById('subtitleColor').value = siteTextSettings.subtitleColor;
                    }
                    if (siteTextSettings.subtextColor) {
                        document.getElementById('subtextColor').value = siteTextSettings.subtextColor;
                    }
                    if (siteTextSettings.buttonColor) {
                        document.getElementById('buttonColor').value = siteTextSettings.buttonColor;
                    }
                    if (siteTextSettings.buttonTextColor) {
                        document.getElementById('buttonTextColor').value = siteTextSettings.buttonTextColor;
                    }
                    if (siteTextSettings.downloadBtnColor) {
                        document.getElementById('downloadBtnColor').value = siteTextSettings.downloadBtnColor;
                    }
                    if (siteTextSettings.downloadBtnTextColor) {
                        document.getElementById('downloadBtnTextColor').value = siteTextSettings.downloadBtnTextColor;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading site settings:', error);
        }
    }
    
    // Load donation settings from server
    async function loadDonationSettings() {
        try {
            const response = await fetch('/api/donation-settings');

            if (response.ok) {
                const data = await response.json();
                if (data.settings) {
                    donationSettings = data.settings;
                    document.getElementById('solanaAddress').value = donationSettings.solanaAddress || '';
                    document.getElementById('ethereumAddress').value = donationSettings.ethereumAddress || '';
                    document.getElementById('bitcoinAddress').value = donationSettings.bitcoinAddress || '';
                    document.getElementById('donationText').value = donationSettings.donationText || 'Please consider donating';
                }
            }
        } catch (error) {
            console.error('Error loading donation settings:', error);
        }
    }

    // Load contributors settings from server
    async function loadContributors() {
        try {
            const response = await fetch('/api/contributors');

            if (response.ok) {
                const data = await response.json();
                if (data) {
                    contributorsSettings = data;
                    console.log('Loaded contributors:', contributorsSettings);
                    // Update the UI with the retrieved contributors
                    displayContributors();
                }
            } else {
                console.error('Failed to load contributors:', response.status);
            }
        } catch (error) {
            console.error('Error loading contributors:', error);
        }
    }

    // Display contributors in the admin panel
    function displayContributors() {
        const developersList = document.getElementById('developersList');
        const contributorsList = document.getElementById('contributorsList');

        // Clear existing list items
        developersList.innerHTML = '';
        contributorsList.innerHTML = '';

        // Add developers
        contributorsSettings.developers.forEach((developer, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'contributor-item';

            // Show image if available
            if (developer.image) {
                const img = document.createElement('img');
                img.src = developer.image;
                img.alt = developer.name;
                listItem.appendChild(img);
            }

            const info = document.createElement('div');
            info.className = 'contributor-item-info';
            info.textContent = developer.name + ' (' + developer.xAccount + ')';
            listItem.appendChild(info);
            
            // Add remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-contributor-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', function() {
                contributorsSettings.developers.splice(index, 1);
                displayContributors();
            });
            listItem.appendChild(removeBtn);

            developersList.appendChild(listItem);
        });

        // Add contributors
        contributorsSettings.contributors.forEach((contributor, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'contributor-item';

            // Show image if available
            if (contributor.image) {
                const img = document.createElement('img');
                img.src = contributor.image;
                img.alt = contributor.name;
                listItem.appendChild(img);
            }

            const info = document.createElement('div');
            info.className = 'contributor-item-info';
            info.textContent = contributor.name + ' (' + contributor.xAccount + ')';
            listItem.appendChild(info);
            
            // Add remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-contributor-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', function() {
                contributorsSettings.contributors.splice(index, 1);
                displayContributors();
            });
            listItem.appendChild(removeBtn);

            contributorsList.appendChild(listItem);
        });
    }

    // Save site text settings
    document.getElementById('saveTextBtn').addEventListener('click', async function() {
        const newSettings = {
            title: document.getElementById('siteTitle').value.trim(),
            subtitle: document.getElementById('siteSubtitle').value.trim(),
            subtext: document.getElementById('siteSubtext').value.trim(),
            subtitleColor: document.getElementById('subtitleColor').value,
            subtextColor: document.getElementById('subtextColor').value,
            buttonColor: document.getElementById('buttonColor').value,
            buttonTextColor: document.getElementById('buttonTextColor').value,
            downloadBtnColor: document.getElementById('downloadBtnColor').value,
            downloadBtnTextColor: document.getElementById('downloadBtnTextColor').value
        };

        // Validate inputs - ensure they're not empty
        if (!newSettings.title) {
            alert('Main title cannot be empty');
            return;
        }

        try {
            console.log('Saving settings:', newSettings);

            const response = await fetch('/api/site-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    settings: newSettings
                })
            });

            if (response.ok) {
                alert('All settings saved successfully!');
                siteTextSettings = newSettings;
            } else {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error saving site settings:', error);
            alert('Failed to save settings. Please try again.');
        }
    });
    
    // Save donation settings
    document.getElementById('saveDonationBtn').addEventListener('click', async function() {
        const newDonationSettings = {
            solanaAddress: document.getElementById('solanaAddress').value.trim(),
            ethereumAddress: document.getElementById('ethereumAddress').value.trim(),
            bitcoinAddress: document.getElementById('bitcoinAddress').value.trim(),
            donationText: document.getElementById('donationText').value.trim() || 'Please consider donating'
        };

        try {
            console.log('Saving donation settings:', newDonationSettings);

            const response = await fetch('/api/donation-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    settings: newDonationSettings
                })
            });

            if (response.ok) {
                alert('Donation settings saved successfully!');
                donationSettings = newDonationSettings;
            } else {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error saving donation settings:', error);
            alert('Failed to save donation settings. Please try again.');
        }
    });

    // Image preview functions for contributors
    function setupContributorImageUploads() {
        // Developer image upload
        const devImageInput = document.getElementById('devImage');
        const devImagePreview = document.getElementById('devImagePreview');

        devImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    devImagePreview.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    devImagePreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });

        // Contributor image upload
        const contribImageInput = document.getElementById('contribImage');
        const contribImagePreview = document.getElementById('contribImagePreview');

        contribImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    contribImagePreview.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    contribImagePreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Add and save contributor buttons
    function setupContributorButtons() {
        // Add developer button
        document.getElementById('addDevBtn').addEventListener('click', function() {
            const xAccount = document.getElementById('devTwitterHandle').value.trim();
            const name = document.getElementById('devName').value.trim();
            const role = document.getElementById('devRole').value.trim();
            const imagePreview = document.getElementById('devImagePreview').querySelector('img');

            if (!xAccount || !name) {
                alert('Twitter handle and name are required');
                return;
            }

            const newDeveloper = {
                xAccount: xAccount,
                name: name,
                role: role || 'Developer',
                image: imagePreview ? imagePreview.src : null
            };

            contributorsSettings.developers.push(newDeveloper);
            displayContributors();

            // Clear form
            document.getElementById('devTwitterHandle').value = '';
            document.getElementById('devName').value = '';
            document.getElementById('devRole').value = '';
            document.getElementById('devImagePreview').innerHTML = '';
        });

        // Add contributor button
        document.getElementById('addContribBtn').addEventListener('click', function() {
            const xAccount = document.getElementById('contribTwitterHandle').value.trim();
            const name = document.getElementById('contribName').value.trim();
            const role = document.getElementById('contribRole').value.trim();
            const imagePreview = document.getElementById('contribImagePreview').querySelector('img');

            if (!xAccount || !name) {
                alert('Twitter handle and name are required');
                return;
            }

            const newContributor = {
                xAccount: xAccount,
                name: name,
                role: role || 'Contributor',
                image: imagePreview ? imagePreview.src : null
            };

            contributorsSettings.contributors.push(newContributor);
            displayContributors();

            // Clear form
            document.getElementById('contribTwitterHandle').value = '';
            document.getElementById('contribName').value = '';
            document.getElementById('contribRole').value = '';
            document.getElementById('contribImagePreview').innerHTML = '';
        });

        // Save all contributors button
        document.getElementById('saveContributorsBtn').addEventListener('click', async function() {
            try {
                console.log('Saving contributors:', contributorsSettings);

                const response = await fetch('/api/contributors', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contributors: contributorsSettings
                    })
                });

                const responseData = await response.json();

                if (response.ok) {
                    alert('Contributors saved successfully!');
                } else {
                    console.error('Server error:', responseData);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${responseData.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Error saving contributors:', error);
                alert('Failed to save contributors. Please try again. Error: ' + error.message);
            }
        });
    }

    // Helper function to process contributor images
    function processContributorImages(contributors) {
        const contributorsDir = path.join(__dirname, 'images', 'contributors');

        // Ensure directory exists
        if (!fs.existsSync(contributorsDir)) {
            fs.mkdirSync(contributorsDir, { recursive: true });
        }

        contributors.forEach((contributor, index) => {
            try {
                // Check if the image is a base64 data URL
                if (contributor.image && typeof contributor.image === 'string' && contributor.image.startsWith('data:image')) {
                    // Extract the base64 data
                    const matches = contributor.image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);

                    if (matches && matches.length === 3) {
                        const imageType = matches[1];
                        const imageData = matches[2];

                        // Generate a filename
                        const filename = `contributor_${Date.now()}_${index}.${imageType}`;
                        const filePath = path.join(contributorsDir, filename);

                        try {
                            // Check if the image size is reasonable (limit to 5MB)
                            const buffer = Buffer.from(imageData, 'base64');
                            if (buffer.length > 5 * 1024 * 1024) {
                                console.warn(`Image for ${contributor.name} is too large (${Math.round(buffer.length/1024/1024)}MB), skipping`);
                                return;
                            }

                            // Save the file
                            fs.writeFileSync(filePath, buffer);

                            // Update the contributor object with the file path
                            contributor.image = `/images/contributors/${filename}`;
                        } catch (imageError) {
                            console.error('Error processing image:', imageError);
                            // If there's an error, don't use the image
                            contributor.image = null;
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing contributor ${index}:`, error);
                // Ensure we don't break the entire process if one contributor has issues
            }
        });
    }

    // Setup contributor-related functionality
    setupContributorImageUploads();
    setupContributorButtons();
});