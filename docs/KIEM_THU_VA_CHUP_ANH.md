# Các bước kiểm thử / ảnh cần chụp nộp bài BeautyGlow

Bạn có thể lần lượt tick từng bước và chụp ảnh màn hình đúng nơi.

| # | Thao tác | Kết quả mong đợi | Chụp ảnh |
|---|---|---|---|
| 1 | Chạy `01_schema.sql` trong Workbench | Hiện `beautyglow_db` với 12 bảng | Workbench → SCHEMAS |
| 2 | Mở `docs/BeautyGlow_ERD.png` | Sơ đồ PK/FK quan hệ các bảng | Ảnh ERD |
| 3 | Chạy `02_seed.sql` và `03_test_queries.sql` | Có 6 mỹ phẩm mẫu và giá | Result Grid MySQL |
| 4 | Chạy `npm run seed:demo` | Tạo tài khoản demo và 3 đơn | Terminal |
| 5 | Mở `http://localhost:4000/api/health` | JSON `ok:true`, `database:connected` | Trình duyệt |
| 6 | Đăng nhập `demo@beautyglow.local` | Vào Trang chủ | Giao diện web |
| 7 | Lọc sản phẩm 200k–500k | Loại sản phẩm 199k, giữ 240k/278k/299k/400k | Trang tìm kiếm |
| 8 | Thêm Serum Vitamin C | Giỏ tăng thêm 1 sản phẩm | Giỏ hàng |
| 9 | Chọn COD, đặt đơn | Tạo mã đơn `BG000...`, tổng 319k nếu 1 Serum, không áp mã | Thành công |
| 10 | Mở Đơn hàng → Chi tiết | Tổng tiền, địa chỉ, phương thức khớp | Chi tiết đơn |
| 11 | Workbench chạy `04_kiem_tra_du_lieu.sql` | Đơn mới nằm trong bảng `orders`/`order_items`/`payments` | Result Grid |
| 12 | Thử đăng ký email mới rồi đăng nhập | Tạo user mới, mật khẩu dạng hash | Ứng dụng + bảng users |

**Thử nghiệm lỗi nên trình bày:** Đăng nhập sai mật khẩu → 401; đặt khi chưa có địa chỉ → báo lỗi; mã giảm giá không hợp lệ → không tạo đơn; xóa sản phẩm khỏi giỏ → dữ liệu cart mất. Nhấn gửi đơn liên tục được hạn chế ở giao diện khi đang xử lý, nhưng chưa phải hệ thống ngăn lặp đơn sản phẩm thật.

Lệnh kiểm tra nhanh (trong MySQL Workbench):

```sql
USE beautyglow_db;
SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema='beautyglow_db';
SELECT id,name,price_vnd FROM products ORDER BY id;
SELECT order_code,total_vnd,status FROM orders ORDER BY id DESC;
SELECT o.order_code,oi.product_name,oi.quantity,oi.unit_price_vnd
FROM orders o JOIN order_items oi ON oi.order_id=o.id ORDER BY o.id DESC;
```
