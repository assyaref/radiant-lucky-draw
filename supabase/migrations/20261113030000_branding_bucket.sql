-- Public bucket for event branding assets (Spin Nama logo + sounds).
-- Uploads go through the API (service role); files are publicly readable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  5242880,
  array[
    'image/png','image/jpeg','image/webp','image/gif',
    'audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/wave','audio/ogg',
    'audio/webm','audio/mp4','audio/x-m4a','audio/aac'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
