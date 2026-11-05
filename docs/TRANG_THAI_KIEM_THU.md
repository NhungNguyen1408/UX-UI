# Biên bản kiểm tra kỹ thuật (ngày tạo project)

## Đã kiểm tra tại môi trường tạo file

- Đủ **12** lệnh `CREATE TABLE IF NOT EXISTS` trong `database/01_schema.sql`.
- Có script schema, seed sản phẩm, test queries, seed người dùng mẫu.
- `node --check src/index.js` và `node --check src/seed-demo.js`: **đạt** (cú pháp JavaScript backend).
- Kiểm tra cú pháp TypeScript parser cho `web/src/main.jsx`, `web/src/api.js`, `web/vite.config.js`: **0 lỗi cú pháp**.
- Graphviz dựng được ảnh ERD `1457 × 1095` và bản SVG.
- Có file `.env.example`, `.gitignore`, và hướng dẫn khởi chạy Windows.

## Chưa được kiểm thử thực tế ở môi trường tạo file

- Không có dịch vụ MySQL nên **chưa nhập/chạy SQL** và chưa chạy quy trình đăng nhập/đặt hàng trên cơ sở dữ liệu thật.
- Không tải được dependencies npm từ môi trường này; lệnh `npm run build` cho frontend dừng ở `vite: not found`. Đây là lỗi **thiếu thư viện trong môi trường tạo file**, không phải bằng chứng code build thất bại trên máy sau khi `npm install`.
- Ảnh chính chủ từ Figma không truy xuất được qua URL tại môi trường tạo file, nên các ảnh sản phẩm được thay bằng SVG minh họa tự tạo (nằm trong dự án).

Để kết luận ứng dụng chạy đúng trên máy cá nhân, hãy hoàn tất toàn bộ checklist ở `KIEM_THU_VA_CHUP_ANH.md` và chụp màn hình thực tế.
