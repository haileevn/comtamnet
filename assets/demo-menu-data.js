const restaurantMenu = {
  "brand": {
    "name": "Cơm Tấm Ông Mập",
    "domain": "comtam.net",
    "slogan": "Đậm đà vị ngon Sài Gòn xưa",
    "hotline": "1900 6868",
    "address": "128 Võ Văn Tần, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh"
  },
  "dishes": [
    {
      "id": "dish_01",
      "name": "Cơm Tấm Sườn Bì Chả Đặc Biệt",
      "category": "Đặc Sản Trứ Danh · Đậm Vị Sài Gòn",
      "price": 68000,
      "time": "5–10 phút",
      "image": "comtam-suon-cha.png",
      "description": "Sườn cốt lết nướng than hoa vàng rượm, chả trứng hấp mềm béo, bì heo thái sợi thính gạo giòn thơm, trứng ốp la lòng đào và mỡ hành tóp mỡ béo ngậy.",
      "tags": ["Sườn than hoa", "Chả trứng hoàng kim", "Bì thính giòn", "Trứng ốp la"],
      "ingredients": ["pork", "rice", "lemongrass", "herbs"],
      "available": true
    },
    {
      "id": "dish_02",
      "name": "Cơm Tấm Sườn Cây Mật Ong",
      "category": "Món Nướng Than Hoa · Ngọt Thơm Đậm Đà",
      "price": 75000,
      "time": "8–12 phút",
      "image": "comtam-suon-cay.png",
      "description": "Từng dẻ sườn cây dày thịt tẩm ướp mật ong rừng và nước cốt tỏi sả, nướng xém cạnh trên than hồng thơm lừng, thịt mềm mọng nước đậm vị.",
      "tags": ["Sườn cây nướng", "Mật ong rừng", "Mỡ hành tóp mỡ", "Đồ chua giòn"],
      "ingredients": ["pork", "honey", "lemongrass", "rice"],
      "available": true
    },
    {
      "id": "dish_03",
      "name": "Cơm Tấm Sườn Nướng Than Hoa",
      "category": "Hương Vị Truyền Thống · Quen Thuộc",
      "price": 55000,
      "time": "5–8 phút",
      "image": "comtam-suon-nuong.png",
      "description": "Sườn cốt lết ướp đượm vị mắm đường tỏi sả, nướng than hoa thơm lừng. Cơm tấm dẻo rưới mỡ hành tóp mỡ giòn rụm và nước mắm kẹo chua ngọt.",
      "tags": ["Sườn than hoa", "Mỡ hành tóp mỡ", "Cơm tấm dẻo", "Nước mắm kẹo"],
      "ingredients": ["pork", "rice", "lemongrass", "herbs"],
      "available": true
    },
    {
      "id": "dish_04",
      "name": "Cơm Tấm Ba Rọi Nướng Muối Ớt",
      "category": "Món Nướng Đậm Vị · Cay Nồng Giòn Rụm",
      "price": 58000,
      "time": "7–10 phút",
      "image": "comtam-ba-roi.png",
      "description": "Ba chỉ heo tươi với tỷ lệ nạc mỡ hoàn hảo, ướp muối ớt xiêm xanh nướng giòn rụm lớp bì ngoài, ăn kèm dưa leo và đồ chua chống ngấy tuyệt hảo.",
      "tags": ["Ba rọi nướng", "Muối ớt xiêm", "Bì giòn rụm", "Đồ chua giòn"],
      "ingredients": ["pork", "herbs", "garlic", "pickles"],
      "available": true
    },
    {
      "id": "dish_05",
      "name": "Cơm Tấm Đùi Gà Nướng Sả",
      "category": "Gà Nướng Vàng Giòn · Thơm Lừng Góc Phố",
      "price": 58000,
      "time": "8–12 phút",
      "image": "comtam-dui-ga.png",
      "description": "Đùi gà góc tư ướp sả ớt đậm đà nướng than vàng ươm, lớp da ngoài giòn tan, thịt bên trong mềm ngọt, dùng kèm cơm tấm nóng và đồ chua thanh nhẹ.",
      "tags": ["Đùi gà góc tư", "Sả nướng thơm", "Da giòn mọng thịt", "Cơm thơm"],
      "ingredients": ["chicken", "lemongrass", "rice", "pickles"],
      "available": true
    },
    {
      "id": "dish_06",
      "name": "Cơm Tấm Tàu Hũ Ky Tôm Thịt",
      "category": "Món Chiên Giòn Rụm · Đậm Vị Hải Sản",
      "price": 65000,
      "time": "6–10 phút",
      "image": "comtam-tau-hu-ky.png",
      "description": "Tàu hũ ky lá mỏng cuộn đầy ắp nhân tôm đất và thịt nạc quết dẻo mộc nhĩ, chiên phồng vàng ruộm giòn tan chấm nước mắm tỏi ớt chua ngọt.",
      "tags": ["Tàu hũ ky", "Tôm thịt giòn rụm", "Mỡ hành", "Nước mắm kẹo"],
      "ingredients": ["rice", "herbs", "garlic", "pickles"],
      "available": true
    },
    {
      "id": "dish_07",
      "name": "Cơm Tấm Bò Nướng Mè Sa Tế",
      "category": "Thịt Bò Thượng Hạng · Cay Thơm Nồng Nàn",
      "price": 72000,
      "time": "6–9 phút",
      "image": "comtam-bo-sa-te.png",
      "description": "Thăn bò mềm ướp sốt sa tế tôm cay nồng, rắc mè rang thơm bùi nướng nhanh trên lửa lớn giữ trọn vị ngọt tự nhiên, hòa quyện tuyệt vời cùng cơm tấm nóng.",
      "tags": ["Thăn bò mềm", "Sa tế tôm cay", "Mè rang thơm", "Rau thơm tươi"],
      "ingredients": ["beef", "rice", "pepper", "herbs"],
      "available": true
    },
    {
      "id": "dish_08",
      "name": "Cơm Tấm Chả Cua Hoàng Kim",
      "category": "Đặc Biệt Cao Cấp · Béo Bùi Đậm Đà",
      "price": 69000,
      "time": "5–8 phút",
      "image": "comtam-cha-cua.png",
      "description": "Chả cua bể hấp nấm mèo kết hợp phủ lớp lòng đỏ trứng muối hoàng kim béo ngậy trên mặt, thơm ngào ngạt và đậm đà khó cưỡng.",
      "tags": ["Chả cua bể", "Trứng muối hoàng kim", "Mỡ hành tóp mỡ", "Cơm tấm dẻo"],
      "ingredients": ["rice", "herbs", "pickles", "pepper"],
      "available": true
    },
    {
      "id": "dish_09",
      "name": "Canh Khổ Qua Nhồi Thịt",
      "category": "Canh Truyền Thống · Thanh Nhiệt Giải Độc",
      "price": 28000,
      "time": "3–5 phút",
      "image": "canh-kho-qua.png",
      "description": "Khổ qua tươi xanh nhồi thịt heo nạc và mộc nhĩ ướp tiêu thơm nức, nấu trong nước dùng hầm xương ngọt thanh tự nhiên, giúp giải nhiệt và cân bằng vị giác.",
      "tags": ["Khổ qua rừng", "Thịt bằm mộc nhĩ", "Nước dùng thanh", "Tiêu đen"],
      "ingredients": ["pepper", "herbs", "garlic", "rice"],
      "available": true
    },
    {
      "id": "dish_10",
      "name": "Canh Rong Biển Đậu Hũ Thịt Bằm",
      "category": "Canh Tươi Mát · Bổ Dưỡng Dễ Ăn",
      "price": 25000,
      "time": "3–5 phút",
      "image": "canh-rong-bien.png",
      "description": "Rong biển bổ dưỡng hòa quyện cùng từng miếng đậu hũ non mềm mịn tan trong miệng và thịt bằm viên ngọt nước, rắc hành ngò tươi thanh mát.",
      "tags": ["Rong biển tươi", "Đậu hũ non", "Thịt viên ngọt nước", "Thanh mát"],
      "ingredients": ["herbs", "pepper", "garlic", "rice"],
      "available": true
    },
    {
      "id": "dish_11",
      "name": "Trà Tắc Sả Hạt Chia & Bánh Flan",
      "category": "Thức Uống Giải Nhiệt · Tráng Miệng Ngon",
      "price": 25000,
      "time": "2–3 phút",
      "image": "tra-tac-sa.png",
      "description": "Ly trà lài ủ lạnh kết hợp quất tươi thanh chua, sả tươi đập dập thơm dịu cùng hạt chia mát lành, kèm bánh flan trứng caramel béo mềm bùi ngọt.",
      "tags": ["Trà lài ủ lạnh", "Tắc tươi thanh chua", "Hạt chia bổ dưỡng", "Bánh flan caramen"],
      "ingredients": ["lemon", "honey", "herbs", "seeds"],
      "available": true
    },
    {
      "id": "dish_12",
      "name": "Nước Sâm Mía Lau Lá Dứa Thạch",
      "category": "Nước Mát Sài Gòn · Thơm Mát Ngọt Dịu",
      "price": 22000,
      "time": "1–2 phút",
      "image": "nuoc-sam-mia-lau.png",
      "description": "Nước sâm nấu theo bài thuốc gia truyền từ mía lau, lá dứa, râu bắp và rễ tranh ngọt mát tự nhiên, thêm thạch sương sáo giòn dai và hạt é mát lành.",
      "tags": ["Mía lau ngọt mát", "Lá dứa thanh hương", "Thạch sương sáo", "Hạt é mát lành"],
      "ingredients": ["honey", "seeds", "herbs", "lemon"],
      "available": true
    }
  ],
  "ingredientCatalog": {
    "pork": ["Sườn nướng than", 1],
    "beef": ["Thăn bò mềm", 1],
    "chicken": ["Gà ta thả vườn", 2],
    "rice": ["Gạo tấm thơm dẻo", 3],
    "lemongrass": ["Sả cây đập dập", 4],
    "garlic": ["Tỏi ớt băm nhuyễn", 7],
    "herbs": ["Mỡ hành & rau thơm", 13],
    "honey": ["Mật ong hoa rừng", 14],
    "seeds": ["Mè rang & hạt chia", 15],
    "lemon": ["Tắc & chanh tươi", 16],
    "pepper": ["Tiêu đen Phú Quốc", 17],
    "pickles": ["Đồ chua củ cải", 19]
  },
  "toppings": [
    { "id": "top_egg", "name": "Trứng ốp la lòng đào", "price": 10000 },
    { "id": "top_cha", "name": "Chả trứng hoàng kim hấp", "price": 15000 },
    { "id": "top_bi", "name": "Bì heo thính thơm", "price": 12000 },
    { "id": "top_suon", "name": "Sườn cốt lết than hoa thêm", "price": 35000 },
    { "id": "top_topmo", "name": "Chén tóp mỡ mỡ hành giòn", "price": 8000 },
    { "id": "top_canh", "name": "Chén canh khổ qua nhồi thịt", "price": 25000 },
    { "id": "top_com", "name": "Thêm một phần cơm tấm", "price": 10000 }
  ],
  "defaultUsers": [
    {
      "id": "user_01",
      "name": "Nguyễn Văn Tuấn",
      "phone": "0908123456",
      "email": "tuan.nguyen@gmail.com",
      "password": "123",
      "role": "customer",
      "membershipNumber": "CTM-8889-VIP",
      "tier": "Gold",
      "points": 350,
      "totalSpent": 3500000,
      "address": "142 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP.HCM",
      "createdAt": "2026-08-15"
    },
    {
      "id": "user_02",
      "name": "Trần Thị Mai Phương",
      "phone": "0912345678",
      "email": "phuong.tran@gmail.com",
      "password": "123",
      "role": "customer",
      "membershipNumber": "CTM-5521-SILVER",
      "tier": "Silver",
      "points": 120,
      "totalSpent": 1200000,
      "address": "45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM",
      "createdAt": "2026-09-02"
    },
    {
      "id": "admin_01",
      "name": "Quản Trị Bếp Ông Mập",
      "phone": "0988888888",
      "email": "admin@comtam.net",
      "password": "admin",
      "role": "admin",
      "membershipNumber": "ADMIN-ROOT",
      "tier": "Diamond",
      "points": 9999,
      "totalSpent": 99999999,
      "address": "Trụ sở comtam.net",
      "createdAt": "2026-01-01"
    }
  ],
  "defaultOrders": [
    {
      "id": "ord_001",
      "orderCode": "CTM-7821",
      "createdAt": "2026-10-16 11:45",
      "customerName": "Nguyễn Văn Tuấn",
      "phone": "0908123456",
      "address": "142 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP.HCM",
      "notes": "Cho nhiều mỡ hành tóp mỡ, nước mắm ớt riêng",
      "items": [
        {
          "dishId": "dish_01",
          "name": "Cơm Tấm Sườn Bì Chả Đặc Biệt",
          "price": 68000,
          "quantity": 2,
          "image": "comtam-suon-cha.png",
          "toppings": ["Trứng ốp la lòng đào (+10.000đ)", "Chén tóp mỡ mỡ hành giòn (+8.000đ)"]
        },
        {
          "dishId": "dish_09",
          "name": "Canh Khổ Qua Nhồi Thịt",
          "price": 28000,
          "quantity": 1,
          "image": "canh-kho-qua.png",
          "toppings": []
        }
      ],
      "subtotal": 196000,
      "shippingFee": 15000,
      "pointsUsed": 50,
      "discountAmount": 5000,
      "totalAmount": 206000,
      "paymentMethod": "vietqr",
      "paymentStatus": "paid",
      "orderStatus": "delivering",
      "pointsEarned": 20,
      "timeline": [
        { "time": "11:45", "title": "Đã tiếp nhận đơn hàng", "desc": "Hệ thống ghi nhận đơn trực tuyến comtam.net" },
        { "time": "11:46", "title": "Đã thanh toán VietQR", "desc": "Chuyển khoản Napas 24/7 thành công" },
        { "time": "11:52", "title": "Bếp đang nướng & chuẩn bị", "desc": "Sườn than hoa nướng xém cạnh, đóng hộp nóng hổi" },
        { "time": "12:05", "title": "Đang giao hàng", "desc": "Tài xế Nguyễn Văn Long (59-P1 839.21) đang giao đến" }
      ]
    },
    {
      "id": "ord_002",
      "orderCode": "CTM-7822",
      "createdAt": "2026-10-16 12:08",
      "customerName": "Trần Thị Mai Phương",
      "phone": "0912345678",
      "address": "45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM",
      "notes": "Giao trước sảnh toà nhà, gọi trước khi đến",
      "items": [
        {
          "dishId": "dish_02",
          "name": "Cơm Tấm Sườn Cây Mật Ong",
          "price": 75000,
          "quantity": 1,
          "image": "comtam-suon-cay.png",
          "toppings": ["Trứng ốp la lòng đào (+10.000đ)"]
        },
        {
          "dishId": "dish_11",
          "name": "Trà Tắc Sả Hạt Chia & Bánh Flan",
          "price": 25000,
          "quantity": 1,
          "image": "tra-tac-sa.png",
          "toppings": []
        }
      ],
      "subtotal": 110000,
      "shippingFee": 18000,
      "pointsUsed": 0,
      "discountAmount": 0,
      "totalAmount": 128000,
      "paymentMethod": "vietqr",
      "paymentStatus": "paid",
      "orderStatus": "cooking",
      "pointsEarned": 12,
      "timeline": [
        { "time": "12:08", "title": "Đã tiếp nhận đơn hàng", "desc": "Khách hàng đặt qua comtam.net" },
        { "time": "12:09", "title": "Đã duyệt thanh toán", "desc": "Admin đã xác nhận thanh toán trực tuyến" },
        { "time": "12:11", "title": "Bếp đang nướng sườn", "desc": "Sườn cây mật ong đang nướng than hoa" }
      ]
    },
    {
      "id": "ord_003",
      "orderCode": "CTM-7823",
      "createdAt": "2026-10-16 12:20",
      "customerName": "Lê Hoàng Nam",
      "phone": "0934567890",
      "address": "88 Pasteur, Phường Bến Nghé, Quận 1, TP.HCM",
      "notes": "Cơm cháy nhiều giùm em nhé quán ơi",
      "items": [
        {
          "dishId": "dish_03",
          "name": "Cơm Tấm Sườn Nướng Than Hoa",
          "price": 55000,
          "quantity": 2,
          "image": "comtam-suon-nuong.png",
          "toppings": ["Chả trứng hoàng kim hấp (+15.000đ)"]
        }
      ],
      "subtotal": 125000,
      "shippingFee": 15000,
      "pointsUsed": 0,
      "discountAmount": 0,
      "totalAmount": 140000,
      "paymentMethod": "vietqr",
      "paymentStatus": "pending",
      "orderStatus": "pending_payment",
      "pointsEarned": 14,
      "timeline": [
        { "time": "12:20", "title": "Chờ chuyển khoản VietQR", "desc": "Đang chờ khách quét mã thanh toán 140.000đ" }
      ]
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = restaurantMenu;
}
