// Configuration Endpoints
const AUTH_URL = '/api';
const IMAGES_URL = '/api/images';

// Application State
let accessToken = null;
let currentUser = null;
let currentImageId = null;
let currentOriginalSize = 0;
let currentPage = 1;
const LIMIT = 6;

/**
 * Decodes Base64URL JWT payload in memory
 */
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (err) {
        return null;
    }
}

/**
 * Main Initializer called by index.html (<script>initWorkspace();</script>)
 */
async function initWorkspace() {
    const token = await refreshSession();
    if (!token) return;

    updateHeaderUI();
    setupEventListeners();
    loadGalleryPage(currentPage);
    calculateTotalAccountStorage();
}

/**
 * Obtains a fresh access token using the HttpOnly refresh token cookie
 */
async function refreshSession() {
    try {
        const res = await fetch(`${AUTH_URL}/refresh`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!res.ok) throw new Error('Session invalid or expired');

        const data = await res.json();
        accessToken = data.accessToken;

        const payload = parseJwt(accessToken);
        currentUser = {
            username: payload?.userInfo?.username || payload?.username || 'Developer'
        };

        return accessToken;
    } catch (err) {
        console.warn('Session check error:', err.message);
        accessToken = null;
        currentUser = null;
        window.location.href = '/login.html';
        return null;
    }
}

/**
 * Helper wrapper for authenticated requests with automatic token refresh on 401
 */
async function fetchWithAuth(url, options = {}) {
    options.headers = options.headers || {};
    if (accessToken) {
        options.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    options.credentials = 'include';

    let res = await fetch(url, options);

    // If access token expired during session, attempt silent refresh once
    if (res.status === 401) {
        const newToken = await refreshSession();
        if (newToken) {
            options.headers['Authorization'] = `Bearer ${newToken}`;
            res = await fetch(url, options);
        }
    }

    return res;
}

/**
 * Updates Header User Info
 */
function updateHeaderUI() {
    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay && currentUser) {
        usernameDisplay.textContent = currentUser.username;
    }
}

/**
 * Attach Event Listeners
 */
function setupEventListeners() {
    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');
    const processBtn = document.getElementById('processBtn');
    const qualityRange = document.getElementById('qualityRange');
    const logoutBtn = document.getElementById('logoutBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    // Logout
    logoutBtn?.addEventListener('click', handleLogout);

    // File selection
    dropZone?.addEventListener('click', () => imageInput.click());

    ['dragover', 'dragenter'].forEach(evt => {
        dropZone?.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.add('border-emerald-500', 'bg-emerald-50/50');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZone?.addEventListener(evt, (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-emerald-500', 'bg-emerald-50/50');
        });
    });

    dropZone?.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) handleUploadImage(files[0]);
    });

    imageInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleUploadImage(e.target.files[0]);
    });

    // Transformations
    qualityRange?.addEventListener('input', (e) => {
        const qualityVal = document.getElementById('qualityVal');
        if (qualityVal) qualityVal.textContent = `${e.target.value}%`;
    });

    processBtn?.addEventListener('click', handleApplyTransformations);

    // Pagination
    prevPageBtn?.addEventListener('click', () => {
        if (currentPage > 1) loadGalleryPage(--currentPage);
    });

    nextPageBtn?.addEventListener('click', () => {
        loadGalleryPage(++currentPage);
    });
}

/**
 * Upload Raw Image (POST /api/images)
 */
async function handleUploadImage(file) {
    const statusTag = document.getElementById('statusTag');
    statusTag.textContent = 'Uploading...';
    statusTag.className = 'text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full';

    // Immediate local preview
    const tempUrl = URL.createObjectURL(file);
    renderPreview(tempUrl);
    updateMetrics(file.size, null);

    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetchWithAuth(IMAGES_URL, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `Upload failed (Status ${res.status})`);
        }

        const data = await res.json();
        currentImageId = data.id || data._id;
        currentOriginalSize = file.size;

        renderPreview(data.url || `${IMAGES_URL}/${currentImageId}`);

        statusTag.textContent = 'Image Ready';
        statusTag.className = 'text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full';

        loadGalleryPage(1);
        calculateTotalAccountStorage();
    } catch (err) {
        alert(err.message);
        statusTag.textContent = 'Upload Failed';
        statusTag.className = 'text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full';
    }
}

/**
 * Apply Transformations (POST /api/images/:id/transform)
 */
