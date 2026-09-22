/**
 * reseed_tiger_shop.js
 * ─────────────────────────────────────────────────────────────
 * Dọn sạch categories + products và nạp mới chuẩn cho Tiger Shop
 * Chạy: node reseed_tiger_shop.js
 * ─────────────────────────────────────────────────────────────
 */
require('dotenv').config();
const db = require('./config/db');

// ============================================================
//  📂 DANH MỤC CHUẨN (không trùng lặp)
// ============================================================
const CATEGORIES = [
  { name: 'Nội thất',             slug: 'furniture'    },
  { name: 'Thời trang nam',       slug: 'men-fashion'  },
  { name: 'Thời trang nữ',        slug: 'women-fashion'},
  { name: 'Đồ ăn',               slug: 'food'         },
  { name: 'Thiết bị điện tử',    slug: 'electronics'  },
  { name: 'Phụ kiện điện thoại', slug: 'accessories'  },
  { name: 'Máy ảnh',             slug: 'camera'       },
  { name: 'Đồng hồ',             slug: 'watches'      },
  { name: 'Giày dép nam',        slug: 'men-shoes'    },
  { name: 'Giày dép nữ',         slug: 'women-shoes'  },
];

// ============================================================
//  🛍️ SẢN PHẨM – 5 sản phẩm/danh mục, ảnh Unsplash đúng chủ đề
// ============================================================
// Hàm tiện ích tạo URL Unsplash với seed cố định (ảnh không đổi)
const img = (keyword, seed) =>
  `https://images.unsplash.com/photo-${seed}?w=600&q=80&auto=format&fit=crop`;

