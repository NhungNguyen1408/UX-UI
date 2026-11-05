# PHIEN BAN CAP NHAT - XAMPP + VS CODE

**Quan trong:** Neu ban dang su dung XAMPP/phpMyAdmin, hay mo `BAT_DAU_XAMPP.txt` va chay `CAU_HINH_XAMPP_WINDOWS.bat` truoc. Khong can cai MySQL Workbench. Database cu `beautyglow_db` duoc giu nguyen.

**Da bo sung:** Splash/Onboarding/Welcome, danh gia san pham, them/xoa dia chi, huy don cho xac nhan, bo loc trang thai don hang, giao dien home/banner cai tien; backend co endpoint `/api/products/:id/reviews`, `/api/orders/:id/cancel`, `DELETE /api/addresses/:id`. Kiem tra `npm test` trong ca `server` va `web`.

**Gioi han:** Chua test thuc te voi MySQL XAMPP tren may nguoi dung; chua chuyen du tat ca man Figma; MoMo la mo phong.

---

# BeautyGlow | Database MySQL + React + Node.js

Đây là bộ bài **Cách 3**: thiết kế cơ sở dữ liệu để nộp, sau đó chạy một phiên bản website BeautyGlow thật có kết nối MySQL. Giao diện tham khảo trực tiếp tông hồng, bố cục và nội dung các màn hình BeautyGlow trên Figma.

**Quan trọng:** Bộ web này là **MVP chạy được cho các chức năng chính**, không phải bản chuyển 1:1 toàn bộ hơn 100 màn hình Figma. Ảnh sản phẩm là SVG minh họa tự tạo vì không có bản tải ảnh gốc Figma tại môi trường phát triển. MoMo là **mô phỏng**: tạo đơn `PENDING`, **không chuyển tiền**. OTP, hoàn tiền, thông báo push chưa tích hợp dịch vụ thật.

## 1. Bạn sẽ nhận được gì?

| Thư mục/file | Nội dung |
|---|---|
| `database/01_schema.sql` | Tạo `beautyglow_db` và 12 bảng, PK/FK, ràng buộc |
| `database/02_seed.sql` | Danh mục, thương hiệu, 6 sản phẩm, mã BG50 |
| `database/03_test_queries.sql` | Truy vấn kiểm tra bảng, giá, đơn hàng |
| `database/04_kiem_tra_du_lieu.sql` | Truy vấn bổ sung để chụp minh chứng |
| `docs/BeautyGlow_ERD.png` | Sơ đồ quan hệ 12 bảng (mở hình hoặc chèn báo cáo) |
| `docs/BeautyGlow_ERD.svg` | Sơ đồ vector phóng to không vỡ |
| `server/` | Backend Node.js/Express + MySQL; đăng ký, đăng nhập, đặt hàng |
| `web/` | Web React/Vite mô phỏng giao diện BeautyGlow và gọi API |
| `docs/BANG_MO_TA_VA_LIEN_KET.md` | Thuyết minh cơ sở dữ liệu và luồng API |
| `docs/KIEM_THU_VA_CHUP_ANH.md` | Checklist chụp màn hình đưa vào báo cáo |
| `CAI_THU_VIEN_WINDOWS.bat` | Cài npm packages cho server và web |
| `CHAY_BEAUTYGLOW_WINDOWS.bat` | Mở hai Terminal chạy API và giao diện |

## 2. Bạn cần cài gì trên Windows?

Cài **MySQL Server 8.0 trở lên**, **MySQL Workbench** và **Node.js (phiên bản LTS)**. Trong lúc cài MySQL Server, nhớ mật khẩu `root` mà bạn tự đặt. Có thể dùng VS Code để sửa code.

Các địa chỉ chính thức: https://dev.mysql.com/downloads/installer/ , https://dev.mysql.com/downloads/workbench/ và https://nodejs.org/ .

Sau khi cài Node.js, mở **CMD** hoặc **PowerShell** và thử:

```powershell
node -v
npm -v
```

Kết quả phải hiện số phiên bản chứ không phải `not recognized`.

## 3. Nhập Database trong MySQL Workbench

1. Mở **MySQL Workbench**.
2. Chọn kết nối `Local instance MySQL`, nhập mật khẩu root khi được yêu cầu.
3. Bấm menu **File → Open SQL Script**.
4. Chọn `database/01_schema.sql`; nhấn nút **tia sét ⚡** để chạy **toàn bộ script**.
5. Mở tương tự `database/02_seed.sql` và nhấn ⚡.
6. Bên trái, trong **SCHEMAS**, nhấn biểu tượng refresh để thấy `beautyglow_db` và 12 bảng.
7. Chạy `database/03_test_queries.sql`. Bạn sẽ thấy sản phẩm và kết quả lọc giá.

**Đừng chạy `02_seed.sql` trước `01_schema.sql`.** Script schema dùng `CREATE DATABASE IF NOT EXISTS`; đã có bảng sẽ không tự xóa dữ liệu cũ.

## 4. Thiết lập Backend (làm một lần)

Mở thư mục `server` trong File Explorer. Tại đây, sao chép file `.env.example` thành file tên `.env` (chính xác là `.env`, không phải `.env.txt`). Bạn có thể làm qua CMD:

```powershell
cd server
copy .env.example .env
```

Mở `.env` bằng VS Code và sửa hai dòng sau:

```env
DB_PASSWORD=MAT_KHAU_ROOT_MYSQL_CUA_BAN
JWT_SECRET=CHUOI_BI_MAT_IT_NHAT_32_KY_TU_TU_TAO
```

