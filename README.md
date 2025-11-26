📸 Gallery Engine — Dropbox → Supabase Image Sync + Magic Link Galleries

A lightweight gallery system for photographers who want instant online galleries without uploading anything manually.
Drop photos into Dropbox, run npm run sync, and your galleries update automatically in Supabase.

Built for team sports, portrait sessions, school events, and high-volume gallery delivery.

⸻

🚀 Core Features

✅ 1. Dropbox → Supabase Sync

Simply drop images into organized Dropbox folders. The sync script:
• Reads top-level folders
• Optionally reads nested folders
• Creates galleries automatically
• Creates or reuses Dropbox direct-links
• Stores metadata in Supabase (galleries, gallery_images)

✅ 2. Direct Dropbox Image Links (no local storage!)

Images stay in Dropbox, not Supabase Storage.
Supabase stores only:
• direct image URL
• folder path
• size, order, timestamps

✅ 3. Parent + Child Galleries

Designed for team sports or multi-child sessions.

Example structure:

/Triple-H-Media/Stormers12U
/Player01
/Player02
/Player03

The engine detects this and builds:
• Parent gallery: stormers12u
• Child galleries: stormers12u-player01, etc.

Parents can view:
• A team page (grid of player cards), or
• A private player-only page

✅ 4. Magic-Link Access System

Every gallery (parent or child) has its own:
• UUID
• slug
• secure token (optional)
• magic URL

Example:

https://my-site.com/gallery/?m=293fj2…x19a

Magic links allow:
• Public access
• Private (token-only) access
• Per-gallery privacy modes

✅ 5. Two Access Models

Depending on the type of event, you pick the privacy level:

⸻

🔓 Option A — Open Parent Gallery (Team-Friendly)

Parents get one link.
They can browse all children via cards.

Perfect for:
• Team sports
• School events
• Rec leagues
• Church programs
• Any group environment

⸻

🔐 Option B — Child-Only Galleries (Privacy-Friendly)

Parent page may be locked, disabled, or admin-only.
Only child galleries are accessible.

Perfect for:
• Senior portraits
• Family sessions
• Paid photo packages
• Private clients
• Anything sensitive or restricted

⸻

🌳 Folder Structure and How Sync Works

Top-level folder = Gallery

/Triple-H-Media/Wildcats

Nested folder = Child gallery

/Triple-H-Media/Wildcats/Player01
/Triple-H-Media/Wildcats/Player02

Sync Script Rules
• Reads the root folder (e.g., /Triple-H-Media)
• For each subfolder:
• Creates or updates a gallery
• If nested folders exist:
• Parent gallery (team)
• Child galleries (players)
• All images inside any subfolder are imported
• Existing images update based on storage_path uniqueness

⸻

🗄 Supabase Tables

galleries

id (uuid)
slug (text)
title (text)
description (text)
parent_id (uuid or null)
created_at (timestamp)

gallery_images

id (uuid)
gallery_id (uuid)
storage_path (text) ← Dropbox path
public_url (text) ← Direct link
size_bytes (int)
display_order (int)
created_at (timestamp)

Unique Constraint

UNIQUE(storage_path)

This ensures re-syncing does not duplicate images.

⸻

🔁 How to Sync

Drop images into Dropbox → run:

npm run sync

You’ll see logs like:

📁 Found 3 folders
📁 Syncing LilLegends
📸 Found 2 images
✅ Synced IMG_001.JPG → order 0
✅ Synced IMG_002.JPG → order 1
🎉 Sync complete.

⸻

🔑 Direct Link Creation (Dropbox)

Dropbox creates shared links for each file.
Your script converts them to proper CDN-style direct links:

dl=0 → raw=1

Example final URL:

https://www.dropbox.com/scl/fi/.../photo.jpg?raw=1

These never expire and serve images fast.

⸻

🔮 Future Enhancements (supported easily)

⭐ Optional features you can turn on later:
• Per-gallery passwords
• Gallery expiration dates
• Watermarked preview mode
• Download protection
• Admin dashboard
• Email delivery with magic links
• Per-player pin codes
• Team index thumbnails
• Grid → Lightbox → Carousel modes

⭐ Optional performance upgrades:
• Next.js SSR
• Image resizing via Cloudflare Images
• Signed URL expiration
• On-demand blurhash previews

⸻

🔧 Environment Variables

DROPBOX_ACCESS_TOKEN=...
DROPBOX_ROOT_PATH=/Triple-H-Media
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...(optional for local testing)

⸻

🛠 Development Workflow

1. Add new galleries

Create a folder anywhere under:

/Triple-H-Media

2. Add player folders (optional)

/Triple-H-Media/Wildcats/Player01

3. Drop images inside

Anything ending in:

.jpg .jpeg .png .webp

will be imported.

4. Run sync

npm run sync

5. Share magic link

Parents go directly to:
• Team overview page
• Individual player page

⸻

🎯 Who’s This For?

Designed specifically for photographers who shoot lots of events, including:
• Little league and youth sports
• School sports
• Band, orchestra, theatre
• Church events
• Portrait photographers
• Real estate photographers
• School portraits
• Dance studios

⸻

🧠 Key Decisions You Can Flip Anytime

✔ Open team page?

OR child-only?

✔ Nested galleries?

OR one big gallery?

✔ Public access?

OR magic-link only?

✔ One link per team?

OR one link per player?

This system handles all of these without schema changes.

⸻