const PRODUCTS_BY_SLUG = {
  'furniture': [
    {
      name: 'Bàn Làm Việc Gỗ Tự Nhiên Chân Sắt',
      price: 1450000,
      original_price: 1800000,
      stock: 35,
      description: 'Bàn làm việc gỗ tự nhiên chân sắt sơn tĩnh điện, thiết kế tối giản hiện đại, chịu lực tốt, phù hợp văn phòng và phòng học.',
      image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Ghế Công Thái Học Ergonomic Văn Phòng',
      price: 2150000,
      original_price: 2800000,
      stock: 28,
      description: 'Ghế công thái học với tựa lưng điều chỉnh, đệm ngồi dày dặn, lý tưởng cho người ngồi làm việc nhiều giờ.',
      image: 'https://images.unsplash.com/photo-1596162954151-cdcb4c0f70fb?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Kệ Sách 5 Tầng Gỗ Sồi Hiện Đại',
      price: 890000,
      original_price: 1200000,
      stock: 42,
      description: 'Kệ sách 5 tầng gỗ sồi tự nhiên phong cách Bắc Âu, dễ lắp ráp, chịu tải tốt, phù hợp mọi không gian.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Tủ Đầu Giường 2 Ngăn Bắc Âu',
      price: 480000,
      original_price: 650000,
      stock: 50,
      description: 'Tủ đầu giường 2 ngăn kéo phong cách Bắc Âu, màu trắng tối giản, tiết kiệm không gian, dễ vệ sinh.',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Ghế Sofa Băng Nỉ Phòng Khách',
      price: 4600000,
      original_price: 5900000,
      stock: 20,
      description: 'Sofa băng 3 chỗ ngồi vải nỉ cao cấp, khung gỗ chắc chắn, đệm dày êm ái, tôn lên vẻ đẳng cấp phòng khách.',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&auto=format&fit=crop',
    },
  ],

  'men-fashion': [
    {
      name: 'Áo Polo Nam Pique Cotton Co Giãn',
      price: 290000,
      original_price: 380000,
      stock: 45,
      description: 'Áo polo nam chất vải Pique cotton co giãn 4 chiều, thoáng mát, thấm hút mồ hôi tốt, phù hợp đi làm đi chơi.',
      image: 'https://images.unsplash.com/photo-1625910513291-3b21e99e84ec?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Quần Jean Nam Slimfit Co Giãn',
      price: 420000,
      original_price: 550000,
      stock: 40,
      description: 'Quần jean nam dáng slimfit co giãn nhẹ, vải denim cao cấp, form chuẩn tôn dáng, màu xanh đậm thời thượng.',
      image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Áo Sơ Mi Nam Trắng Công Sở Dài Tay',
      price: 350000,
      original_price: 450000,
      stock: 38,
      description: 'Áo sơ mi công sở dài tay màu trắng tinh, chất lụa tơ tằm giả cao cấp, chống nhăn tốt, phù hợp mọi môi trường văn phòng.',
      image: 'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Áo Khoác Gió Bomber 2 Lớp',
      price: 520000,
      original_price: 700000,
      stock: 32,
      description: 'Áo khoác gió bomber 2 lớp chống gió nhẹ, thiết kế cổ đứng cá tính, nhiều màu lựa chọn, dễ phối đồ.',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Quần Short Kaki Nam Đi Chơi',
      price: 190000,
      original_price: 260000,
      stock: 50,
      description: 'Quần short kaki nam chất vải kaki co giãn nhẹ, 2 túi hộp tiện dụng, form relaxfit thoải mái cho mọi hoạt động.',
      image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80&auto=format&fit=crop',
    },
  ],

  'women-fashion': [
    {
      name: 'Đầm Xòe Voan Hoa Nhí Cổ Vuông',
      price: 380000,
      original_price: 500000,
      stock: 35,
      description: 'Đầm xòe voan hoa nhí cổ vuông ngọt ngào, dáng xòe tôn dáng, phù hợp đi chơi, dạo phố hoặc chụp ảnh.',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Áo Blazer Nữ Dáng Rộng Hàn Quốc',
      price: 520000,
      original_price: 700000,
      stock: 30,
      description: 'Áo blazer nữ dáng rộng phong cách Hàn Quốc, chất vải dày dặn đứng form, phù hợp đi làm hoặc kết hợp streetwear.',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4c4a?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Chân Váy Xếp Ly Dài Qua Gối',
      price: 260000,
      original_price: 360000,
      stock: 45,
      description: 'Chân váy xếp ly dài qua gối vải lụa mềm mại, thiết kế thanh lịch nhẹ nhàng, dễ phối áo.',
      image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Áo Kiểu Nữ Tay Bồng Vải Tơ',
      price: 290000,
      original_price: 390000,
      stock: 40,
      description: 'Áo kiểu nữ tay bồng vải tơ nhẹ mát, thiết kế nữ tính bồng bềnh, phù hợp đi chơi dự tiệc hoặc đi làm.',
      image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Quần Tây Nữ Ống Suông Cạp Cao',
      price: 350000,
      original_price: 480000,
      stock: 38,
      description: 'Quần tây nữ ống suông cạp cao tôn dáng, chất vải không nhăn, phù hợp mặc đi làm văn phòng hoặc dự sự kiện.',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80&auto=format&fit=crop',
    },
  ],

  'food': [
    {
      name: 'Bò Khô Miếng Tây Bắc Thượng Hạng 500g',
      price: 320000,
      original_price: 400000,
      stock: 50,
      description: 'Bò khô Tây Bắc thượng hạng, thịt bò chọn lọc ướp gia vị đặc trưng, vị đậm đà cay nồng, đóng gói hút chân không.',
      image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Hạt Điều Rang Muối Bình Phước 500g',
      price: 145000,
      original_price: 190000,
      stock: 50,
      description: 'Hạt điều Bình Phước rang muối giòn thơm, nguyên hạt to đều, giàu dinh dưỡng, đóng túi zip tiện lợi.',
      image: 'https://images.unsplash.com/photo-1536816579748-4ecb3f03d72a?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Khô Gà Lá Chanh Xé Cay 500g',
      price: 110000,
      original_price: 145000,
      stock: 50,
      description: 'Khô gà lá chanh xé cay đặc sản vị chua cay mặn ngọt hài hòa, ăn vặt cực ngon, hút chân không bảo quản lâu.',
      image: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Granola Hạt Dinh Dưỡng Giảm Cân 500g',
      price: 165000,
      original_price: 210000,
      stock: 45,
      description: 'Granola thuần thực vật hỗn hợp yến mạch, hạt điều, hạnh nhân, trái cây sấy, không đường tinh luyện, tốt cho eo.',
      image: 'https://images.unsplash.com/photo-1517093602195-b40af9088f3a?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Cơm Cháy Chà Bông Sài Gòn Giòn Rụm 250g',
      price: 75000,
      original_price: 100000,
      stock: 50,
      description: 'Cơm cháy đặc sản Sài Gòn giòn tan, phủ chà bông thơm béo, ăn vặt siêu ngon, đóng hộp giữ độ giòn.',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&auto=format&fit=crop',
    },
  ],

  'electronics': [
    {
      name: 'Tai Nghe Chống Ồn Sony WH-1000XM5',
      price: 7490000,
      original_price: 8990000,
      stock: 22,
      description: 'Tai nghe over-ear không dây Sony WH-1000XM5, chống ồn chủ động hàng đầu, pin 30h, âm thanh Hi-Res không nén.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Loa Bluetooth JBL Charge 5',
      price: 3290000,
      original_price: 3990000,
      stock: 30,
      description: 'Loa Bluetooth JBL Charge 5 chống nước IP67, pin 20h, âm thanh to mạnh, có thể sạc điện thoại qua cổng USB.',
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Bàn Phím Cơ Không Dây 3 Chế Độ',
      price: 1250000,
      original_price: 1600000,
      stock: 35,
      description: 'Bàn phím cơ không dây kết nối 3 chế độ (BT 5.0/BT 3.0/USB), switch hot-swap, đèn RGB, pin sạc dung lượng lớn.',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Chuột Không Dây Logitech MX Master 3S',
      price: 2190000,
      original_price: 2690000,
      stock: 28,
      description: 'Chuột không dây Logitech MX Master 3S 8000 DPI, cuộn trang siêu nhanh MagSpeed, sạc USB-C, kết nối đa thiết bị.',
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Màn Hình Đồ Họa Dell UltraSharp 27 inch',
      price: 11800000,
      original_price: 14000000,
      stock: 15,
      description: 'Màn hình Dell UltraSharp 27" 4K IPS, màu sắc chính xác 100% sRGB, kết nối USB-C, thiết kế không viền 3 cạnh.',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80&auto=format&fit=crop',
    },
  ],

  'accessories': [
    {
      name: 'Củ Sạc Nhanh Anker 65W GaN 3 Cổng',
      price: 690000,
      original_price: 890000,
      stock: 50,
      description: 'Củ sạc GaN 65W Anker 3 cổng (2x USB-C + 1x USB-A), nhỏ gọn bằng 1/3 củ sạc thường, sạc laptop và điện thoại đồng thời.',
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Cáp Sạc C to C Bọc Dù 100W 1.2m',
      price: 180000,
      original_price: 250000,
      stock: 50,
      description: 'Cáp USB-C to C 100W bọc dù chịu lực cao, truyền dữ liệu 480Mbps, dài 1.2m, tương thích mọi thiết bị USB-C.',
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Sạc Dự Phòng Không Dây Magsafe 10.000mAh',
      price: 550000,
      original_price: 750000,
      stock: 38,
      description: 'Pin dự phòng 10.000mAh hỗ trợ sạc không dây MagSafe 15W, sạc nhanh PD 20W có dây, mỏng nhẹ tiện mang theo.',
      image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Ốp Lưng Chống Sốc Trong Suốt Cao Cấp',
      price: 120000,
      original_price: 180000,
      stock: 50,
      description: 'Ốp lưng chống sốc trong suốt độ cứng cao, 4 góc được gia cường airbag, chống vàng, bảo vệ toàn diện cho điện thoại.',
      image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Giá Đỡ Điện Thoại Kim Loại Để Bàn',
      price: 95000,
      original_price: 140000,
      stock: 50,
      description: 'Giá đỡ điện thoại hợp kim nhôm cao cấp, góc xem điều chỉnh linh hoạt, gấp gọn tiện lợi, chống trơn trượt.',
      image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&q=80&auto=format&fit=crop',
    },
  ],

  'camera': [
    {
      name: 'Máy Ảnh Mirrorless Sony Alpha A7 Mark IV',
      price: 48900000,
      original_price: 57000000,
      stock: 8,
      description: 'Sony A7 IV full-frame 33MP, cảm biến BSI CMOS mới, autofocus thời gian thực AI, quay video 4K, 15 stop dải động.',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Máy Ảnh Canon EOS R6 Mark II Body',
      price: 56500000,
      original_price: 65000000,
      stock: 6,
      description: 'Canon EOS R6 Mark II 40.2MP full-frame, chống rung IBIS 8 stop, tốc độ chụp liên tiếp 40fps, quay 6K RAW.',
      image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Máy Ảnh Chụp Lấy Liền Fujifilm Instax Mini 12',
      price: 1950000,
      original_price: 2300000,
      stock: 40,
      description: 'Fujifilm Instax Mini 12 máy ảnh chụp lấy liền nhỏ gọn đáng yêu, in ảnh ngay tức thì, pin AA, nhiều màu sắc trẻ trung.',
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Máy Ảnh Fujifilm X-T5 Cổ Điển',
      price: 38200000,
      original_price: 44000000,
      stock: 10,
      description: 'Fujifilm X-T5 40.2MP APS-C, thiết kế rangefinder cổ điển, film simulation huyền thoại, IBIS 7 stop, màn hình lật.',
      image: 'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Flycam DJI Mini 4 Pro Kèm Điều Khiển Màn Hình',
      price: 21690000,
      original_price: 25000000,
      stock: 12,
      description: 'DJI Mini 4 Pro drone 4K/60fps HDR, cảm biến chướng ngại vật 360°, bay 34 phút, trọng lượng dưới 249g không cần đăng ký.',
      image: 'https://images.unsplash.com/photo-1506947411487-a56738267384?w=600&q=80&auto=format&fit=crop',
    },
  ],

  'watches': [
    {
      name: 'Đồng Hồ Nam Casio Edifice Dây Kim Loại',
      price: 2850000,
      original_price: 3500000,
      stock: 25,
      description: 'Casio Edifice dây kim loại cao cấp, mặt số lịch hiện đại, chống nước 100m, chronograph chính xác, vỏ thép không gỉ.',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Đồng Hồ Nam Orient Sun and Moon Gen 4 Dây Da',
      price: 8400000,
      original_price: 10000000,
      stock: 18,
      description: 'Orient Sun and Moon Gen 4 cơ automatic, hiển thị mặt trời mặt trăng độc đáo, dây da thật, kính sapphire chống xước.',
      image: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Đồng Hồ Thông Minh Apple Watch Series 9',
      price: 9290000,
      original_price: 10990000,
      stock: 30,
      description: 'Apple Watch Series 9 chip S9 SiP, màn hình Always-On Retina, cảm biến sức khỏe tiên tiến, hỗ trợ sạc nhanh từ tính.',
      image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Đồng Hồ Nữ Citizen Eco-Drive Thanh Lịch',
      price: 4150000,
      original_price: 5200000,
      stock: 22,
      description: 'Citizen Eco-Drive nữ năng lượng ánh sáng, không cần thay pin suốt đời, mặt số trắng thanh lịch, dây thép không gỉ.',
      image: 'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Đồng Hồ Thể Thao Casio G-Shock GA-2100',
      price: 3200000,
      original_price: 3900000,
      stock: 35,
      description: 'Casio G-Shock GA-2100 thiết kế octagon cá tính, chống va đập chuẩn military, chống nước 200m, viền case carbon.',
      image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80&auto=format&fit=crop',
    },
  ],

  'men-shoes': [
    {
      name: 'Giày Sneaker Nike Air Force 1 \'07 All White',
      price: 2900000,
      original_price: 3500000,
      stock: 32,
      description: 'Nike Air Force 1 \'07 màu trắng all white classic, đế Air cushion êm ái, chất da đầu ngón giả cao cấp, biểu tượng street style.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Giày Chạy Bộ Nam Adidas Ultraboost',
      price: 3450000,
      original_price: 4200000,
      stock: 28,
      description: 'Adidas Ultraboost đế Boost hấp thụ chấn động tối đa, upper Primeknit ôm chân nhẹ thoáng, dùng cho chạy bộ và thường ngày.',
      image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Giày Da Nam Loafer Da Bò Cao Cấp',
      price: 1150000,
      original_price: 1500000,
      stock: 25,
      description: 'Giày lười loafer da bò thật 100%, đế cao su chống trượt, kiểu dáng lịch lãm phù hợp đi làm, dự tiệc hoặc đi chơi.',
      image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Dép Quai Ngang Nam Đúc Êm Chân',
      price: 220000,
      original_price: 320000,
      stock: 50,
      description: 'Dép quai ngang nam đế đúc siêu nhẹ, quai chỉnh được độ rộng, chống trơn trượt, phù hợp đi biển đi chơi hàng ngày.',
      image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Giày Thể Thao Nam Biti\'s Hunter Street',
      price: 790000,
      original_price: 980000,
      stock: 40,
      description: 'Biti\'s Hunter Street phiên bản thành phố, đế Phylon siêu nhẹ, form dáng trendy, thoáng khí, thương hiệu Việt tự hào.',
      image: 'https://images.unsplash.com/photo-1561861422-a549073e547a?w=600&q=80&auto=format&fit=crop',
    },
  ],

  'women-shoes': [
    {
      name: 'Giày Cao Gót Mũi Nhọn 7cm Thanh Lịch',
      price: 650000,
      original_price: 890000,
      stock: 30,
      description: 'Giày cao gót mũi nhọn gót nhọn 7cm, chất da PU mịn bóng, lót da êm ái, phù hợp đi làm, dự tiệc hay hẹn hò.',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Giày Sneaker Nữ MLB Chunky Liner',
      price: 2450000,
      original_price: 3000000,
      stock: 28,
      description: 'MLB Chunky Liner đế bánh mì cá tính, upper thoáng khí, logo NY thêu nổi bật, hot trend mùa này không thể bỏ qua.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Sandal Nữ Quai Mảnh Đi Học Đi Chơi',
      price: 290000,
      original_price: 400000,
      stock: 45,
      description: 'Sandal nữ quai mảnh mềm mại, đế cao 3cm vừa đủ, khóa cài điều chỉnh, nhẹ nhàng nữ tính phù hợp đi học đi chơi.',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Giày Búp Bê Nữ Đính Nơ Da Mềm',
      price: 320000,
      original_price: 440000,
      stock: 40,
      description: 'Giày búp bê đính nơ chất da mềm êm chân, đế cao su chống trơn, phong cách ngọt ngào nữ tính, màu nude đa dụng.',
      image: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=600&q=80&auto=format&fit=crop',
    },
    {
      name: 'Dép Sục Nữ Phong Cách Hàn Quốc',
      price: 240000,
      original_price: 340000,
      stock: 50,
      description: 'Dép sục nữ kiểu Hàn Quốc, đế êm ái, quai mềm ôm chân, dễ kết hợp với nhiều outfit, đi trong nhà ngoài trời đều hợp.',
      image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80&auto=format&fit=crop',
    },
  ],
};