* `DB_PASSWORD` là mật khẩu MySQL của **bạn**, không phải mật khẩu demo BeautyGlow.
* `JWT_SECRET` phải có tối thiểu 32 ký tự. Để tạo một chuỗi ngẫu nhiên mạnh, chạy trong CMD có Node.js:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy kết quả 64 ký tự vào `JWT_SECRET=`. Không gửi `.env` cho nhóm hoặc đưa lên GitHub.

Ở thư mục gốc của project, có thể nhấp đúp `CAI_THU_VIEN_WINDOWS.bat` để cài thư viện; hoặc tự làm qua hai CMD:

```powershell
cd server
npm install
```

## 5. Tạo tài khoản demo và ba đơn mẫu

Trong Terminal đang ở thư mục `server` (sau khi MySQL đã được import, `.env` đã sửa và `npm install` xong), chạy:

```powershell
npm run seed:demo
```

Tài khoản demo dùng **chỉ trong máy học tập**:

* Email: `demo@beautyglow.local`
* Mật khẩu: `BeautyGlow123!`

Tài khoản mẫu sẽ có 3 đơn tham khảo từ Figma: `BG123456` (MoMo mô phỏng, đang giao), `BG123457` (COD, chờ xác nhận), `BG123458` (Serum Vitamin C, chờ xác nhận). Chạy lại script sẽ không nhân đôi các đơn đã tạo.

## 6. Mở ứng dụng trên trình duyệt

Mở **hai Terminal CMD**, giữ cả hai đang mở:

**CMD 1, chạy backend:**

```powershell
cd server
npm run dev
```

Kết quả: `BeautyGlow API: http://localhost:4000/api/health`.

Mở đường dẫn **http://localhost:4000/api/health**. Nếu MySQL kết nối được, trình duyệt trả về:

```json
{"ok":true,"service":"BeautyGlow API","database":"connected"}
```

**CMD 2, chạy frontend:**

```powershell
cd web
npm install
npm run dev
```

Kết quả có dòng `Local: http://127.0.0.1:5173/` hoặc `http://localhost:5173/`.

Vào **http://localhost:5173** để dùng BeautyGlow. Ở những lần sau, bạn có thể nhấp đúp `CHAY_BEAUTYGLOW_WINDOWS.bat` (MySQL vẫn phải đang chạy).

## 7. Cách demo cho giảng viên

1. Mở BeautyGlow, chọn **Đăng nhập** và dùng tài khoản demo ở trên.
2. Chọn **Danh mục** hoặc **Trang chủ**; nhập `Serum` tại ô tìm kiếm.
3. Chọn lọc **200k–500k**: API truy vấn trực tiếp MySQL để trả về sản phẩm đúng giá.
4. Chọn **Serum Vitamin C 299.000đ**, bấm **Thêm vào giỏ hàng**.
5. Mở **Giỏ hàng**, tăng/giảm số lượng rồi chuyển sang Thanh toán.
6. Chọn địa chỉ mặc định, chọn **COD** hoặc **MoMo (mô phỏng)**.
7. Bấm **Xác nhận đặt hàng**; ứng dụng tạo `orders`, `order_items`, `payments`, trừ tồn kho và xóa giỏ trong một giao dịch MySQL.
8. Mở **Đơn hàng** và xem chi tiết. Mở MySQL Workbench chạy `database/04_kiem_tra_du_lieu.sql` để chứng minh dữ liệu đã lưu.
9. Qua **Tài khoản → Đăng xuất** để kết thúc demo.

Mã `BG50` giảm 50.000đ cho đơn từ 500.000đ. Phí giao hàng demo là 20.000đ. Do vậy đơn Serum Vitamin C 299.000đ có tổng thanh toán **319.000đ** nếu không áp mã.

## 8. Các lỗi thường gặp

| Thông báo/lỗi | Cách khắc phục |
|---|---|
| `Access denied for user 'root'` | Kiểm tra `DB_USER`, `DB_PASSWORD` trong `server/.env` |
| `Unknown database 'beautyglow_db'` | Chưa chạy `01_schema.sql` |
| `Table ... doesn't exist` | Chưa chạy hết script schema |
| `node` hoặc `npm` not recognized | Cài Node LTS, đóng/mở lại CMD |
| `vite not found` | Vào thư mục `web`, chạy `npm install` trước |
| Trang không có sản phẩm | Chưa import `02_seed.sql`, hoặc API/MySQL đang lỗi |
| `JWT_SECRET` không hợp lệ | Đổi `JWT_SECRET` thành chuỗi ngẫu nhiên dài từ 32 ký tự |
| `EADDRINUSE` cổng 4000 hoặc 5173 | Đóng cửa sổ Terminal đang chạy ứng dụng ở cổng đó |
| `.env` không được đọc | Kiểm tra file tên `.env` (Windows đang ẩn phần mở rộng `.txt`?) |
| Chọn COD/MoMo không chuyển tiền | Đúng mục đích: chỉ mô phỏng nghiệp vụ mua hàng |

## 9. Lưu ý khi nộp

* Thư mục cần nộp: `database/`, `docs/`, `server/`, `web/` và README.
* Khi chia sẻ lên GitHub, **không thêm** file `.env`, `node_modules/`, mật khẩu tài khoản thật hay dữ liệu cá nhân.
* Nên chụp màn SQL trong Workbench, ERD, đăng nhập, kết quả lọc, giỏ hàng, đặt hàng và danh sách đơn để chứng minh.
* Đây là **bài tập thực hành**, chưa đáp ứng toàn bộ tiêu chí bảo mật và tích hợp production (OAuth, OTP email, MoMo thật, quản trị hàng, triển khai cloud, cookie bảo mật...).
