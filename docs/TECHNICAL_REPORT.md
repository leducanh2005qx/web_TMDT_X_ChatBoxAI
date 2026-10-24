# Báo cáo kỹ thuật và kiểm toán source

## 1. Kiến trúc

Kiến trúc hiện tại là frontend React SPA → REST API Express → MySQL, kèm Socket.IO cho chat/thông báo. Backend mount các nhóm `/api/auth`, `/api/users`, `/api/products`, `/api/orders`, `/api/categories`, `/api/chat`, `/api/shifts`, `/api/vouchers`, `/api/gifts`, `/api/user-vouchers` và `/api/notifications` trong `backend/server.js`.

## 2. Runtime và package

Backend: Node.js CommonJS, Express 4, mysql2, bcrypt, JWT, CORS, dotenv, multer, Socket.IO, rate limit, Nodemailer, Google Generative AI. Frontend: React 19 theo manifest hiện tại, React Router 7, CRA 5, Socket.IO client 4, Three.js/React Three Fiber, Bootstrap, Tailwind, Recharts, Swiper, React Markdown và testing-library.

Version được khai báo bằng range trong package.json; version cài thực tế chỉ được khẳng định khi lockfile và `node_modules` cùng được kiểm tra. Node engine không được khai báo. Root package manifest lệch với frontend manifest và là rủi ro bàn giao.

## 3. Database

Schema gốc có `roles`, `users`; migration bổ sung products, categories, orders, order_items, order_logs, reviews, variants, vouchers, voucher_products/categories/usages, gifts, chat, AI history, notifications, inventory, payroll, staff requests, shifts và attendance. Danh sách bảng thực tế phụ thuộc migration đã chạy; **CHƯA XÁC MINH**.

Kết nối backend dùng pool mysql2 trong `backend/config/db.js`, hard-code host `localhost`, user `root`, database `ecommerce`. Cấu hình password và database thực tế trên máy khách chưa được xác minh.

## 4. Authentication/authorization

`authController` đăng ký customer, hash bằng bcrypt và đăng nhập bằng bcrypt/JWT. `authMiddleware` xác thực Bearer token và kiểm tra user còn tồn tại/active. `roleMiddleware` kiểm tra role; các route cụ thể khai báo nhóm role như ADMIN/MANAGER/STAFF. `optionalAuth` cho product listing công khai có thể nhận thêm ngữ cảnh đăng nhập.

Điểm cần chú ý:

- `ecommerce.sql` tạo role `ADMIN`, `MANAGER`, `SALES`, `WAREHOUSE`, `CUSTOMER`.
- Migration 003 chèn role ID 1–4 với tên `Admin`, `Manager`, `Staff`, `Customer`.
- Controller đăng ký customer dùng `role_id = 5`.
- Một số frontend route guard là lớp UI; quyền cuối cùng cần dựa vào backend middleware.

Đây là bất nhất schema/role đã xác minh từ file, chưa sửa.

## 5. API và chức năng

| Nhóm | Bằng chứng source |
|---|---|
| Auth | `authRoutes.js`, `authController.js`: register/login |
| Products | CRUD, pending/decided, restore, decision, reviews, upload ảnh, variants |
| Orders | tạo/xem/hủy/địa chỉ/trả-bảo hành; admin/staff status, invoice/refund, stats |
| Voucher/gift | CRUD voucher, apply, user voucher, gift eligibility/admin |
| User/HR | profile, staff, role/status, requests, shifts, attendance, payroll, inventory |
| Chat | customer thread/messages, staff/admin threads, Socket.IO events |
| Notification | unread/list/mark-read và socket badge |
| AI | AI talk/history/unified chat; AI qua Gemini phụ thuộc key môi trường |

Tích hợp end-to-end chưa được nghiệm thu với DB thực tế. Không ghi là “đã hoàn thiện” chỉ vì route/component tồn tại.

## 6. Socket.IO

Backend khởi tạo Socket.IO trong `backend/socket.js`, có room theo thread/user, event `join_thread`, `joinUserRoom`, `request_staff`, `staff_join`, `staff_toggle_ai`, `send_message`, `receive_message`, `newMessage`, `new_notification_count`. Frontend kết nối tới `http://localhost:5000`, một số nơi ép transport websocket. Trạng thái chạy thực tế **CHƯA XÁC MINH**.

## 7. Package audit

Dependencies và devDependencies: cả hai manifest backend/frontend hiện chỉ có trường `dependencies`; không có `devDependencies` được khai báo. Việc một package có trong manifest không chứng minh đã cài thành công. Lockfiles tồn tại cho backend/frontend/root.

Danh sách package có import trực tiếp được xác nhận theo source gồm các nhóm nêu ở mục 2. Một số package UI/testing có thể chỉ xuất hiện trong dependency graph hoặc cấu hình CRA; danh sách “khai báo nhưng không dùng” đầy đủ **CHƯA XÁC MINH bằng static analyzer chuyên dụng**. Không phát hành kết luận thiếu package nếu chưa kiểm tra toàn bộ import.

## 8. Lỗi/rủi ro đã xác minh và có thể xảy ra

Đã xác minh từ source: backend thiếu scripts npm; DB credentials hard-code; biến DB `.env` không được dùng; role/schema không đồng nhất; frontend có nhiều API URL hard-code; source có các script migration/seed có tác động ghi DB; AI/socket có nhánh bị comment/tắt trong một số luồng.

Có thể xảy ra nhưng chưa chạy xác nhận: lỗi CORS, Socket.IO không kết nối, import migration sai thứ tự, thiếu `JWT_SECRET`, thiếu Gemini key, port bị chiếm, frontend gọi sai API, database chưa có bảng phụ thuộc, đăng nhập sai role ID.

