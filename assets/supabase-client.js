// ========================================================
// CityFame Supabase Client Configuration
// Replace placeholders with your actual Supabase project credentials.
// ========================================================

const SUPABASE_URL = "https://slepfnlfzwschcfhykdh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZXBmbmxmendzY2hjZmh5a2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNzE5MjgsImV4cCI6MjA5OTk0NzkyOH0.ZdKd0k9BY5ueWoVLNsqwl-mjtPcRrswjuUlTpFxmKMw";

// Check if credentials are properly configured
const isSupabaseConfigured = () => {
    return SUPABASE_URL && 
           SUPABASE_ANON_KEY && 
           !SUPABASE_URL.includes("YOUR_SUPABASE_URL") && 
           !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");
};

let supabaseClient = null;

if (typeof supabase !== 'undefined' && isSupabaseConfigured()) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.warn("CityFame: Failed to initialize Supabase client.", e);
    }
} else {
    console.info("CityFame: Supabase credentials not set or SDK missing. The app will use local storage/demo fallback where applicable until configured.");
}

// Expose client to global scope
window.cityfameSupabase = supabaseClient;
window.isSupabaseConfigured = isSupabaseConfigured;
