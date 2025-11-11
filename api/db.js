import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jcpbjuadwpmwzrqjmxdb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjcGJqdWFkd3Btd3pycWpteGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgwNjU1MSwiZXhwIjoyMDc4MzgyNTUxfQ.uGqUXek3RcCyTSr2_eKtYz0tl7OlVEujyXbaAVDabJs';

export const supabase = createClient(supabaseUrl, supabaseKey);
