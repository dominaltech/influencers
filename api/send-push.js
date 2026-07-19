const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://slepfnlfzwschcfhykdh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZXBmbmxmendzY2hjZmh5a2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNzE5MjgsImV4cCI6MjA5OTk0NzkyOH0.ZdKd0k9BY5ueWoVLNsqwl-mjtPcRrswjuUlTpFxmKMw";

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:dominaltech@gmail.com";
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BEGBHbJ1d22Ltg2UKWJguEG3rOKv8IwDn9lhqNp3f-ZTqE0wNRx1SHi31zWUed4lQ5nO-GipaosmpEUEOGA0BiI";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "9kKRRzw_yU3l8o0VQL5FJLjP3GcnPjmmyHzudHFthsk";

try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
    console.warn("VAPID setup warning:", e);
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { influencer_id, brand_name, message, title } = req.body || {};

        if (!influencer_id) {
            return res.status(400).json({ error: 'influencer_id is required' });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: influencer, error: dbErr } = await supabase
            .from('influencers')
            .select('push_subscription, full_name')
            .eq('id', influencer_id)
            .single();

        if (dbErr || !influencer || !influencer.push_subscription) {
            return res.status(200).json({ success: false, message: 'No push subscription found for this influencer.' });
        }

        const payload = JSON.stringify({
            title: title || `New Brand Enquiry from ${brand_name || 'a Brand'}!`,
            body: message ? (message.length > 120 ? message.substring(0, 120) + '...' : message) : 'You received a new collaboration offer on CityFame.',
            icon: '/logo.png',
            badge: '/logo.png',
            vibrate: [200, 100, 200],
            data: {
                url: '/enquiries.html'
            }
        });

        await webpush.sendNotification(influencer.push_subscription, payload);
        return res.status(200).json({ success: true, message: 'Push notification sent successfully.' });
    } catch (err) {
        console.error("Web Push Serverless Error:", err);
        return res.status(500).json({ error: err.message || 'Failed to send push notification' });
    }
};
