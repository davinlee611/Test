"use strict";

const SUPABASE_URL = "https://aciuxuvdasrhfrcauoxt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_MQDB7tXXNjz0QfNdYy3Xbg_pcGohXlW";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
);

const supabaseClient = window.supabaseClient;
