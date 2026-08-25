// Global State
let currentImageId = null;
let currentOriginalSize = 0;
let currentPage = 1;
const LIMIT = 6;

/**
 * Main Initializer called by index.html
 */
function initWorkspacePage() {
    setupUploadHandlers();
    setupTransformationHandlers();
    setupGalleryHandlers();
    loadGalleryPage(currentPage);
}

/**
 * 1. File Selection & Drag-and-Drop Handler
 */
function setupUploadHandlers() {
    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');

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
        if (files.length > 0) uploadRawImage(files[0]);
    });

    imageInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) uploadRawImage(e.target.files[0]);
    });
}

/**
 * Uploads raw image to POST /api/images via Multipart FormData
 */
async function uploadRawImage(file) {
    const statusTag = document.getElementById('statusTag');
    statusTag.textContent = 'Uploading...';
    statusTag.className = 'text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full';

    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetch('/api/images', {
            method: 'POST',
            body: formData // Browser automatically sets multipart/form-data header
        });

        if (!res.ok) throw new Error('Failed to upload image');
        const data = await res.json();

        currentImageId = data.id || data._id;
        currentOriginalSize = file.size;

        renderPreview(data.url || `/api/images/${currentImageId}`);
        updateMetrics(file.size, null);

        statusTag.textContent = 'Image Ready';
        statusTag.className = 'text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full';
        
        loadGalleryPage(1);
    } catch (err) {
        alert(err.message);
        statusTag.textContent = 'Upload Failed';
        statusTag.className = 'text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full';
    }
}

/**
 * 2. Transformation Payload Generator
 */
function setupTransformationHandlers() {
    const qualityRange = document.getElementById('qualityRange');
    const qualityVal = document.getElementById('qualityVal');
    const processBtn = document.getElementById('processBtn');

    qualityRange?.addEventListener('input', (e) => {
        qualityVal.textContent = `${e.target.value}%`;
    });

    processBtn?.addEventListener('click', async () => {
        if (!currentImageId) {
            alert('Please upload an image first.');
            return;
        }

        const width = parseInt(document.getElementById('imgWidth').value) || undefined;
        const height = parseInt(document.getElementById('imgHeight').value) || undefined;

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

        await applyTransformations(payload);
    });
}

/**
 * Sends transformation configuration to POST /api/images/:id/transform
 */
async function applyTransformations(payload) {
    const statusTag = document.getElementById('statusTag');
    statusTag.textContent = 'Processing...';

    try {
        const res = await fetch(`/api/images/${currentImageId}/transform`, {
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
 * 3. Render Helpers & Metrics Calculation
 */
function renderPreview(url) {
    const placeholder = document.getElementById('previewPlaceholder');
    const img = document.getElementById('previewImage');
    
    placeholder.classList.add('hidden');
    img.src = url;
    img.classList.remove('hidden');
}

function updateMetrics(origSize, newSize) {
    document.getElementById('originalSizeText').textContent = formatBytes(origSize);
    
    if (newSize) {
        document.getElementById('convertedSizeText').textContent = formatBytes(newSize);
        const ratio = Math.round(((origSize - newSize) / origSize) * 100);
        document.getElementById('savingsText').textContent = ratio > 0 ? `-${ratio}%` : `${ratio}%`;
    } else {
        document.getElementById('convertedSizeText').textContent = '--';
        document.getElementById('savingsText').textContent = '--';
    }
}

function enableDownload(url) {
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.disabled = false;
    downloadBtn.className = 'mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md';
    downloadBtn.onclick = () => window.open(url, '_blank');
}

function formatBytes(bytes) {
    if (!bytes) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * 4. Paginated Asset Gallery Logic
 */
function setupGalleryHandlers() {
    document.getElementById('prevPageBtn')?.addEventListener('click', () => {
        if (currentPage > 1) loadGalleryPage(--currentPage);
    });
    document.getElementById('nextPageBtn')?.addEventListener('click', () => {
        loadGalleryPage(++currentPage);
    });
}

async function loadGalleryPage(page) {
    try {
        const res = await fetch(`/api/images?page=${page}&limit=${LIMIT}`);
        if (!res.ok) return;
        const data = await res.json();

        const grid = document.getElementById('assetsGrid');
        grid.innerHTML = '';

        if (!data.images || data.images.length === 0) {
            grid.innerHTML = `<div class="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs col-span-full">No assets found on this page.</div>`;
            return;
        }

        data.images.forEach(img => {
            const card = document.createElement('div');
            card.className = 'bg-slate-50 border border-slate-200 rounded-xl p-2 group hover:border-emerald-300 transition-all cursor-pointer';
            card.innerHTML = `
                <div class="h-24 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center mb-2">
                    <img src="${img.url}" class="object-cover h-full w-full">
                </div>
                <p class="text-[10px] font-bold text-slate-700 truncate">${img.filename || 'Image Asset'}</p>
                <p class="text-[9px] text-slate-400">${formatBytes(img.size)}</p>
            `;
            card.onclick = () => {
                currentImageId = img.id || img._id;
                currentOriginalSize = img.size;
                renderPreview(img.url);
                updateMetrics(img.size, null);
            };
            grid.appendChild(card);
        });

        document.getElementById('pageIndicator').textContent = `Page ${page}`;
        document.getElementById('prevPageBtn').disabled = page === 1;
        document.getElementById('nextPageBtn').disabled = data.images.length < LIMIT;
    } catch (err) {
        console.error('Gallery loading failed', err);
    }
}