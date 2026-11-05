import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { pool } from './db.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('REPLACE_')) {
  console.error('JWT_SECRET phai du 32 ky tu, khong su dung gia tri mac dinh trong .env');
  process.exit(1);
}

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '64kb' }));

const guard = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const positiveInt = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const money = n => Number(n) || 0;
const signupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 25, standardHeaders: 'draft-7', legacyHeaders: false });

function requireAuth(req, res, next) {
  try {
    const token = /^Bearer\s+(.+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({ error: 'Vui lòng đăng nhập.' });
    const claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!positiveInt(claims.sub)) throw new Error('invalid-sub');
    req.userId = Number(claims.sub);
    next();
  } catch {
    res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
}
function tokenFor(id) {
  return jwt.sign({}, process.env.JWT_SECRET, { subject: String(id), expiresIn: '12h', algorithm: 'HS256' });
}
function publicUser(row) {
  return { id: row.id, full_name: row.full_name, email: row.email, phone: row.phone };
}
function validateAuth(body, registering) {
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const fullName = String(body?.full_name || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) return { error: 'Email không hợp lệ.' };
  if (password.length < 8 || password.length > 128) return { error: 'Mật khẩu phải có 8–128 ký tự.' };
  if (registering && (fullName.length < 2 || fullName.length > 120)) return { error: 'Họ tên phải có 2–120 ký tự.' };
  return { email, password, fullName };
}

app.get('/api/health', guard(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true, service: 'BeautyGlow API', database: 'connected' });
}));

