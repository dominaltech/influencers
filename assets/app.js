// ========================================================
// CityFame Shared Application Utilities
// ========================================================

// 1. Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('CityFame PWA: SW registered successfully', reg.scope))
            .catch(err => console.warn('CityFame PWA: SW registration failed', err));
    });
}

// 2. City Storage Helpers
const CITY_STORAGE_KEY = 'cityfame_city';
const SESSION_POPUP_KEY = 'cityfame_popup_shown';

function getSelectedCity() {
    return localStorage.getItem(CITY_STORAGE_KEY) || null;
}

function setSelectedCity(cityName) {
    localStorage.setItem(CITY_STORAGE_KEY, cityName);
}

function checkCityRedirect() {
    const currentPath = window.location.pathname;
    const isWelcomePage = currentPath.endsWith('welcome.html') || currentPath === '/welcome';
    const city = getSelectedCity();

    if (!city && !isWelcomePage) {
        window.location.href = 'welcome.html';
    } else if (city && isWelcomePage) {
        window.location.href = 'index.html';
    }
}

// 3. Number Formatter (e.g., 12.3K, 1.2M)
function formatCount(num) {
    if (!num || isNaN(num)) return '0';
    num = Number(num);
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString();
}

// 4. Toast Notification Utility
function showToast(message, isSuccess = true) {
    let container = document.getElementById('cityfame-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'cityfame-toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    const iconSvg = isSuccess 
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// 5. Active Tab Highlighter
function updateActiveTab() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const tabLinks = document.querySelectorAll('.bottom-tab-bar .tab-item');
    
    tabLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Initialize active tab state on DOM load
document.addEventListener('DOMContentLoaded', updateActiveTab);

// Extract & Render Embedded Video / Reel Preview Frame
function renderMediaEmbed(url, workId = null, onDelete = null) {
    if (!url) return '';
    
    let deleteBtnHtml = '';
    if (workId && onDelete) {
        deleteBtnHtml = `
            <div style="padding: 8px 12px; background: var(--bg-secondary); border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
                <button onclick="${onDelete}('${workId}')" class="btn-secondary btn-sm" style="color: var(--accent-danger); border-color: #fecaca; background: #fef2f2;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Delete Work
                </button>
            </div>
        `;
    }

    // YouTube / YouTube Shorts
    const ytMatch = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*)/i);
    if (ytMatch && ytMatch[1] && ytMatch[1].length === 11) {
        const videoId = ytMatch[1];
        return `
            <div class="work-item" style="border-radius: var(--radius-md); overflow: hidden; background: #000; margin-top: 10px; border: 1px solid var(--border-color);">
                <iframe src="https://www.youtube.com/embed/${videoId}" style="width:100%; height:230px; border:none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                ${deleteBtnHtml}
            </div>
        `;
    }

    // Instagram Reel / Post / Share
    const igMatch = url.match(/(?:reel|reels|p|share\/reel)\/([A-Za-z0-9_-]+)/i);
    if (igMatch && igMatch[1]) {
        const reelId = igMatch[1];
        return `
            <div class="work-item" style="border-radius: var(--radius-md); overflow: hidden; background: #ffffff; border: 1px solid var(--border-color); margin-top: 10px;">
                <iframe src="https://www.instagram.com/p/${reelId}/embed/" style="width:100%; min-height:450px; border:none; display:block;" scrolling="no" allowtransparency="true"></iframe>
                <div style="padding: 10px 14px; background: var(--bg-secondary); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
                    <a href="https://www.instagram.com/p/${reelId}/" target="_blank" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-black); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        Open Reel on Instagram
                    </a>
                </div>
                ${deleteBtnHtml}
            </div>
        `;
    }

    // Generic Fallback Link Card
    return `
        <div class="work-item" style="padding: 14px; text-align: center; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-top: 10px;">
            <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${url}</div>
            <a href="${url}" target="_blank" class="btn-secondary btn-sm" style="text-decoration: none; width: auto; display: inline-flex;">
                ▶ View Work Link
            </a>
            ${deleteBtnHtml}
        </div>
    `;
}