// ============================================================
//  🚀 HÀM THỰC THI CHÍNH
// ============================================================
async function reseed() {
  const conn = db.promise();

  try {
    console.log('\n🔧 [1/5] Tắt kiểm tra khóa ngoại...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // ── Xóa sạch products trước (FK phụ thuộc vào categories) ──
    console.log('🗑️  [2/5] Xóa sạch bảng products...');
    await conn.query('TRUNCATE TABLE products');

    // ── Xóa sạch categories ──
    console.log('🗑️  [3/5] Xóa sạch bảng categories...');
    await conn.query('TRUNCATE TABLE categories');

    console.log('✅ [4/5] Bật lại kiểm tra khóa ngoại...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // ── Nạp categories mới ──
    console.log('\n📂 Nạp 10 danh mục chuẩn...');
    const categoryIds = {};

    for (const cat of CATEGORIES) {
      const [result] = await conn.query(
        'INSERT INTO categories (name) VALUES (?)',
        [cat.name]
      );
      categoryIds[cat.slug] = result.insertId;
      console.log(`  ✔ [ID:${result.insertId}] ${cat.name}`);
    }

    // ── Nạp products mới ──
    console.log('\n🛍️  Nạp 50 sản phẩm (5 mỗi danh mục)...');

    const insertSQL = `
      INSERT INTO products
        (name, price, original_price, description, stock, image, category_id, status, display_type, specifications)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'general', ?)
    `;

    let totalInserted = 0;
    for (const [slug, products] of Object.entries(PRODUCTS_BY_SLUG)) {
      const catId = categoryIds[slug];
      if (!catId) {
        console.warn(`  ⚠️  Không tìm thấy category ID cho slug: ${slug}`);
        continue;
      }

      const catName = CATEGORIES.find(c => c.slug === slug)?.name || slug;
      for (const p of products) {
        const specs = JSON.stringify({ 'Tình trạng': 'Mới 100%', 'Bảo hành': 'Theo nhà sản xuất', 'Xuất xứ': 'Chính hãng' });
        await conn.query(insertSQL, [
          p.name,
          p.price,
          p.original_price,
          p.description,
          p.stock,
          p.image,
          catId,
          specs,
        ]);
        totalInserted++;
      }
      console.log(`  ✔ ${catName}: ${products.length} sản phẩm`);
    }

    // ── Verify ──
    console.log('\n📊 [5/5] Kiểm tra kết quả...');
    const [[{ catCount }]] = await conn.query('SELECT COUNT(*) AS catCount FROM categories');
    const [[{ prodCount }]] = await conn.query("SELECT COUNT(*) AS prodCount FROM products WHERE status = 'active'");

    console.log(`\n🎉 HOÀN THÀNH!`);
    console.log(`   📂 Danh mục: ${catCount} (mong đợi: 10)`);
    console.log(`   🛍️  Sản phẩm: ${prodCount} (mong đợi: 50)`);

    if (catCount === 10 && prodCount === 50) {
      console.log('\n✅ Dữ liệu Tiger Shop đã được làm mới thành công!');
      console.log('   AI Chatbot sẽ tự động truy xuất đúng 50 sản phẩm mới này.');
    } else {
      console.warn('\n⚠️  Số lượng không khớp, vui lòng kiểm tra lại!');
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Lỗi khi reseed:', err.message);
    // Đảm bảo bật lại FK dù có lỗi
    try { await conn.query('SET FOREIGN_KEY_CHECKS = 1'); } catch (_) {}
    process.exit(1);
  }
}

reseed();
