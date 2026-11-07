import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const tr = readFileSync(new URL('../../lib/i18n/tr.ts', import.meta.url), 'utf8');
const en = readFileSync(new URL('../../lib/i18n/en.ts', import.meta.url), 'utf8');

const turkish = [
  'Etkinliğini ekle',
  'Haritaya yalnızca doğrulanmış etkinlik çıkar. Onaylanmadan kimse yanlış bir geceye yönlendirilmez.',
  'Bilet linkini eklersen etkinliğin daha hızlı doğrulanır.',
  'Bu etkinlikte bir sorun mu var? Bize bildir.',
  'Teşekkürler, bildirimini aldık. İnceleyeceğiz.',
  'Bu bilgilerle zaten bir etkinlik var. Aynı etkinliği iki kez eklemeyelim.',
  'Başlangıç tarihi ve saati',
  'Bitiş tarihi ve saati',
  'Gece ertesi sabaha sürüyorsa bitiş gününü ertesi gün olarak seç.',
  'Saat henüz belli değil',
  'Geçmiş bir tarih seçemezsin.',
  'Bitiş zamanı başlangıçtan sonra olmalı.',
  'Bu etkinlik sona erdi.',
  'Etkinlik bittiğinde haritadan otomatik olarak kalkar.',
  'Gideceğin {{title}} iptal edildi.',
  'Bu etkinlik organizatör tarafından doğrulandı.',
  'Bu etkinlik henüz doğrulanmadı. Gitmeden önce bilet sayfasından kontrol et.',
];

test('the Turkish copy includes the verification and schedule lines', () => {
  for (const line of turkish) assert.equal(tr.includes(line), true, line);
  assert.equal(en.includes('Add your event'), true);
  assert.equal(en.includes('This event has ended.'), true);
});
