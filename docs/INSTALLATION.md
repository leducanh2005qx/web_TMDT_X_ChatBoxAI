# Hướng dẫn cài đặt

## 1. Chuẩn bị

Trên Windows cài Node.js/npm và MySQL, có thể dùng XAMPP hoặc Laragon. Phiên bản Node chính thức không được khai báo trong repository (**CHƯA XÁC MINH**). Không cần cài thư viện toàn cục.

## 2. Cài dependencies

```powershell
cd F:\phantichphanmem\backend
npm install
cd ..\frontend
npm install
```

Lockfile tương ứng là `backend/package-lock.json` và `frontend/package-lock.json`. Không dùng lockfile root để thay thế hai lockfile này.

## 3. Tạo database

Trong MySQL Workbench hoặc phpMyAdmin/Laragon, mở `database/ecommerce.sql` và thực hiện trên môi trường mới. File này tạo database `ecommerce`, bảng `roles`, `users` và dữ liệu role ban đầu.

Các file trong `database/migrations` mở rộng bảng theo thứ tự số. Đọc/đối chiếu từng migration trước khi chạy; repository không có bảng theo dõi migration. Không đưa password/hash/token lên tài liệu.

Các script như `backend/setup_db.js`, `backend/scripts/run_migration_009.js`, `backend/scripts/seedAllProducts.js`, `backend/scripts/generateVariants.js` và các file `migrate_*.js` có thể ghi dữ liệu hoặc thay đổi schema. Chỉ dùng sau backup và phê duyệt riêng; tài liệu này không tự chạy chúng.

## 4. Cấu hình backend

Tạo `backend/.env` theo mẫu trong README. `backend/config/db.js` hiện vẫn dùng `localhost`, `root`, database `ecommerce` và password rỗng bằng code; nếu máy khách dùng password MySQL khác, cần cập nhật source hoặc cơ chế cấu hình trước khi vận hành (**CHƯA XÁC MINH quy trình cấu hình chính thức**).

Chạy:

```powershell
cd F:\phantichphanmem\backend
node server.js
```

Backend nghe `http://localhost:5000` theo mặc định. Source không có endpoint health riêng; kiểm tra không gây ghi dữ liệu bằng `GET http://localhost:5000/api/products` sau khi database sẵn sàng.

## 5. Cấu hình frontend

```powershell
cd F:\phantichphanmem\frontend
npm start
```

Frontend chạy tại `http://localhost:3000`. `frontend/package.json` có proxy `http://localhost:5000`; tuy vậy source còn nhiều URL hard-code `http://localhost:5000`, nên đổi proxy hoặc `REACT_APP_API_URL` riêng lẻ chưa chắc đủ.

## 6. Chạy production

```powershell
cd F:\phantichphanmem\frontend
npm run build
```

Backend không có script production riêng và không có cấu hình triển khai trong repository (**CHƯA XÁC MINH**). Thư mục build cần được phục vụ bởi web server phù hợp; không có bằng chứng backend đang serve build frontend.

## 7. Lỗi cài đặt

Nếu `npm` bị PowerShell chặn execution policy, dùng `npm.cmd` hoặc mở terminal Node.js phù hợp; không thay đổi policy hệ thống nếu chưa được quản trị viên cho phép. Nếu thiếu package, chạy `npm install` trong đúng thư mục, không sửa package.json bằng tay.

