-- Galleries
create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  dropbox_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Gallery images
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  width int,
  height int,
  size_bytes bigint,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gallery_images_gallery_id_idx
  on public.gallery_images (gallery_id, display_order);

-- Magic links
create table if not exists public.magic_links (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  max_uses int,
  uses_count int not null default 0,
  created_at timestamptz not null default now()
);