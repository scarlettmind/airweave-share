import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompanyAnalytics,COMPANY_SCAN_WINDOW_MS} from '../lib/company-analytics.ts';
test('GTM events preserve store and language, clear stale platform, and never replace dataLayer',()=>{
 const layer=[{event:'company_init'}],host={dataLayer:layer},a=createCompanyAnalytics(host);
 a.scan('matsuya-ginza');a.selection('platform','zh','小红书','matsuya-ginza');a.selection('language','en','','matsuya-ginza');
 assert.equal(host.dataLayer,layer);
 assert.deepEqual(layer.slice(1).map(x=>[x.event,x.store_id,x.selected_language,x.platform]),[['qr_visit','matsuya-ginza','',''],['platform_select','matsuya-ginza','zh','xiaohongshu'],['language_select','matsuya-ginza','en','']]);
});
test('scan window survives adapter recreation and expires separately per store',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},host={};let time=10000;
 const a=createCompanyAnalytics(host,storage,()=>time);a.scan('a');a.scan('a');a.scan('b');
 createCompanyAnalytics(host,storage,()=>time).scan('a');assert.equal(host.dataLayer.length,2);
 time+=COMPANY_SCAN_WINDOW_MS;a.scan('a');assert.equal(host.dataLayer.length,3);
});
test('direct gtag requires real destination and sends exactly once through that transport',()=>{
 const calls=[],host={AIRWEAVE_ANALYTICS:{mode:'gtag'},gtag:(...args)=>calls.push(args)};const a=createCompanyAnalytics(host);
 a.scan('a');assert.equal(calls.length,0);host.AIRWEAVE_ANALYTICS.measurementId='G-ABC123';a.scan('a');assert.equal(calls.length,1);assert.equal(calls[0][2].send_to,'G-ABC123');assert.equal(host.dataLayer,undefined);
});
test('blocked storage and broken trackers never break the visitor flow',()=>{
 const host={dataLayer:{push(){throw Error('blocked')}}};const a=createCompanyAnalytics(host,{getItem(){throw Error()},setItem(){throw Error()}});
 assert.doesNotThrow(()=>{a.scan('a');a.selection('language','ja','','a')});
});
