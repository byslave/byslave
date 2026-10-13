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
- “Gidiyorum” bu fazda cihazda saklanır ve görünen sayıyı bir artırır. `interested` sayaca eklenmez. Sunucu ve realtime Faz 1.
- Hayalet modu bu cihazda saklanır. Etkinlik sayfasında kullanıcı kendini listede görmez. Sunucudaki liste gizleme Faz 2.

## Harita

- Harita gerçek MapLibre GL JS’tir. Karolar OpenFreeMap koyu stilinden gelir.
- `EXPO_PUBLIC_MAPBOX_TOKEN` varsa stil Mapbox Dark v11 olur. Token yokken sahte harita çizilmez.
- Web’de harita bir iframe, iOS/Android’de WebView içindedir. Böylece Expo Go içinde ek native harita modülü gerekmez.
- Kümeleme yakınlaştırmaya bağlıdır. Yakın planda ayrı haplar, uzak planda toplanmış sayı görünür.
- Konum yalnızca “konumuma git”e basınca istenir ve yalnızca haritayı kaydırır. Saklanmaz, kimseyle paylaşılmaz.

## Stil

- Renklerin tek kaynağı `src/theme/tokens.json`. Ekranlar StyleSheet ile bu tokenları kullanır.
- NativeWind paket olarak durur, ancak web başlangıcında `css-interop` koyu mod çökmesi verdiği için Metro/Babel entegrasyonu Faz 0’da kapalı. Açmak için `darkMode: 'class'` ile birlikte yeniden bağlanacak.
- Yazılar Sora (başlık) ve Inter (gövde). Sayaçlarda tablo rakamları vardır.

## Bilinçli olarak Faz 0 dışında

Sıçrama algılama, geofence, liderlik sunucusu, gerçek sohbet, fotoğraf yükleme, bildirim ve organizatör paneli sonraki fazlardadır. Gece ekranındaki süre ve sıçrama örnek kayıttır; sensör okunmaz.
