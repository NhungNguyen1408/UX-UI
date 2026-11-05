USE beautyglow_db;
-- 1) Kiem tra tong so bang: ky vong 12
SELECT COUNT(*) AS number_of_tables FROM information_schema.tables WHERE table_schema='beautyglow_db';
-- 2) Danh sach nguoi dung (khong lay password_hash de chup anh)
SELECT id, full_name, email, role, created_at FROM users ORDER BY id DESC;
-- 3) San pham tu 200k den 500k
SELECT id, name, price_vnd, stock FROM products WHERE price_vnd BETWEEN 200000 AND 500000 ORDER BY price_vnd;
-- 4) Lich su don + thanh toan
SELECT o.order_code, u.email, o.status, pm.method, pm.status AS payment_status,
       o.subtotal_vnd, o.discount_vnd, o.shipping_vnd, o.total_vnd
FROM orders o JOIN users u ON u.id=o.user_id
JOIN payments pm ON pm.order_id=o.id ORDER BY o.id DESC;
-- 5) San pham trong moi don
SELECT o.order_code, oi.product_name, oi.quantity, oi.unit_price_vnd,
       oi.quantity * oi.unit_price_vnd AS line_total_vnd
FROM order_items oi JOIN orders o ON o.id=oi.order_id ORDER BY o.id DESC, oi.id;
-- 6) So tien tinh tu cac dong hang co khop tam tinh trong orders hay khong
SELECT o.order_code, SUM(oi.quantity*oi.unit_price_vnd) AS calculated_subtotal,
       o.subtotal_vnd, (SUM(oi.quantity*oi.unit_price_vnd)=o.subtotal_vnd) AS valid_subtotal
FROM orders o JOIN order_items oi ON oi.order_id=o.id
GROUP BY o.id,o.order_code,o.subtotal_vnd ORDER BY o.id DESC;
