# Checklist bàn giao

## Cài đặt và database

- [ ] Đã cài Node.js/npm — phiên bản chính thức **CHƯA XÁC MINH**.
- [ ] Đã cài MySQL/MariaDB và tạo database `ecommerce`.
- [ ] Đã đối chiếu `database/ecommerce.sql` với migration 001–014.
- [ ] Đã xác nhận migration nào đã chạy trên database thật.
- [ ] Đã backup trước mọi migration/seed.
- [ ] Đã xác nhận các bảng chat, voucher, staff, attendance, payroll, review và notification tồn tại.

## Backend/frontend

- [ ] `npm install` đã chạy trong `backend`.
- [ ] `npm install` đã chạy trong `frontend`.
- [ ] Đã tạo `backend/.env` với secret mới và không công khai.
- [ ] Backend chạy tại `http://localhost:5000`.
- [ ] `GET /api/products` trả phản hồi hợp lệ.
- [ ] Frontend chạy tại `http://localhost:3000`.
- [ ] Đã kiểm tra API URL/proxy và CORS.
- [ ] Đã kiểm tra Socket.IO chat/thông báo.
- [ ] Đã chạy `npm run build` frontend.

## Tài khoản và quyền

- [ ] Đã tạo tài khoản Admin đầu tiên qua quy trình được phê duyệt — hiện **CHƯA XÁC MINH**, không tự tạo.
- [ ] Đã thiết lập Manager — **CHƯA XÁC MINH**.
- [ ] Đã thiết lập Staff — **CHƯA XÁC MINH**.
- [ ] Đã đăng ký/kiểm tra Customer.
- [ ] Đã kiểm tra đăng nhập tại `/login` cho từng vai trò.
- [ ] Đã kiểm tra điều hướng `/admin/dashboard`, `/manager/workspace`, `/staff/workspace`, `/home`.
- [ ] Đã kiểm tra quyền bằng request backend, không chỉ dựa vào ẩn/hiện UI.
- [ ] Đã thay mật khẩu mặc định/demo nếu có.
- [ ] Đã bàn giao thông tin truy cập qua kênh riêng an toàn.

## Chức năng nghiệm thu

- [ ] Sản phẩm, tìm kiếm, biến thể, ảnh.
- [ ] Giỏ hàng, checkout, voucher.
- [ ] Tạo và theo dõi đơn, cập nhật trạng thái, hủy, trả/bảo hành.
- [ ] Chat customer–staff và Socket.IO.
- [ ] Thông báo.
- [ ] Quản lý sản phẩm/danh mục/voucher.
- [ ] Nhân sự, phê duyệt, ca, chấm công, payroll, tồn kho.
- [ ] Báo cáo/thống kê.

## Các vấn đề phải xử lý trước bàn giao chính thức

- [ ] Thống nhất role IDs/names giữa `ecommerce.sql`, migration 003 và controller đăng ký.
- [ ] Xác định cách cấu hình DB an toàn thay cho password hard-code.
- [ ] Bổ sung hoặc xác nhận script start backend.
- [ ] Xác nhận danh sách migration đã chạy và thứ tự áp dụng.
- [ ] Xác nhận quy trình tạo Admin/Manager/Staff không cần liên hệ lập trình viên.
- [ ] Kiểm thử API authorization cho từng role.
- [ ] Xác nhận package root có dùng hay loại khỏi quy trình cài đặt.

