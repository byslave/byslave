import { isFresh, parseHeartRate } from './heartRate';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function view(bytes: number[]) {
  return new DataView(Uint8Array.from(bytes).buffer);
}

assert(parseHeartRate(view([0x00, 78])) === 78, '8 bit nabız');
assert(parseHeartRate(view([0x01, 0x2c, 0x01])) === null, '250 üstü nabız yok sayılır');
assert(parseHeartRate(view([0x01, 0x58, 0x00])) === 88, '16 bit nabız 88');
assert(parseHeartRate(view([0x00, 0])) === null, 'sıfır nabız yok sayılır');
assert(parseHeartRate(view([0x00])) === null, 'eksik paket yok sayılır');
assert(parseHeartRate(view([0x00, 251])) === null, 'gerçek dışı nabız yok sayılır');
assert(isFresh(Date.now() - 1000), 'yeni nabız taze');
assert(!isFresh(Date.now() - 20_000), 'eski nabız taze değil');
assert(!isFresh(null), 'hiç nabız yoksa taze değil');
console.log('heartRate tests ok');
