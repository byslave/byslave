-- Klein Phönix is published at Maslak, Atatürk Oto Sanayi Sitesi, AOS 52. Sokak No:12.
-- The earlier seed point sat on Ahi Evran Caddesi and the city map still framed Üsküdar.

update public.venues
set
  district = 'Maslak',
  location = extensions.ST_SetSRID(extensions.ST_MakePoint(29.022423, 41.118384), 4326)::extensions.geography
where id = 'klein';
