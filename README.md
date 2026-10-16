# 🍚 Cơm Tấm Ông Mập — comtam.net
> **Đậm đà vị ngon Sài Gòn xưa · Đặt món Online & Order tại bàn bằng quét mã QR kết nối PostgreSQL**

[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](https://github.com/haileevn/comtamnet)
[![Database](https://img.shields.io/badge/database-PostgreSQL%2014-blue.svg)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/runtime-Node.js%20LTS-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

---

## 📖 Giới Thiệu

**Cơm Tấm Ông Mập** ([`comtam.net`](http://localhost:8000)) là nền tảng quản trị và gọi món nhà hàng cơm tấm hiện đại, giữ nguyên phong vị Sài Gòn xưa với giao diện bàn xoay tròn truyền thống (Lazy Susan) kết hợp các công nghệ trải nghiệm số tiên tiến:

1. **Order tại bàn bằng quét mã QR (Dine-in)**:
   - Khách quét mã QR dán trên bàn ăn (URL dạng `/?table=XX`), hệ thống tự nhận diện số bàn.
   - Nút **Gọi Phục Vụ 1-chạm**: Xin thêm nước mắm kẹo, đá lạnh, khăn lạnh, thêm chén canh, dọn bàn, xin tính tiền.
   - Nút **Hóa Đơn Bàn**: Kiểm tra tức thời các món bàn đã gọi và tổng tiền.
   - Miễn phí vận chuyển (0đ), tự động tối ưu hóa form thanh toán.
2. **Cơ sở dữ liệu quan hệ PostgreSQL (`comtam_db`)**:
   - Quản lý dữ liệu tập trung, bền vững: `restaurant_tables`, `waiter_calls`, `orders`, `dishes`, `users`.
   - Đồng bộ hóa 2 chiều liên tục giữa máy chủ Node.js và giao diện người dùng.
3. **Thanh toán trực tuyến VietQR (Napas 24/7)**:
   - Sinh mã VietQR động tự động kèm chính xác số tiền và cú pháp chuyển khoản (`COMTAM CTM-xxxx`).
   - Cổng duyệt nhanh thanh toán trực tuyến 1-click cho nhân viên thu ngân.
4. **Thẻ thành viên VIP 3D Holographic**:
   - Thẻ hội viên phân hạng tự động: **Silver**, **Gold**, **Diamond**.
   - Tích lũy điểm khi ăn cơm (1 điểm cho mỗi 10.000đ) và đổi điểm trừ tiền trên hóa đơn.
5. **Cổng Quản Trị Bếp & Thu Ngân (Admin Portal)**:
   - Sơ đồ **12 bàn ăn** trực quan thời gian thực (Trống, Đang ăn, Tính tiền, Đang gọi phục vụ).
   - Chuông báo âm thanh Web Audio API cảnh báo khi có đơn mới hoặc khách tại bàn gọi nhân viên.
   - In phiếu bếp nhiệt chuẩn 80mm và trang in **Bộ Standee Mã QR 12 Bàn Ăn** chuẩn khổ in A4.

---

## 🚀 Cài Đặt & Khởi Chạy

### Yêu Cầu Hệ Thống:
- **Node.js** (v18 trở lên)
- **PostgreSQL** (v14 trở lên)

### Bước 1: Clone kho mã nguồn
```bash
git clone https://github.com/haileevn/comtamnet.git
cd comtamnet
```

### Bước 2: Cài đặt thư viện
```bash
npm install
```

### Bước 3: Chuẩn bị Cơ sở dữ liệu PostgreSQL
Khởi tạo cơ sở dữ liệu `comtam_db` (mặc định server sẽ tự động tạo bảng và nạp 12 món ăn, 12 bàn ăn, khách hàng VIP mẫu trong lần khởi chạy đầu tiên):
```bash
createdb comtam_db
```
*(Hoặc cấu hình thông tin kết nối qua biến môi trường `DATABASE_URL`)*.

### Bước 4: Chạy ứng dụng
```bash
npm start
```
Mở trình duyệt truy cập:
- **Trang chủ khách hàng**: [http://localhost:8000](http://localhost:8000)
- **Khách quét mã Bàn 05**: [http://localhost:8000/?table=5](http://localhost:8000/?table=5)
- **In bộ Standee QR 12 Bàn**: [http://localhost:8000/api/tables/print-qr](http://localhost:8000/api/tables/print-qr)

---

## 🛠️ Tài Khoản Quản Trị Mặc Định

Bấm nút **`⚙️ Quản Trị Bếp`** trên góc phải màn hình:
- **Hỗ trợ 1-click**: Bấm nút **`⚡ 1-Click Vào Thẳng Quản Trị`**
- **Hoặc đăng nhập thủ công**:
  - Tài khoản: `admin`
  - Mật khẩu: `admin`

---

## 📂 Cấu Trúc Dự Án

```
comtamnet/
├── index.html            # Giao diện chính: Bàn xoay, Giỏ hàng, Modal Bàn & Đơn hàng
├── server.js             # Máy chủ Node.js phục vụ REST API & Static Files
├── db.js                 # Kết nối PostgreSQL (Pool, Migrations & Initial Seed)
├── package.json          # Cấu hình dự án & scripts khởi chạy
├── .gitignore            # Bỏ qua node_modules, os files, log files
└── assets/
    ├── styles.css        # Giao diện cốt lõi & hiệu ứng bàn xoay Lazy Susan
    ├── order-styles.css  # Giao diện Order tại bàn, QR code, Modal & Admin Portal
    ├── store.js          # Quản lý trạng thái (Store State) & đồng bộ PostgreSQL
    ├── order-system.js   # Logic nghiệp vụ gọi món tại bàn, chuông gọi & quản trị
    ├── demo-menu-data.js # Danh mục món mẫu & nguyên liệu Sài Gòn
    ├── logo-ong-map.svg  # Logo chính thức Cơm Tấm Ông Mập (comtam.net)
    └── icons/            # Bộ icon SVG chuyên dụng
```

---

## 📜 Giấy Phép
Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
Bản quyền thuộc về **Cơm Tấm Ông Mập (comtam.net)**.
