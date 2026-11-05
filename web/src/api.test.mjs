import test from 'node:test';
import assert from 'node:assert/strict';
import { request, VND } from './api.js';

test('VND formats a product value', () => {
  const text = VND(299000).replaceAll('\u00a0',' ');
  assert.match(text, /299\.000/);
});

test('API adds bearer token and JSON body', async () => {
  const oldFetch=globalThis.fetch;
  let call;
  globalThis.fetch=async (url, opts) => {
    call={url,opts};
    return {ok:true,json:async()=>({ok:true})};
  };
  try {
    const answer=await request('/cart',{token:'test-token',method:'POST',body:{product_id:4,quantity:1}});
    assert.equal(answer.ok,true);
    assert.equal(call.url,'/api/cart');
    assert.equal(call.opts.headers.Authorization,'Bearer test-token');
    assert.deepEqual(JSON.parse(call.opts.body),{product_id:4,quantity:1});
  } finally {globalThis.fetch=oldFetch;}
});

test('API surfaces backend validation errors', async()=>{
  const oldFetch=globalThis.fetch;
  globalThis.fetch=async()=>({ok:false,status:400,json:async()=>({error:'Bad checkout'})});
  try {await assert.rejects(request('/orders'),/Bad checkout/);}
  finally {globalThis.fetch=oldFetch;}
});
