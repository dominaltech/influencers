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

// Helper to play Instagram Reel inline inside browser without redirecting
function playInlineReel(containerId, reelId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <iframe src="https://www.instagram.com/reel/${reelId}/embed/" style="width: 100%; height: 100%; border: none;" allowfullscreen scrolling="no" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>
    `;
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
        const uniqueId = 'reel-box-' + Math.random().toString(36).substring(2, 9);
        const posterUrl = `https://images.weserv.nl/?url=https://instagram.com/p/${reelId}/media/?size=l`;

        return `
            <div class="work-item" style="border-radius: var(--radius-md); overflow: hidden; background: #ffffff; border: 1px solid var(--border-color); margin-top: 10px; text-align: center;">
                <div id="${uniqueId}" style="width: 100%; max-width: 440px; height: 440px; margin: 0 auto; overflow: hidden; position: relative; background: #0f172a; border-radius: 12px 12px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; text-align: center; padding: 20px;">
                    <!-- High-Res Reel Cover Thumbnail Background -->
                    <img src="${posterUrl}" 
                         onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80';" 
                         alt="Reel Preview Poster" 
                         style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7); z-index: 1;">
                    
                    <!-- Dark Gradient Vignette for Text Legibility -->
                    <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%); z-index: 2;"></div>

                    <!-- Overlay Play Controls -->
                    <div style="position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center;">
                        <div style="width: 68px; height: 68px; border-radius: 50%; background: linear-gradient(135deg, #dc2743, #cc2366, #bc1888); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,0.5); margin-bottom: 12px; transition: transform 0.2s;" onclick="playInlineReel('${uniqueId}', '${reelId}')">
                            <svg width="34" height="34" viewBox="0 0 24 24" fill="white" style="margin-left: 3px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                        <div style="font-weight: 800; font-size: 1.05rem; margin-bottom: 4px; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">Instagram Reel</div>
                        <div style="font-size: 0.8rem; color: #f1f5f9; margin-bottom: 16px; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">Tap Play Reel below to watch inline in browser</div>
                        <button onclick="playInlineReel('${uniqueId}', '${reelId}')" class="btn-primary btn-sm" style="width: auto; padding: 10px 22px; font-weight: 700; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; box-shadow: 0 4px 12px rgba(37,99,235,0.4);">▶ Load & Play Video</button>
                    </div>
                </div>
                <div style="padding: 10px 14px; background: var(--bg-secondary); border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <button onclick="playInlineReel('${uniqueId}', '${reelId}')" class="btn-primary btn-sm" style="flex: 1; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: var(--accent-black); color: #fff;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Play Reel
                    </button>
                    <a href="https://www.instagram.com/reel/${reelId}/" target="_blank" class="btn-secondary btn-sm" style="flex: 1; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        Check on Instagram
                    </a>
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

// Global back button override: any back navigation on sub-pages goes directly to index.html without history loop
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPath !== 'index.html' && currentPath !== '') {
        window.history.pushState({ page: 'subpage' }, '', window.location.href);
        window.addEventListener('popstate', function(event) {
            window.location.replace('index.html');
        });
    }
});

// 6. Web Push VAPID Notification Helpers
const CITYFAME_VAPID_PUBLIC_KEY = "BEGBHbJ1d22Ltg2UKWJguEG3rOKv8IwDn9lhqNp3f-ZTqE0wNRx1SHi31zWUed4lQ5nO-GipaosmpEUEOGA0BiI";

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeToWebPush(silent = false) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (!silent) showToast("Push notifications are not supported on this browser.", false);
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            if (!silent) showToast("Notification permission denied.", false);
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            const convertedVapidKey = urlBase64ToUint8Array(CITYFAME_VAPID_PUBLIC_KEY);
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
        }

        // Save subscription to logged in creator's profile in Supabase
        const creatorData = localStorage.getItem('cityfame_creator');
        if (creatorData && window.cityfameSupabase) {
            try {
                const creator = JSON.parse(creatorData);
                if (creator && creator.id) {
                    await window.cityfameSupabase
                        .from('influencers')
                        .update({ push_subscription: subscription })
                        .eq('id', creator.id);

                    creator.push_subscription = subscription;
                    localStorage.setItem('cityfame_creator', JSON.stringify(creator));
                }
            } catch (e) {}
        }

        if (!silent) showToast("Push Notifications enabled!");
        return true;
    } catch (err) {
        console.error("Web Push Subscription Error:", err);
        if (!silent) showToast("Failed to enable push notifications: " + err.message, false);
        return false;
    }
}

async function triggerServerlessPushNotification(influencerId, brandName, message) {
    try {
        await fetch('/api/send-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                influencer_id: influencerId,
                brand_name: brandName,
                message: message
            })
        });
    } catch (err) {
        console.warn("Serverless Push trigger warning:", err);
    }
}

// 7. Automatic Background Enquiry Poller & Native System Notification Trigger
let lastNotifiedEnquiryId = localStorage.getItem('cityfame_last_enquiry_id') || null;

async function checkAndNotifyNewEnquiries() {
    const creatorData = localStorage.getItem('cityfame_creator');
    if (!creatorData || !window.cityfameSupabase) return;

    try {
        const creator = JSON.parse(creatorData);
        if (!creator || !creator.id) return;

        const { count: enquiryCount } = await window.cityfameSupabase
            .from('enquiries')
            .select('*', { count: 'exact', head: true })
            .eq('influencer_id', creator.id);

        const badgeEl = document.getElementById('header-dm-badge');
        if (badgeEl) {
            if (enquiryCount && enquiryCount > 0) {
                badgeEl.innerText = enquiryCount > 99 ? '99+' : enquiryCount;
                badgeEl.style.display = 'inline-flex';
            } else {
                badgeEl.style.display = 'none';
            }
        }

        const { data: latestEnquiries, error } = await window.cityfameSupabase
            .from('enquiries')
            .select('*')
            .eq('influencer_id', creator.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error || !latestEnquiries || latestEnquiries.length === 0) return;

        const newest = latestEnquiries[0];
        if (!lastNotifiedEnquiryId) {
            // Store initial baseline without firing notification for past enquiries
            lastNotifiedEnquiryId = newest.id;
            localStorage.setItem('cityfame_last_enquiry_id', newest.id);
            return;
        }

        if (newest.id !== lastNotifiedEnquiryId) {
            lastNotifiedEnquiryId = newest.id;
            localStorage.setItem('cityfame_last_enquiry_id', newest.id);

            // Display Native System Notification
            showNativeSystemNotification(
                `New Brand Enquiry from ${newest.name || 'a Client'}!`,
                newest.message || 'Tap to view collaboration details',
                '/enquiries.html'
            );
        }
    } catch (e) {
        console.warn("Background notification check warning:", e);
    }
}

function showNativeSystemNotification(title, body, targetUrl = '/enquiries.html') {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        const options = {
            body: body,
            icon: '/logo.png',
            badge: '/logo.png',
            vibrate: [200, 100, 200],
            tag: 'cityfame-enquiry-alert',
            renotify: true,
            data: { url: targetUrl }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(title, options);
            }).catch(() => {
                new Notification(title, options);
            });
        } else {
            new Notification(title, options);
        }
    }
}

// Start background poller and listen for realtime changes
document.addEventListener('DOMContentLoaded', () => {
    // Check for new enquiries on page load
    setTimeout(checkAndNotifyNewEnquiries, 2000);
    // Poll every 10 seconds in background
    setInterval(checkAndNotifyNewEnquiries, 10000);

    // Auto-prompt creator for notification permission on initial load if logged in
    const creator = localStorage.getItem('cityfame_creator');
    if (creator && 'Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            subscribeToWebPush(true);
        }, 4000);
    }
});



