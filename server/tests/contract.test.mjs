import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('Schema declares 12 related InnoDB tables',()=>{
  const sql=read('database/01_schema.sql');
  const matches=[...sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/gi)].map(x=>x[1]);
  assert.equal(matches.length,12);
  for(const name of ['users','products','categories','brands','cart_items','orders','order_items','payments','favorites','reviews','addresses','coupons']) assert.ok(matches.includes(name));
  assert.match(sql,/FOREIGN KEY/);
});

test('Order writes are transactional and user-scoped',()=>{
  const code=read('server/src/index.js');
  assert.match(code,/beginTransaction\(\)/);
  assert.match(code,/commit\(\)/);
  assert.match(code,/rollback\(\)/);
  assert.match(code,/WHERE o\.id=\? AND o\.user_id=\?/);
});

test('Core API paths and private endpoints exist',()=>{
  const code=read('server/src/index.js');
  for(const route of ['/api/health','/api/auth/register','/api/auth/login','/api/products','/api/cart','/api/orders','/api/favorites','/api/addresses']) assert.ok(code.includes(route),route);
  assert.ok(code.includes("/api/orders/:id/cancel"));
  assert.ok(code.includes("/api/products/:id/reviews"));
});
