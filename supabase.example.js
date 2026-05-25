/**
 * Supabase client configuration — TEMPLATE FILE
 *
 * How to set up:
 *   1. Copy this file:  cp supabase.example.js supabase.js
 *   2. Fill in your project URL and anon key from:
 *      https://app.supabase.com → Project Settings → API
 *   3. supabase.js is listed in .gitignore — never commit it directly.
 *
 * Required Supabase tables (create via Table Editor or SQL):
 *
 *   projects
 *     id          uuid  primary key default gen_random_uuid()
 *     name        text  not null
 *     description text  not null
 *     image_url   text  not null
 *     video_url   text
 *     status      text  not null default 'draft'  -- 'draft' | 'published'
 *     created_at  timestamptz default now()
 *
 *   messages
 *     id          uuid  primary key default gen_random_uuid()
 *     name        text  not null
 *     email       text  not null
 *     message     text  not null
 *     created_at  timestamptz default now()
 *
 * Required RLS policies:
 *   projects  — enable RLS → anon: SELECT where status = 'published'
 *               authenticated: ALL
 *   messages  — enable RLS → anon: INSERT only
 *               authenticated: SELECT, DELETE
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