async function handleApplyTransformations() {
    if (!currentImageId) {
        alert('Please upload an image first.');
        return;
    }

    const statusTag = document.getElementById('statusTag');
    statusTag.textContent = 'Processing...';

    const width = parseInt(document.getElementById('imgWidth').value) || undefined;
    const height = parseInt(document.getElementById('imgHeight').value) || undefined;
    const qualityRange = document.getElementById('qualityRange');

    const payload = {
        transformations: {
            resize: (width || height) ? { width, height } : undefined,
            rotate: parseInt(document.getElementById('rotateSelect').value) || 0,
            format: document.getElementById('formatSelect').value,
            quality: parseInt(qualityRange.value),
            filters: {
                grayscale: document.getElementById('filterGrayscale').checked,
                sepia: document.getElementById('filterSepia').checked
            }
        }
    };

    try {
        const res = await fetchWithAuth(`${IMAGES_URL}/${currentImageId}/transform`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Transformation failed');

        const data = await res.json();
        renderPreview(data.url);
        updateMetrics(currentOriginalSize, data.size);

        statusTag.textContent = 'Transformed';
        enableDownload(data.url);
    } catch (err) {
        alert(err.message);
        statusTag.textContent = 'Error';
    }
}

/**
 * Fetches and Renders Paginated Image Assets (GET /api/images)
 */
async function loadGalleryPage(page) {
    try {
        const res = await fetchWithAuth(`${IMAGES_URL}?page=${page}&limit=${LIMIT}`);
        if (!res.ok) return;

        const data = await res.json();
        const grid = document.getElementById('assetsGrid');
        if (!grid) return;

        grid.innerHTML = '';
        const imageList = Array.isArray(data) ? data : (data.images || []);

        if (imageList.length === 0) {
            grid.innerHTML = `<div class="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs col-span-full">No assets found.</div>`;
            return;
        }

        // Inside loadGalleryPage(page) loop inside main.js:
        imageList.forEach(img => {
            const card = document.createElement('div');
            card.className = 'bg-slate-50 border border-slate-200 rounded-xl p-2 group hover:border-emerald-300 transition-all cursor-pointer relative';
            
            const imgId = img.id || img._id;

            card.innerHTML = `
                <div class="h-24 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center mb-2 relative">
                    <img src="${img.url}" class="object-cover h-full w-full">
                    
                    <!-- DELETE BUTTON -->
                    <button class="delete-btn absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Asset">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                <p class="text-[10px] font-bold text-slate-700 truncate">${img.filename || 'Image Asset'}</p>
                <p class="text-[9px] text-slate-400">${formatBytes(img.size)}</p>
            `;

            // Attach click listener for selecting the card
            card.onclick = () => {
                currentImageId = imgId;
                currentOriginalSize = img.size;
                renderPreview(img.url);
                updateMetrics(img.size, null);
            };

            // Attach click listener specifically for delete button
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.onclick = (e) => handleDeleteImage(imgId, e);

            grid.appendChild(card);
        });

        document.getElementById('pageIndicator').textContent = `Page ${page}`;
        document.getElementById('prevPageBtn').disabled = page === 1;
        document.getElementById('nextPageBtn').disabled = imageList.length < LIMIT;
    } catch (err) {
        console.error('Gallery error:', err);
    }
}

/**
 * Logout Handler (DELETE /api/logout)
 */
async function handleLogout() {
    try {
        await fetch(`${AUTH_URL}/logout`, {
            method: 'DELETE',
            credentials: 'include'
        });
    } catch (err) {
        console.error('Logout failed:', err);
    } finally {
        accessToken = null;
        currentUser = null;
        window.location.href = '/login.html';
    }
}

/**
 * Render Helpers
 */
function renderPreview(url) {
    const placeholder = document.getElementById('previewPlaceholder');
    const img = document.getElementById('previewImage');
    if (placeholder && img) {
        placeholder.classList.add('hidden');
        img.src = url;
        img.classList.remove('hidden');
    }
}

function updateMetrics(origSize, newSize) {
    const origText = document.getElementById('originalSizeText');
    const convText = document.getElementById('convertedSizeText');
    const savText = document.getElementById('savingsText');

    if (origText) origText.textContent = formatBytes(origSize);
    if (convText) {
        if (newSize) {
            convText.textContent = formatBytes(newSize);
            const ratio = Math.round(((origSize - newSize) / origSize) * 100);
            if (savText) savText.textContent = ratio > 0 ? `-${ratio}%` : `${ratio}%`;
        } else {
            convText.textContent = '--';
            if (savText) savText.textContent = '--';
        }
    }
}

function enableDownload(url) {
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.className = 'mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md';
        downloadBtn.onclick = () => window.open(url, '_blank');
    }
}

function formatBytes(bytes) {
    if (!bytes) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Calculates total storage across ALL account images
 */
async function calculateTotalAccountStorage() {
    try {
        // Fetch ALL user images by calling IMAGES_URL without ?page or ?limit
        const res = await fetchWithAuth(IMAGES_URL);
        if (!res.ok) return;

        const data = await res.json();
        const allImages = Array.isArray(data) ? data : (data.images || []);

        // Sum up sizes using a basic loop
        let totalBytes = 0;
        for (let i = 0; i < allImages.length; i++) {
            totalBytes += allImages[i].size || 0;
        }

        // Update UI display
        const storageDisplay = document.getElementById('totalStorageDisplay');
        if (storageDisplay) {
            storageDisplay.textContent = formatBytes(totalBytes);
        }
    } catch (err) {
        console.error('Error calculating storage:', err);
    }
}
/**
 * Deletes an image asset (DELETE /api/images/:id)
 */
async function handleDeleteImage(id, event) {
    // Prevent clicking the delete button from opening the image preview
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
        const res = await fetchWithAuth(`${IMAGES_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error('Failed to delete image');

        // Clear preview if deleted image is currently loaded in workspace
        if (currentImageId === id) {
            currentImageId = null;
            document.getElementById('previewImage').classList.add('hidden');
            document.getElementById('previewPlaceholder').classList.remove('hidden');
            updateMetrics(0, null);
        }

        // Refresh UI
        loadGalleryPage(currentPage);
        calculateTotalAccountStorage();
    } catch (err) {
        alert(err.message);
    }
}