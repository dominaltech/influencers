// ========================================================
// CityFame Shared Application Utilities
// ========================================================

// 1. Service Worker Registration (Auto-Updating)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
            .then(reg => {
                // Instantly check for live updates on every page load
                reg.update();
                console.log('CityFame PWA: SW active & auto-updating', reg.scope);
            })
            .catch(err => console.warn('CityFame PWA: SW registration failed', err));

        // Auto reload client when a new service worker replaces the old controller
        let isRefreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!isRefreshing) {
                isRefreshing = true;
                window.location.reload();
            }
        });
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

// 6. Instagram Embed Hydration Helper
// Polls for window.instgrm to be ready (async script), then calls process()
function processInstagramEmbeds() {
    if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
        try { window.instgrm.Embeds.process(); } catch(e) { console.warn('CityFame: instgrm.process error', e); }
    } else {
        // Retry until embed.js is fully loaded (up to 10 seconds)
        let attempts = 0;
        const poll = setInterval(() => {
            attempts++;
            if (window.instgrm && window.instgrm.Embeds) {
                clearInterval(poll);
                try { window.instgrm.Embeds.process(); } catch(e) {}
            } else if (attempts > 100) {
                clearInterval(poll); // Give up after 10s
            }
        }, 100);
    }
}

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

    const cleanUrl = url.trim();

    // YouTube / YouTube Shorts
    const ytMatch = cleanUrl.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*)/i);
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
    const igMatch = cleanUrl.match(/(?:reel|reels|p|share\/reel)\/([A-Za-z0-9_-]+)/i);
    if (igMatch && igMatch[1]) {
        const reelId = igMatch[1];
        // Schedule embed hydration after HTML is injected into DOM
        setTimeout(processInstagramEmbeds, 200);

        return `
            <div class="work-item" style="border-radius: var(--radius-md); overflow: hidden; background: #ffffff; border: 1px solid var(--border-color); margin-top: 10px; text-align: center;">
                <div style="width: 100%; max-width: 440px; height: 480px; margin: 0 auto; overflow: hidden; position: relative; background: #000; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                    <blockquote
                        class="instagram-media"
                        data-instgrm-captioned
                        data-instgrm-permalink="https://www.instagram.com/reel/${reelId}/"
                        data-instgrm-version="14"
                        style="background:#FFF; border:0; border-radius:12px; box-shadow:none; margin:0 auto; max-width:100%; width:100%; height:100%;"
                    >
                        <div style="padding:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; height:100%;">
                            <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); display:flex; align-items:center; justify-content:center;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="white" stroke-width="1.5"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" stroke-width="2"/></svg>
                            </div>
                            <span style="font-size:0.85rem; font-weight:700; color:#fff;">Loading Reel Preview...</span>
                            <a href="https://www.instagram.com/reel/${reelId}/" target="_blank" class="btn-secondary btn-sm" style="font-size:0.8rem; color:#fff; font-weight:600; text-decoration:none; background:rgba(255,255,255,0.2); border-color:rgba(255,255,255,0.4); margin-top:8px;">▶ Open in Instagram App</a>
                        </div>
                    </blockquote>
                </div>
                ${deleteBtnHtml}
            </div>
        `;
    }

    // Diagnostic fallback link card if URL format unrecognized
    console.warn("CityFame: Reel URL format unmatched by pattern:", cleanUrl);
    return `
        <div class="work-item" style="padding: 14px; text-align: center; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-top: 10px;">
            <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cleanUrl}</div>
            <a href="${cleanUrl}" target="_blank" class="btn-secondary btn-sm" style="text-decoration: none; width: auto; display: inline-flex;">
                ▶ Open Featured Link
            </a>
            ${deleteBtnHtml}
        </div>
    `;
}

// 7. Side Navigation Drawer Helpers
function openSideDrawer() {
    const backdrop = document.getElementById('side-drawer-backdrop');
    if (backdrop) {
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSideDrawer() {
    const backdrop = document.getElementById('side-drawer-backdrop');
    if (backdrop) {
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// 8. Open Inbox / DMs Helper
function openEnquiriesPage() {
    window.location.href = 'enquiries.html';
}

// 9. Hardware & Browser Back Button History Manager
// Native App Behavior: 
// - Back button on any subpage (influencers, enquiries, settings, about) immediately returns to Home Page (index.html).
// - Back button on Home Page requires double-tap within 2s to exit app.
let lastBackPressTimestamp = 0;

function setupAppBackHistoryManager() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const isHomePage = currentPath === 'index.html' || currentPath === '' || currentPath === '/';

    if (isHomePage) {
        // Push initial home state so Back button triggers popstate
        history.pushState({ isHomeState: true }, '', location.href);

        window.addEventListener('popstate', (e) => {
            const now = Date.now();
            if (now - lastBackPressTimestamp < 2000) {
                // Second back tap within 2 seconds -> exit app / allow default back action
                history.go(-1);
            } else {
                lastBackPressTimestamp = now;
                showToast("Press BACK again to exit CityFame");
                // Re-push home state to stay on home page
                history.pushState({ isHomeState: true }, '', location.href);
            }
        });
    } else {
        // Sub-pages: Pressing Back takes user straight to Home Page (index.html)
        window.addEventListener('popstate', (e) => {
            window.location.replace('index.html');
        });
    }
}

document.addEventListener('DOMContentLoaded', setupAppBackHistoryManager);

// 10. Native PWA Install Prompt Capture & Trigger
let deferredPwaInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaInstallPrompt = e;
    console.log("CityFame PWA: Install prompt captured");

    // Auto trigger prompt banner after 2.5s on home screen if not installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone) {
        setTimeout(() => {
            if (deferredPwaInstallPrompt) {
                const installBtn = document.getElementById('settings-install-pwa-btn');
                if (installBtn) {
                    installBtn.style.display = 'inline-flex';
                }
            }
        }, 2500);
    }
});

async function triggerPwaInstall() {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        showToast("CityFame App is already installed!");
        return;
    }

    if (deferredPwaInstallPrompt) {
        deferredPwaInstallPrompt.prompt();
        const { outcome } = await deferredPwaInstallPrompt.userChoice;
        if (outcome === 'accepted') {
            showToast("CityFame App installed successfully!");
        }
        deferredPwaInstallPrompt = null;
    } else {
        showToast("To install, open browser menu (⋮) and tap 'Add to Home screen' or 'Install App'.");
    }
}



