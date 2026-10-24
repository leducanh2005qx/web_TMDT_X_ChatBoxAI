# Tiger Shop — Tài liệu bàn giao

## 1. Phạm vi và trạng thái xác minh

Tài liệu này được lập từ source hiện có trong repository. Không chạy migration, seed, lệnh ghi database hoặc thay đổi source code. Những nội dung không thể chứng minh trực tiếp từ file được đánh dấu **CHƯA XÁC MINH**.

## 2. Tổng quan

Đây là ứng dụng thương mại điện tử gồm:

- `backend/`: Node.js CommonJS, Express, MySQL, JWT, Socket.IO.
- `frontend/`: React chạy bằng Create React App (`react-scripts`).
- `database/`: schema gốc và các migration SQL.

Backend khởi động từ `backend/server.js`, mặc định cổng `5000`. Frontend khởi động từ `frontend/`, mặc định cổng `3000`. Frontend khai báo proxy `http://localhost:5000`, nhưng nhiều component cũng đang gọi trực tiếp URL này.

## 3. Công nghệ và cấu trúc

### Backend

Dependencies được khai báo trong [backend/package.json](backend/package.json): Express, mysql2, bcrypt, jsonwebtoken, cors, dotenv, multer, Socket.IO, express-rate-limit, Nodemailer và các thư viện Google Generative AI.

### Frontend

Dependencies được khai báo trong [frontend/package.json](frontend/package.json): React, React DOM, React Router DOM, react-scripts, Socket.IO client, Bootstrap, Tailwind CSS, Three.js, React Three Fiber/Drei, Recharts, Swiper, React Markdown và các thư viện UI/testing.

`package.json` ở thư mục gốc có cấu hình khác với `frontend/package.json`; khi cài đặt phải chạy đúng thư mục tương ứng. Không coi package root là manifest đầy đủ của frontend.

## 4. Cài đặt nhanh trên Windows / PowerShell

Yêu cầu: Node.js và npm, MySQL/MariaDB hoặc XAMPP/Laragon, VS Code. Phiên bản Node cụ thể **CHƯA XÁC MINH** vì package không khai báo `engines`. Source đã được kiểm tra với Node `v22.20.0` trong môi trường audit; đây không phải yêu cầu chính thức của dự án.

```powershell
cd F:\phantichphanmem\backend
npm install
npm start # CHƯA XÁC MINH: backend không khai báo script start
```

Backend hiện không có `scripts` trong `backend/package.json`. Lệnh chạy trực tiếp có bằng chứng từ source là:

```powershell
node server.js
```

Mở terminal thứ hai:

```powershell
cd F:\phantichphanmem\frontend
npm install
npm start
```

Build frontend:

```powershell
cd F:\phantichphanmem\frontend
npm run build
```

## 5. Database

DB engine được xác định là MySQL qua `mysql2`, câu lệnh SQL và file [backend/config/db.js](backend/config/db.js). Database cấu hình là `ecommerce`, host `localhost`, user `root`. Password đang để rỗng trong source; không dùng giá trị này như thông tin bàn giao an toàn.

Schema nền là [database/ecommerce.sql](database/ecommerce.sql). Các migration được đánh số `001` đến `014` trong [database/migrations](database/migrations). Thứ tự tên số tăng dần là thứ tự dự kiến, nhưng repository không có migration runner tổng quát; trạng thái database thực tế **CHƯA XÁC MINH**.

Không chạy các file SQL tự động trong tài liệu này. Một số script có `ALTER`, `DELETE`, `UPDATE` hoặc `INSERT`, nên chỉ người quản trị database được ủy quyền mới thực hiện sau khi backup.

## 6. Môi trường

