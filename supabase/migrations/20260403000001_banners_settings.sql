-- Banners for hero carousel
create table banners (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  subtitle    text,
  cta_label   text,
  cta_href    text,
  image_url   text,
  gradient    text,
  accent_color text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index idx_banners_active on banners(is_active, position);
alter table banners enable row level security;
create policy "banners_public_read" on banners for select using (true);
create policy "banners_admin_write" on banners for all to service_role using (true);

-- Site-wide key-value settings
create table site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table site_settings enable row level security;
create policy "settings_public_read" on site_settings for select using (true);
create policy "settings_admin_write" on site_settings for all to service_role using (true);

-- Featured flag on products
alter table products add column if not exists is_featured boolean not null default false;
create index idx_products_featured on products(is_featured) where is_featured = true;

-- Seed default settings
insert into site_settings (key, value) values
  ('announcement', '{"text": "Δωρεάν αποστολή για αγορές άνω των 80€", "active": true}'::jsonb),
  ('trust_items', '[
    {"icon": "truck", "label": "Δωρεάν Αποστολή", "detail": "Για αγορές άνω των 50€"},
    {"icon": "shield", "label": "Επίσημος Αντιπρόσωπος", "detail": "Εγγυημένα προϊόντα"},
    {"icon": "clock", "label": "Άμεση Αποστολή", "detail": "Σε 1 εργάσιμη ημέρα"},
    {"icon": "star", "label": "5000+ Reviews", "detail": "Ικανοποιημένοι πελάτες"}
  ]'::jsonb);

-- Seed banners from current hardcoded data
insert into banners (title, subtitle, cta_label, cta_href, gradient, accent_color, position) values
  ('ΑΣΦΑΛΕΙΑ ΣΕ ΚΑΘΕ ΣΤΡΟΦΗ', 'Κράνη επαγγελματικής απόδοσης', 'Δες τα Κράνη AGV', '/kranea', 'linear-gradient(135deg, #0B0F14 0%, #0F1A28 40%, #0D1520 100%)', 'teal', 0),
  ('ΠΡΟΣΤΑΣΙΑ ΧΩΡΙΣ ΣΥΜΒΙΒΑΣΜΟΥΣ', 'Επαγγελματικός εξοπλισμός αναβατών', 'Δες Εξοπλισμό', '/shop', 'linear-gradient(135deg, #120B0B 0%, #1F0D0D 40%, #160B0B 100%)', 'red', 1),
  ('ΟΔΗΓΗΣΕ ΧΩΡΙΣ ΟΡΙΑ', 'Γάντια, μπότες & ένδυση υψηλών επιδόσεων', 'Εξερεύνησε', '/shop', 'linear-gradient(135deg, #0A0F0A 0%, #0D1A10 40%, #0B150C 100%)', 'emerald', 2),
  ('ΤΕΧΝΟΛΟΓΙΑ ΠΡΩΤΟΠΟΡΩΝ', 'Κράνη ιαπωνικής μηχανικής αριστείας', 'Δες τα Κράνη Shoei', '/kranea', 'linear-gradient(135deg, #0F0B14 0%, #180D28 40%, #130C1E 100%)', 'violet', 3),
  ('ΣΤΥΛ ΚΑΙ ΛΕΙΤΟΥΡΓΙΚΟΤΗΤΑ', 'Η νέα κολεξιόν έφτασε', 'Νέες Αφίξεις', '/prosfores', 'linear-gradient(135deg, #0F0F0B 0%, #1A1A0D 40%, #151508 100%)', 'amber', 4);
