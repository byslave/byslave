import { guestUsername, usernameIssue } from './username';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const users = [
  { id: 'a', username: 'ece' },
  { id: 'b', username: 'deniz' },
];

assert(usernameIssue('ab', users) != null, '2 karakter olmamalı');
assert(usernameIssue('abc', users) == null, '3 karakter olmalı');
assert(usernameIssue('a'.repeat(16), users) == null, '16 karakter olmalı');
assert(usernameIssue('a'.repeat(17), users) != null, '17 karakter olmamalı');
assert(usernameIssue('Ada Gece', users) == null, 'boşluk ve büyük harf serbest');
assert(usernameIssue('ece', users) != null, 'dolu ad reddedilmeli');
assert(usernameIssue('ece', users, 'a') == null, 'kendi adı kalabilir');
assert(usernameIssue('  gece  ', users) == null, 'kenar boşluğu uzunluğa katılmaz');
assert(!users.some((user) => user.username === guestUsername(users)), 'misafir adı boşta olmalı');
assert(guestUsername([{ username: 'gece' }]).startsWith('gece'), 'doluysa yine gece ile başlar');

console.log('username tests ok');
