const SUPABASE_URL = "https://egdbbovmwpexdkwkuuts.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZGJib3Ztd3BleGRrd2t1dXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDk3MDMsImV4cCI6MjA5NjkyNTcwM30.TrEe2ogqdou6vNfdwundowkSwki0xt3o0aNg5WD8TeI";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
