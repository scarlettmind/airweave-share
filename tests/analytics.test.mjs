import test from 'node:test';
import assert from 'node:assert/strict';
import {recordScan, SCAN_WINDOW_MS} from '../lib/share-analytics.ts';
import {validEvent} from '../lib/share-config.ts';

test('scan validation rejects language, platform and unsafe store fields', () => {
 const scan={event:'scan',language:'',platform:'',store:'osaka_shinsaibashi'};
 assert.equal(validEvent(scan),true);
 for(const change of [{language:'ja'},{platform:'X'},{store:'<script>'}]) assert.equal(validEvent({...scan,...change}),false);
});
test('visits deduplicate per store, expire, and retry after failure',async()=>{
 const oldFetch=globalThis.fetch,oldStorage=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage'),oldNow=Date.now;
 const data=new Map();let now=10000000,ok=true,calls=[];
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
 Date.now=()=>now;
 globalThis.fetch=async(url,opts)=>{calls.push(JSON.parse(opts.body));return {ok};};
 try {
  await Promise.all([recordScan('ginza-mitsukoshi'),recordScan('ginza-mitsukoshi')]);
  await recordScan('ginza-mitsukoshi');assert.equal(calls.length,1);
  await recordScan('matsuya-ginza');assert.equal(calls.length,2);
  now+=SCAN_WINDOW_MS;await recordScan('ginza-mitsukoshi');assert.equal(calls.length,3);
  ok=false;await recordScan('osaka_shinsaibashi');ok=true;await recordScan('osaka_shinsaibashi');assert.equal(calls.length,5);
  assert.equal(calls.every(validEvent),true);
  data.clear();globalThis.fetch=async()=>{throw Error('offline')};await recordScan('ginza-mitsukoshi');
 } finally {globalThis.fetch=oldFetch;Date.now=oldNow;if(oldStorage)Object.defineProperty(globalThis,'sessionStorage',oldStorage);else delete globalThis.sessionStorage;}
});
