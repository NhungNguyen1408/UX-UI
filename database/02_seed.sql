USE beautyglow_db;
-- Dùng INSERT IGNORE để tránh trùng khi chạy lại.
INSERT IGNORE INTO categories (id,name,slug) VALUES
 (1,'Chăm sóc da','cham-soc-da'),(2,'Trang điểm','trang-diem'),
 (3,'Chống nắng','chong-nang'),(4,'Chăm sóc tóc','cham-soc-toc');
INSERT IGNORE INTO brands (id,name,slug) VALUES
 (1,'Laneige','laneige'),(2,'CeraVe','cerave'),
 (3,'The Ordinary','the-ordinary'),(4,'BeautyGlow','beautyglow');

INSERT IGNORE INTO products
(id,category_id,brand_id,name,slug,description,price_vnd,original_price_vnd,stock,image_url)
VALUES
(1,1,1,'Serum dưỡng ẩm Laneige','serum-duong-am-laneige','Serum dưỡng ẩm 30ml. Sản phẩm mẫu dựa trên nội dung BeautyGlow.',520000,600000,40,'/assets/laneige.svg'),
(2,1,2,'Serum cấp ẩm CeraVe','serum-cap-am-cerave','Serum cấp ẩm 30ml.',400000,450000,32,'/assets/cerave.svg'),
(3,1,4,'Kem dưỡng BeautyGlow','kem-duong-beautyglow','Kem dưỡng hằng ngày.',240000,300000,55,'/assets/cream.svg'),
(4,1,3,'Serum Vitamin C','serum-vitamin-c','Serum sáng da Vitamin C 30ml.',299000,399000,60,'/assets/vitamin-c.svg'),
(5,1,4,'Serum cấp ẩm dịu nhẹ','serum-cap-am-diu-nhe','Cấp ẩm, phù hợp làn da thường.',278000,340000,50,'/assets/serum.svg'),
(6,3,2,'Kem chống nắng CeraVe','kem-chong-nang-cerave','SPF50, sử dụng mỗi ngày.',199000,240000,70,'/assets/sunscreen.svg');

INSERT IGNORE INTO coupons (id,code,discount_vnd,minimum_order_vnd,is_active,expires_at)
VALUES (1,'BG50',50000,500000,TRUE,'2030-12-31 23:59:59');
