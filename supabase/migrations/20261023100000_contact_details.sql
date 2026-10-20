-- Store contact details shown in the footer, Contact page and WhatsApp button.
-- Keeps any other socials keys; editable later from Admin -> Settings.

begin;

update public.site_settings set
  whatsapp_number = '+8801521771372',
  contact_email   = 'wristory0bd@gmail.com',
  socials         = socials || jsonb_build_object('facebook', 'https://www.facebook.com/profile.php?id=61594135738931');

commit;
