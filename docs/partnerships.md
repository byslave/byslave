# PULSE veri ortaklığı

PULSE, İstanbul’da (ve sonraki şehirlerde) gece hayatını haritada gösteren bir rehberdir. Kullanıcı bir mekânın bu geceki etkinliğini görür, bilet almak istediğinde **sizin bilet sayfanıza** gider. PULSE bilet satmaz ve sayfanızın yerine geçmez.

Bu metin bir başvuru taslağıdır. Herkese açık bir sayfayı kazımayız. Etkinlik verisi yalnızca sizin vereceğiniz feed, API anahtarı veya yazılı anlaşma ile alınır.

## Sizden istediğimiz alanlar

- Etkinlik adı
- Tarih ve saat (başlangıç ve bitiş; saat belli değilse bunu da işaretleyebileceğiniz bir alan)
- Mekân adı ve adresi
- Tür (müzik / gece türü)
- Görsel
- Bilet sayfasının linki
- Durum: planlandı, iptal, ertelendi

Kimlik olarak kaynak sisteminizdeki etkinlik numarası yeter. Aynı numarayla gelen güncellemeler yeni bir kayıt açmaz.

## Bizim tarafımız

- Günlük, ya da feed’inizin izin verdiği sıklıkta, senkronizasyon
- İptal ve ertelemenin haritadan aynı gün düşmesi
- Kartta ve detayda sizin bilet linkinize yönlendirme
- Kaynak adının etkinlikte görünmesi

## İletişim

Kısa bir teknik görüşme için: iş birliği kanalınız hazır olduğunda bu dosyadaki taslağı o adrese gönderin. Anahtar ve feed adresi uygulama ikilisine konmaz; sunucu tarafında durur.

---

# PULSE data partnership

PULSE is a nightlife guide. People see tonight’s event on a map and, when they want a ticket, they land on **your ticket page**. PULSE does not sell tickets and does not replace your page.

This is an application draft. We do not scrape public pages. Event data is accepted only through a feed, an API key, or a written agreement you provide.

## Fields we ask for

- Event name
- Date and time (start and end; a flag when the hour is not set yet)
- Venue name and address
- Genre
- Image
- Ticket page link
- Status: scheduled, cancelled, or postponed

Your own event id is enough. An update with the same id does not create a second row.

## What we do with it

- A daily sync, or whatever cadence your feed allows
- Cancellations and postponements leave the map the same day
- The card and the detail page send people to your ticket link
- Your name is shown as the source

## Contact

When a partnership address is ready, send this draft there. Keys and feed URLs stay on the server and are not shipped in the app.
