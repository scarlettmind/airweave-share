import test from 'node:test';
import assert from 'node:assert/strict';
import { writeHashtags } from '../lib/share-copy.ts';
import { validEvent, storeId, tags, platformUrl, validatePhotos } from '../lib/share-config.ts';

function browserMock(clipboard) {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  let writes = 0, removed = 0;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    hasFocus: () => true, activeElement: { focus() {} },
    body: { appendChild() {} },
    createElement: () => ({ style: {}, focus() {}, select() {}, setSelectionRange() {}, remove() { removed++; } }),
    execCommand: () => { writes++; return true; },
  } });
  return { counts: () => ({ writes, removed }), restore() {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator); else delete globalThis.navigator;
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument); else delete globalThis.document;
  } };
}

test('every repeat writes fresh hashtags, including after an intervening clipboard change', async () => {
  const calls = []; let clipboard = '';
  const mock = browserMock({ writeText: async text => { calls.push(text); clipboard = text; } });
  try {
    assert.equal(await writeHashtags(tags.zh, true), true);
    clipboard = 'a different copied message';
    assert.equal(await writeHashtags(tags.zh, true), true);
    assert.equal(clipboard, tags.zh);
    assert.equal(await writeHashtags(tags.ja, true), true);
    assert.deepEqual(calls, [tags.zh, tags.zh, tags.ja]);
    assert.equal(clipboard, tags.ja);
  } finally { mock.restore(); }
});
test('denied background retry reports failure, then a fresh gesture can copy', async () => {
  let denied = true;
  const mock = browserMock({ writeText: async () => { if (denied) throw new Error('NotAllowedError'); } });
  try {
    assert.equal(await writeHashtags(tags.en, false), false);
    assert.equal(mock.counts().writes, 0);
    denied = false;
    assert.equal(await writeHashtags(tags.en, true), true);
  } finally { mock.restore(); }
});
test('gesture fallback works without Clipboard API and removes its temporary element', async () => {
  const mock = browserMock(undefined);
  try {
    assert.equal(await writeHashtags(tags.zh, true), true);
    assert.deepEqual(mock.counts(), { writes: 1, removed: 1 });
    assert.equal(await writeHashtags(tags.zh, false), false);
  } finally { mock.restore(); }
});
test('Japanese platform events are accepted and language/platform mismatches rejected', () => {
  for (const platform of ['Instagram', 'TikTok', 'X']) assert.equal(validEvent({ event: 'platform', language: 'ja', platform, store: 'ginza-mitsukoshi' }), true);
  assert.equal(validEvent({ event: 'language', language: 'ja', platform: '', store: 'ginza-mitsukoshi' }), true);
  for (const value of [null, {}, { event: 'platform', language: 'ja', platform: '小红书', store: 'ginza' }, { event: 'platform', language: '__proto__', platform: 'X', store: 'ginza' }]) assert.equal(validEvent(value), false);
});
test('store parsing and X prefilled text preserve each language', () => {
  assert.equal(storeId('?store=ginza-mitsukoshi'), 'ginza-mitsukoshi');
  assert.equal(storeId('?store=<bad>'), 'unassigned');
  for (const language of ['zh', 'en', 'ja']) assert.equal(new URL(platformUrl('x', language)).searchParams.get('text'), tags[language]);
});
test('photo validation accepts normal photos and rejects invalid/oversized batches', () => {
  const photo = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
  assert.equal(validatePhotos([photo]), null);
  assert.equal(validatePhotos([new File(['x'], 'code.svg', { type: 'image/svg+xml' })]), 'type');
  assert.equal(validatePhotos(Array(10).fill(photo)), 'count');
  assert.equal(validatePhotos([{ type: 'image/jpeg', size: 21 * 1024 * 1024 }]), 'size');
  assert.equal(validatePhotos(Array(4).fill({ type: 'image/jpeg', size: 16 * 1024 * 1024 })), 'size');
});

test('failed browser write and failed fallback never report copied', async () => {
  const mock = browserMock({ writeText: async () => { throw new Error('NotAllowedError'); } });
  try {
    document.execCommand = () => false;
    assert.equal(await writeHashtags(tags.zh, true), false);
    assert.equal(mock.counts().removed, 1);
  } finally { mock.restore(); }
});
