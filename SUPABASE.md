# Supabase setup

This app runs locally without Supabase. To enable user-specific cloud data:

1. Create a Supabase project.
2. Enable Google in Authentication → Providers.
3. Add your deployed app URL and local dev URL to Authentication → URL Configuration.
4. Run `supabase-schema.sql` in the SQL editor.
5. Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Data is scoped by `user_id` and protected by row-level security policies in `supabase-schema.sql`.

Tables:

- `threads`
- `bookmarks`
- `board_items`
- `action_rooms`

The browser continues to use localStorage as an offline cache and fallback.
