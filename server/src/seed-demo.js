import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const email = 'demo@beautyglow.local';
const password = 'BeautyGlow123!'; // CHỈ DEMO local, không triển khai production.
const hash = await bcrypt.hash(password, 12);
const [users] = await pool.execute('SELECT id FROM users WHERE email=?', [email]);
let id = users[0]?.id;
if (!id) {
  const [result] = await pool.execute('INSERT INTO users(full_name,email,password_hash) VALUES(?,?,?)', ['Nguyễn Minh Anh',email,hash]);
  id = result.insertId;
}
let [addresses] = await pool.execute('SELECT id FROM addresses WHERE user_id=? LIMIT 1',[id]);
if (!addresses.length) {
  await pool.execute('INSERT INTO addresses(user_id,recipient_name,phone,street_address,ward,city,is_default) VALUES(?,?,?,?,?,?,1)',
    [id,'Nguyễn Minh Anh','0900000000','12 Nguyễn Văn Linh','Hải Châu','Đà Nẵng']);
}
const samples = [
  { code:'BG123456', method:'MOMO_SIMULATION', status:'SHIPPING', items:[[1,1,520000,'Serum dưỡng ẩm Laneige'],[2,1,400000,'Serum cấp ẩm CeraVe'],[3,1,240000,'Kem dưỡng BeautyGlow']], discount:50000 },
  { code:'BG123457', method:'COD', status:'PENDING', items:[[1,1,520000,'Serum dưỡng ẩm Laneige'],[2,1,400000,'Serum cấp ẩm CeraVe'],[3,1,240000,'Kem dưỡng BeautyGlow']], discount:50000 },
  { code:'BG123458', method:'MOMO_SIMULATION', status:'PENDING', items:[[4,1,299000,'Serum Vitamin C']], discount:0 }
];
for (const o of samples) {
  const [exists] = await pool.execute('SELECT id FROM orders WHERE order_code=?',[o.code]);
  if (exists.length) continue;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const sub = o.items.reduce((sum,i)=>sum+i[1]*i[2],0);
    const total = sub-o.discount+20000;
    const [rs] = await conn.execute(`INSERT INTO orders
      (order_code,user_id,recipient_name,recipient_phone,shipping_address,subtotal_vnd,discount_vnd,shipping_vnd,total_vnd,status)
      VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [o.code,id,'Nguyễn Minh Anh','0900000000','12 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',sub,o.discount,20000,total,o.status]);
    for(const i of o.items) await conn.execute('INSERT INTO order_items(order_id,product_id,quantity,unit_price_vnd,product_name) VALUES (?,?,?,?,?)',
      [rs.insertId,i[0],i[1],i[2],i[3]]);
    await conn.execute('INSERT INTO payments(order_id,method,status,amount_vnd) VALUES(?,?,?,?)',
      [rs.insertId,o.method,o.method==='COD'?'COLLECT_ON_DELIVERY':'PENDING',total]);
    await conn.commit();
  } catch(e) { await conn.rollback();throw e; } finally {conn.release();}
}
console.log('Demo user:',email);
console.log('Demo password:',password);
console.log('Đã tạo dữ liệu mẫu BG123456, BG123457, BG123458 (nếu chưa tồn tại).');
await pool.end();