app.post('/api/auth/register', signupLimiter, guard(async (req, res) => {
  const input = validateAuth(req.body, true);
  if (input.error) return res.status(400).json({ error: input.error });
  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [input.email]);
  if (rows.length) return res.status(409).json({ error: 'Email đã được đăng ký.' });
  const hash = await bcrypt.hash(input.password, 12);
  try {
    const [result] = await pool.execute('INSERT INTO users (full_name,email,password_hash) VALUES (?,?,?)', [input.fullName, input.email, hash]);
    res.status(201).json({ token: tokenFor(result.insertId), user: { id: result.insertId, full_name: input.fullName, email: input.email } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email đã được đăng ký.' });
    throw error;
  }
}));

app.post('/api/auth/login', signupLimiter, guard(async (req, res) => {
  const input = validateAuth(req.body, false);
  if (input.error) return res.status(400).json({ error: 'Thông tin đăng nhập không hợp lệ.' });
  const [rows] = await pool.execute('SELECT * FROM users WHERE email=?', [input.email]);
  const row = rows[0];
  if (!row || !(await bcrypt.compare(input.password, row.password_hash))) {
    return res.status(401).json({ error: 'Sai email hoặc mật khẩu.' });
  }
  res.json({ token: tokenFor(row.id), user: publicUser(row) });
}));

app.get('/api/auth/me', requireAuth, guard(async (req, res) => {
  const [rows] = await pool.execute('SELECT id,full_name,email,phone FROM users WHERE id=?', [req.userId]);
  if (!rows.length) return res.status(401).json({ error: 'Không tìm thấy tài khoản.' });
  res.json(rows[0]);
}));

app.get('/api/categories', guard(async (_req, res) => {
  const [rows] = await pool.query('SELECT id,name,slug FROM categories ORDER BY id');
  res.json(rows);
}));
app.get('/api/products', guard(async (req, res) => {
  const search = String(req.query.search || '').trim().slice(0, 100);
  const category = req.query.category_id;
  const min = req.query.min_price;
  const max = req.query.max_price;
  if ((category !== undefined && !positiveInt(category)) ||
      (min !== undefined && (!/^\d+$/.test(String(min)) || Number(min) > 1000000000)) ||
      (max !== undefined && (!/^\d+$/.test(String(max)) || Number(max) > 1000000000))) {
    return res.status(400).json({ error: 'Bộ lọc không hợp lệ.' });
  }
  let sql = `SELECT p.id,p.name,p.description,p.slug,p.price_vnd,p.original_price_vnd,p.stock,p.image_url,
              b.name AS brand,c.name AS category,c.id AS category_id
             FROM products p JOIN brands b ON b.id=p.brand_id
             JOIN categories c ON c.id=p.category_id WHERE p.is_active=1`;
  const params = [];
  if (search) { sql += ' AND (p.name LIKE ? OR b.name LIKE ?)'; params.push('%'+search+'%', '%'+search+'%'); }
  if (category !== undefined) { sql += ' AND p.category_id=?'; params.push(Number(category)); }
  if (min !== undefined) { sql += ' AND p.price_vnd>=?'; params.push(Number(min)); }
  if (max !== undefined) { sql += ' AND p.price_vnd<=?'; params.push(Number(max)); }
  sql += ' ORDER BY p.id ASC LIMIT 100';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
}));
app.get('/api/products/:id', guard(async (req, res) => {
  if (!positiveInt(req.params.id)) return res.status(400).json({ error: 'Mã sản phẩm không hợp lệ.' });
  const [rows] = await pool.execute('SELECT * FROM products WHERE id=? AND is_active=1', [Number(req.params.id)]);
  if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  res.json(rows[0]);
}));

app.get('/api/products/:id/reviews', guard(async (req, res) => {
  if (!positiveInt(req.params.id)) return res.status(400).json({ error: 'Invalid product ID.' });
  const [rows] = await pool.execute(`SELECT r.id,r.rating,r.comment,r.created_at,u.full_name
    FROM reviews r JOIN users u ON u.id=r.user_id
    WHERE r.product_id=? ORDER BY r.id DESC LIMIT 50`, [Number(req.params.id)]);
  res.json(rows);
}));

app.post('/api/products/:id/reviews', requireAuth, guard(async (req, res) => {
  const productId=Number(req.params.id), rating=Number(req.body?.rating);
  const comment=String(req.body?.comment || '').trim();
  if (!positiveInt(productId) || !Number.isInteger(rating) || rating<1 || rating>5 || comment.length>500)
    return res.status(400).json({ error: 'Rating must be 1-5 stars; max 500 characters.' });
  const [found]=await pool.execute('SELECT id FROM products WHERE id=? AND is_active=1',[productId]);
  if (!found.length) return res.status(404).json({ error: 'Product not found.' });
  const [prior]=await pool.execute('SELECT id FROM reviews WHERE user_id=? AND product_id=? ORDER BY id DESC LIMIT 1',[req.userId,productId]);
  if (prior.length) await pool.execute('UPDATE reviews SET rating=?,comment=? WHERE id=? AND user_id=?',[rating,comment,prior[0].id,req.userId]);
  else await pool.execute('INSERT INTO reviews(user_id,product_id,rating,comment) VALUES(?,?,?,?)',[req.userId,productId,rating,comment]);
  res.status(201).json({ok:true});
}));

app.get('/api/cart', requireAuth, guard(async (req, res) => {
  const [rows] = await pool.execute(`SELECT ci.product_id,ci.quantity,p.name,p.price_vnd,p.stock,p.image_url,
      (ci.quantity*p.price_vnd) AS line_total_vnd FROM cart_items ci JOIN products p ON p.id=ci.product_id
      WHERE ci.user_id=? ORDER BY ci.id`, [req.userId]);
  res.json({ items: rows, subtotal_vnd: rows.reduce((s, r) => s + money(r.line_total_vnd), 0) });
}));
app.post('/api/cart', requireAuth, guard(async (req, res) => {
  const productId = Number(req.body?.product_id);
  const quantity = Number(req.body?.quantity || 1);
  if (!positiveInt(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return res.status(400).json({ error: 'Sản phẩm hoặc số lượng không hợp lệ.' });
  const [products] = await pool.execute('SELECT id,stock,is_active FROM products WHERE id=?', [productId]);
  if (!products.length || !products[0].is_active) return res.status(404).json({ error: 'Sản phẩm không tồn tại.' });
  const [existing] = await pool.execute('SELECT quantity FROM cart_items WHERE user_id=? AND product_id=?', [req.userId, productId]);
  const sum = quantity + (existing[0]?.quantity || 0);
  if (sum > 20 || sum > products[0].stock) return res.status(400).json({ error: 'Số lượng vượt quá tồn kho hoặc giới hạn 20.' });
  await pool.execute(`INSERT INTO cart_items(user_id,product_id,quantity) VALUES(?,?,?)
     ON DUPLICATE KEY UPDATE quantity=VALUES(quantity)`, [req.userId, productId, sum]);
  res.status(201).json({ ok: true });
}));
app.patch('/api/cart/:productId', requireAuth, guard(async (req, res) => {
  const id = Number(req.params.productId), qty = Number(req.body?.quantity);
  if (!positiveInt(id) || !Number.isInteger(qty) || qty < 1 || qty > 20) return res.status(400).json({ error: 'Số lượng phải từ 1 đến 20.' });
  const [rows] = await pool.execute('SELECT stock FROM products WHERE id=? AND is_active=1', [id]);
  if (!rows.length || rows[0].stock < qty) return res.status(400).json({ error: 'Không đủ hàng.' });
  const [result] = await pool.execute('UPDATE cart_items SET quantity=? WHERE user_id=? AND product_id=?', [qty,req.userId,id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Sản phẩm không có trong giỏ.' });
  res.json({ ok: true });
}));
app.delete('/api/cart/:productId', requireAuth, guard(async (req, res) => {
  if (!positiveInt(req.params.productId)) return res.status(400).json({ error: 'Mã sản phẩm không hợp lệ.' });
  await pool.execute('DELETE FROM cart_items WHERE user_id=? AND product_id=?', [req.userId,Number(req.params.productId)]);
  res.json({ ok: true });
}));

app.get('/api/addresses', requireAuth, guard(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC,id', [req.userId]);
  res.json(rows);
}));
app.post('/api/addresses', requireAuth, guard(async (req, res) => {
  const recipient = String(req.body?.recipient_name || '').trim();
  const phone = String(req.body?.phone || '').trim();
  const street = String(req.body?.street_address || '').trim();
  const city = String(req.body?.city || '').trim();
  const ward = String(req.body?.ward || '').trim();
  if (recipient.length < 2 || recipient.length > 120 || !/^[0-9+\- ]{9,20}$/.test(phone) || !street || street.length>255 || !city || city.length>100 || ward.length>100) {
    return res.status(400).json({ error: 'Thông tin địa chỉ không hợp lệ.' });
  }
  const [count] = await pool.execute('SELECT COUNT(*) AS n FROM addresses WHERE user_id=?', [req.userId]);
  const [result] = await pool.execute('INSERT INTO addresses(user_id,recipient_name,phone,street_address,ward,city,is_default) VALUES(?,?,?,?,?,?,?)',
    [req.userId,recipient,phone,street,ward,city,count[0].n===0]);
  res.status(201).json({ id: result.insertId });
}));

app.delete('/api/addresses/:id', requireAuth, guard(async (req, res) => {
  if (!positiveInt(req.params.id)) return res.status(400).json({error:'Invalid address ID.'});
  const [result] = await pool.execute('DELETE FROM addresses WHERE id=? AND user_id=?',[Number(req.params.id),req.userId]);
  if (!result.affectedRows) return res.status(404).json({error:'Address not found.'});
  res.json({ok:true});
}));

app.post('/api/orders', requireAuth, guard(async (req, res) => {
  const addressId = Number(req.body?.address_id);
  const method = String(req.body?.payment_method || 'COD');
  const couponCode = String(req.body?.coupon_code || '').trim().toUpperCase();
  if (!positiveInt(addressId) || !['COD','MOMO_SIMULATION'].includes(method) || couponCode.length>40) {
    return res.status(400).json({ error: 'Địa chỉ hoặc phương thức thanh toán không hợp lệ.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [addresses] = await conn.execute('SELECT * FROM addresses WHERE id=? AND user_id=?', [addressId,req.userId]);
    if (!addresses.length) { await conn.rollback(); return res.status(400).json({ error: 'Hãy chọn địa chỉ thuộc tài khoản.' }); }
    const [items] = await conn.execute(`SELECT ci.product_id,ci.quantity,p.name,p.price_vnd,p.stock,p.is_active
       FROM cart_items ci JOIN products p ON p.id=ci.product_id
       WHERE ci.user_id=? ORDER BY ci.product_id FOR UPDATE`, [req.userId]);
    if (!items.length) { await conn.rollback(); return res.status(400).json({ error: 'Giỏ hàng trống.' }); }
    for (const row of items) if (!row.is_active || row.stock < row.quantity) {
      await conn.rollback(); return res.status(409).json({ error: 'Có sản phẩm không đủ tồn kho. Hãy kiểm tra giỏ.' });
    }
    const subtotal = items.reduce((v,x) => v + Number(x.price_vnd)*Number(x.quantity), 0);
    let discount = 0;
    if (couponCode) {
      const [cp] = await conn.execute(`SELECT * FROM coupons WHERE code=? AND is_active=1
       AND (expires_at IS NULL OR expires_at>NOW())`, [couponCode]);
      if (!cp.length || subtotal < cp[0].minimum_order_vnd) {
        await conn.rollback(); return res.status(400).json({ error: 'Mã giảm giá không hợp lệ cho đơn này.' });
      }
      discount = Math.min(cp[0].discount_vnd, subtotal);
    }
    const shipping = 20000;
    const total = subtotal - discount + shipping;
    const ad = addresses[0];
    const address = [ad.street_address,ad.ward,ad.city].filter(Boolean).join(', ');
    const [order] = await conn.execute(`INSERT INTO orders
       (order_code,user_id,recipient_name,recipient_phone,shipping_address,subtotal_vnd,discount_vnd,shipping_vnd,total_vnd,status)
       VALUES(?,?,?,?,?,?,?,?,?,'PENDING')`,
      ['TMP-'+randomUUID(),req.userId,ad.recipient_name,ad.phone,address,subtotal,discount,shipping,total]);
    const orderCode = 'BG'+String(order.insertId).padStart(6,'0');
    await conn.execute('UPDATE orders SET order_code=? WHERE id=?', [orderCode,order.insertId]);
    for (const item of items) {
      await conn.execute('INSERT INTO order_items (order_id,product_id,product_name,unit_price_vnd,quantity) VALUES (?,?,?,?,?)',
        [order.insertId,item.product_id,item.name,item.price_vnd,item.quantity]);
      await conn.execute('UPDATE products SET stock=stock-? WHERE id=?', [item.quantity,item.product_id]);
    }
    await conn.execute('INSERT INTO payments(order_id,method,status,amount_vnd) VALUES(?,?,?,?)',
      [order.insertId,method,method==='COD'?'COLLECT_ON_DELIVERY':'PENDING',total]);
    await conn.execute('DELETE FROM cart_items WHERE user_id=?', [req.userId]);
    await conn.commit();
    res.status(201).json({ id:order.insertId, order_code:orderCode, total_vnd:total, payment_method:method,
      payment_status: method==='COD'?'COLLECT_ON_DELIVERY':'PENDING', note: method==='MOMO_SIMULATION'?'Chưa thanh toán thực tế. Đây là mô phỏng.':undefined });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally { conn.release(); }
}));

app.get('/api/orders', requireAuth, guard(async (req, res) => {
  const [rows] = await pool.execute(`SELECT o.id,o.order_code,o.status,o.total_vnd,o.created_at,
       p.method AS payment_method,p.status AS payment_status
       FROM orders o JOIN payments p ON p.order_id=o.id
       WHERE o.user_id=? ORDER BY o.id DESC`, [req.userId]);
  res.json(rows);
}));
app.get('/api/orders/:id', requireAuth, guard(async (req,res) => {
  if (!positiveInt(req.params.id)) return res.status(400).json({ error: 'Mã đơn không hợp lệ.' });
  const [orders] = await pool.execute(`SELECT o.*,p.method AS payment_method,p.status AS payment_status
       FROM orders o JOIN payments p ON p.order_id=o.id WHERE o.id=? AND o.user_id=?`, [Number(req.params.id),req.userId]);
  if (!orders.length) return res.status(404).json({ error: 'Không tìm thấy đơn của bạn.' });
  const [items] = await pool.execute('SELECT product_name,unit_price_vnd,quantity FROM order_items WHERE order_id=?', [Number(req.params.id)]);
  res.json({ ...orders[0], items });
}));

app.post('/api/orders/:id/cancel', requireAuth, guard(async (req,res)=>{
  const id=Number(req.params.id);
  if (!positiveInt(id)) return res.status(400).json({error:'Invalid order ID.'});
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [orders]=await conn.execute('SELECT id,status FROM orders WHERE id=? AND user_id=? FOR UPDATE',[id,req.userId]);
    if (!orders.length) { await conn.rollback(); return res.status(404).json({error:'Order not found.'}); }
    if (orders[0].status!=='PENDING') { await conn.rollback(); return res.status(409).json({error:'Only pending orders can be canceled.'}); }
    const [items]=await conn.execute('SELECT product_id,quantity FROM order_items WHERE order_id=?',[id]);
    await conn.execute("UPDATE orders SET status='CANCELLED' WHERE id=? AND user_id=?",[id,req.userId]);
    await conn.execute("UPDATE payments SET status='FAILED' WHERE order_id=?",[id]);
    for (const item of items) {
      await conn.execute('UPDATE products SET stock=stock+? WHERE id=?',[item.quantity,item.product_id]);
    }
    await conn.commit();
    res.json({ok:true,status:'CANCELLED'});
  } catch (error) {
    await conn.rollback(); throw error;
  } finally {conn.release();}
}));

app.get('/api/favorites', requireAuth, guard(async (req,res)=>{
  const [rows] = await pool.execute(`SELECT p.id,p.name,p.price_vnd,p.image_url FROM favorites f
       JOIN products p ON p.id=f.product_id WHERE f.user_id=? ORDER BY f.created_at DESC`, [req.userId]);
  res.json(rows);
}));
app.post('/api/favorites/:id', requireAuth, guard(async (req,res)=>{
  if (!positiveInt(req.params.id)) return res.status(400).json({error:'Mã sản phẩm không hợp lệ.'});
  const [rows] = await pool.execute('SELECT id FROM products WHERE id=? AND is_active=1',[Number(req.params.id)]);
  if (!rows.length) return res.status(404).json({error:'Không tìm thấy sản phẩm.'});
  await pool.execute('INSERT IGNORE INTO favorites(user_id,product_id) VALUES (?,?)',[req.userId,Number(req.params.id)]);
  res.status(201).json({ok:true});
}));
app.delete('/api/favorites/:id', requireAuth, guard(async (req,res)=>{
  if (!positiveInt(req.params.id)) return res.status(400).json({error:'Mã sản phẩm không hợp lệ.'});
  await pool.execute('DELETE FROM favorites WHERE user_id=? AND product_id=?',[req.userId,Number(req.params.id)]);
  res.json({ok:true});
}));

app.use((error, _req, res, _next) => {
  console.error('[BeautyGlow API]', error);
  if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_DB_ERROR') return res.status(503).json({ error: 'Chưa import database/schema.' });
  if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') return res.status(503).json({ error: 'Không kết nối được MySQL. Kiểm tra server/.env.' });
  return res.status(500).json({ error: 'Có lỗi từ server. Kiểm tra cửa sổ Terminal API.' });
});
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`BeautyGlow API: http://localhost:${port}/api/health`));
