# Kararlar

Faz 0 sırasında alınan, sonradan değiştirilebilir seçimler.

## Ürün

- Marka adı **PULSE**. Renk, yazı ve boşluklar `src/theme/tokens.json` içinde. İsim buradan ve `i18n` marka anahtarından değişir.
- Varsayılan dil Türkçe, ikinci dil İngilizce. Cihaz dili otomatik seçilmez.
- Renk, referans ekranlardaki lavanta / yakın siyah palettir. Kırmızı vurgu kullanılmaz.
- Alt gezinme beş sekmedir: Harita, Akış, Gecem (ortada, belirgin), Sıra, Profil.
- Referanstaki “Figma” rozeti ürün arayüzüne girmez.

## Veri

- `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` doluysa sihirli bağlantı Supabase’e gider.
- Boşsa uygulama etiketli demo deposuyla açılır. Katılım sayıları, sıralama ve gece kartı örnek veridir; arayüzde “örnek” yazar.
- “Gidiyorum” bu cihazda saklanır ve görünen sayıyı bir artırır. `interested` sayaca eklenmez. Şema hazır; istemci henüz Supabase satırına yazmaz.
- Hayalet modu bu cihazda saklanır. Etkinlik sayfasında kullanıcı kendini listede görmez. Sunucudaki gizleme kuralı migrasyondadır, istemci henüz onu uygulamaz.
- Mekân önerme formu cihazdaki depoya `pending` yazar. Onay, etkinlik ve sahte katılım sayısı üretilmez.

## Harita

- Varsayılan harita CARTO `dark_all` raster karolarıdır. Sokaklar WebGL olmadan da çizilir.
- `EXPO_PUBLIC_MAPBOX_TOKEN` varsa stil Mapbox Dark v11 olur ve MapLibre GL JS ile açılır. Token yokken sahte harita çizilmez.
- Web’de harita bir iframe, iOS/Android’de WebView içindedir. Böylece Expo Go içinde ek native harita modülü gerekmez.
- Kümeleme yakınlaştırmaya bağlıdır. Yakın planda ayrı haplar, uzak planda toplanmış sayı görünür.
- Konum yalnızca “konumuma git”e basınca istenir ve yalnızca haritayı kaydırır. Saklanmaz, kimseyle paylaşılmaz.
- Önerilen mekân pini, haritanın o an baktığı merkezden alınır.

## Veritabanı

- `supabase/migrations/20261015120000_phase1_venues.sql` PostGIS, mekân, etkinlik, kadro ve katılım tablolarını kurar.
- Onaylı mekânlar herkese açıktır. Kullanıcı yalnızca `pending` mekân ekleyebilir. Katılım satırını sahibi yazar; `ghost` satırlar başkasına görünmez. Pin toplamı `event_pin_count` içindedir ve hayalet satırları da sayar.
- Örnek `sample_going` değerleri demo kartlarla aynıdır. Gerçek katılım satırı tohumlanmaz.

## Stil

- Renklerin tek kaynağı `src/theme/tokens.json`. Ekranlar StyleSheet ile bu tokenları kullanır.
- NativeWind paket olarak durur, ancak web başlangıcında `css-interop` koyu mod çökmesi verdiği için Metro/Babel entegrasyonu Faz 0’da kapalı. Açmak için `darkMode: 'class'` ile birlikte yeniden bağlanacak.
- Yazılar Sora (başlık) ve Inter (gövde). Sayaçlarda tablo rakamları vardır.

## Bilinçli olarak Faz 0 dışında

Sıçrama algılama, geofence, liderlik sunucusu, gerçek sohbet, fotoğraf yükleme, bildirim ve organizatör paneli sonraki fazlardadır. Gece ekranındaki süre ve sıçrama örnek kayıttır; sensör okunmaz.
