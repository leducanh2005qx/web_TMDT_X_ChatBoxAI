# Hướng dẫn sử dụng

## Khách hàng

1. Mở `http://localhost:3000/register` để tạo tài khoản customer với họ tên, email, mật khẩu và số điện thoại.
2. Đăng nhập tại `/login`.
3. Dùng `/home` hoặc `/shop` để xem sản phẩm; mở `/product/:id` để xem chi tiết, chọn biến thể và thêm vào giỏ.
4. Mở `/cart`, sau đó `/checkout` để đặt hàng.
5. Theo dõi tại `/orders`, xem chi tiết tại `/orders/:id`; source có thao tác hủy đơn, đổi địa chỉ và yêu cầu trả/bảo hành theo trạng thái.
6. Dùng `/vouchers`, `/profile`, `/notifications` và chat hỗ trợ.

## Admin

Đăng nhập chung tại `/login`; sau đó frontend bảo vệ các đường dẫn `/admin/*`. Source có dashboard, quản lý người dùng, thống kê, system logs, duyệt sản phẩm và chat. Cách tạo admin đầu tiên không có seed/script xác minh được trong repository: **CHƯA XÁC MINH — không tự tạo thông tin đăng nhập**.

## Manager

Đăng nhập chung tại `/login`, sau đó frontend điều hướng về `/manager/workspace`. Source có workspace, sản phẩm, đơn, tồn kho, payroll, duyệt, attendance, shifts và voucher. Việc tạo Manager ban đầu cần dữ liệu tài khoản hợp lệ hoặc thao tác của role có quyền; quy trình cụ thể **CHƯA XÁC MINH**.

## Staff

Đăng nhập chung tại `/login`, sau đó frontend điều hướng về `/staff/workspace`. Source có orders, support chat, attendance, requests, shifts và payroll. Cách tạo Staff được thể hiện qua các API user/staff và luồng duyệt, nhưng dữ liệu ban đầu thực tế **CHƯA XÁC MINH**.

## Quyền thực tế

Backend dùng JWT trong `Authorization: Bearer <token>`, giải mã bằng `JWT_SECRET`, rồi kiểm tra `role_name`/role. Các nhóm route chính:

| Vai trò | Quyền có bằng chứng trong route |
|---|---|
| ADMIN | Quản trị user, logs, thống kê, sản phẩm, đơn, chat, voucher và danh mục tùy route |
| MANAGER | Sản phẩm, đơn, thống kê, voucher, danh mục, nhân sự/ca/tồn kho tùy route |
| STAFF | Đơn hàng, chat hỗ trợ, ca và chấm công tùy route |
| CUSTOMER | Đăng ký, sản phẩm công khai, đơn của mình, voucher, profile, thông báo, chat |

Không suy diễn quyền ngoài route. UI guard và backend guard không hoàn toàn là cùng một danh sách; cần kiểm thử từng endpoint trước bàn giao chính thức.

## Tài khoản và mật khẩu

Không có password demo trong tài liệu. Không giải mã hash. Nếu mất password, dùng luồng reset password của hệ thống hoặc kênh quản trị an toàn; source có endpoint reset cho role được phép, nhưng cách vận hành và kiểm thử thực tế **CHƯA XÁC MINH**.

