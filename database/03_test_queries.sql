USE beautyglow_db;
-- Kiểm tra 12 bảng
SHOW TABLES;
-- Danh sách sản phẩm
SELECT p.id, p.name, b.name AS brand, c.name AS category, p.price_vnd, p.stock
FROM products p JOIN brands b ON p.brand_id=b.id
JOIN categories c ON p.category_id=c.id ORDER BY p.id;
-- Bộ lọc giá như Figma: 200.000 -> 500.000
SELECT name, price_vnd FROM products WHERE price_vnd BETWEEN 200000 AND 500000 ORDER BY price_vnd;
-- Đơn hàng của một người dùng demo (chạy sau npm run seed:demo)
SELECT o.order_code, u.email, o.subtotal_vnd, o.discount_vnd,
       o.shipping_vnd, o.total_vnd, o.status, pm.method, pm.status payment_status
FROM orders o JOIN users u ON u.id=o.user_id
JOIN payments pm ON pm.order_id=o.id ORDER BY o.id DESC;
-- Chi tiết đơn và số tiền tính từ dòng hàng
SELECT o.order_code, SUM(oi.unit_price_vnd*oi.quantity) AS recomputed_subtotal,
       o.subtotal_vnd, o.total_vnd
FROM orders o JOIN order_items oi ON oi.order_id=o.id
GROUP BY o.id, o.order_code, o.subtotal_vnd, o.total_vnd;