Backend đọc `PORT`, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_API_KEY_SALE`, `GEMINI_API_KEY_RETURN`, `GEMINI_API_KEY_VOUCHER` qua `process.env`. `JWT_SECRET` là bắt buộc để đăng nhập/token hoạt động; các key Gemini chỉ cần cho phần AI tương ứng. Giá trị thật **KHÔNG ĐƯỢC** đưa vào README.

Tạo file `backend/.env` cục bộ, không commit:

```dotenv
PORT=5000
JWT_SECRET=thay-bang-chuoi-bi-mat-moi
GEMINI_API_KEY=neu-su-dung-ai
GEMINI_API_KEY_SALE=neu-su-dung-ai
GEMINI_API_KEY_RETURN=neu-su-dung-ai
GEMINI_API_KEY_VOUCHER=neu-su-dung-ai
```

Lưu ý: `db.js` hiện cấu hình kết nối trực tiếp bằng hằng số, không đọc `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` từ `.env`.

## 7. Đăng nhập và vai trò

URL frontend: `http://localhost:3000/login`. Customer đăng ký tại `http://localhost:3000/register`. Sau đăng nhập, source điều hướng theo role về `/home`, `/admin/dashboard`, `/manager/workspace` hoặc `/staff/workspace`.

Các role xuất hiện trong code/database: `ADMIN`, `MANAGER`, `STAFF`, `CUSTOMER`; schema gốc còn có `SALES`, `WAREHOUSE`, trong khi migration 003 chèn role ID 1–4 theo tên `Admin`, `Manager`, `Staff`, `Customer`. Đây là mâu thuẫn cần xử lý khi triển khai, chưa tự sửa.

- Customer: đăng ký công khai qua `/api/auth/register`, controller gán `role_id = 5`.
- Admin: có middleware và route quản trị, nhưng không có seed/script tạo admin đầu tiên được xác minh. **CHƯA XÁC MINH**.
- Manager/Staff: có API tạo/duyệt nhân sự; cách tạo tài khoản đầu tiên phụ thuộc dữ liệu DB hiện hữu và quyền admin/manager. **CHƯA XÁC MINH**.
- Không có mật khẩu mẫu an toàn được công bố trong tài liệu này.

## 8. Chức năng đã thấy trong source

Frontend/backend có bằng chứng cho: đăng ký/đăng nhập; xem/tìm sản phẩm; giỏ hàng/checkout; đơn hàng, hủy, đổi địa chỉ, yêu cầu trả/bảo hành; voucher; đánh giá sản phẩm; thông báo; chat customer–staff; AI chat; quản lý sản phẩm/danh mục/biến thể; quản lý đơn; quản lý user/role/status; ca làm; chấm công; yêu cầu nhân sự; payroll; tồn kho; báo cáo thống kê.

Trạng thái tích hợp end-to-end của từng chức năng **CHƯA ĐƯỢC chạy nghiệm thu trong môi trường database thực tế**. Chi tiết route và quyền nằm trong [docs/TECHNICAL_REPORT.md](docs/TECHNICAL_REPORT.md).

## 9. Xử lý lỗi thường gặp

- Không kết nối DB: kiểm tra MySQL đang chạy, database `ecommerce` tồn tại, schema/migration đã áp dụng đúng thứ tự.
- Thiếu JWT: tạo `backend/.env` và đặt `JWT_SECRET` mới.
- Port bị chiếm: đổi `PORT` backend; frontend vẫn cần trỏ đúng proxy/API URL.
- Frontend không gọi API: kiểm tra backend ở `http://localhost:5000`, proxy trong `frontend/package.json`, CORS và các URL hard-code.
- CORS/socket lỗi: kiểm tra backend đang chạy cùng host/port `5000`; Socket.IO client đang dùng cả URL trực tiếp và transport `websocket`.
- Đăng nhập lỗi: kiểm tra role ID/name giữa `ecommerce.sql`, migration 003 và dữ liệu thực tế.
- Import SQL lỗi: xem migration phụ thuộc bảng/cột trước đó; không chạy lại `ALTER TABLE` mù quáng.

## 10. Tài liệu chi tiết

- [docs/INSTALLATION.md](docs/INSTALLATION.md)
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
- [docs/TECHNICAL_REPORT.md](docs/TECHNICAL_REPORT.md)
- [docs/HANDOVER_CHECKLIST.md](docs/HANDOVER_CHECKLIST.md)

