const db = require('./config/db');

const seedReviews = async () => {
    try {
        await new Promise((resolve, reject) => {
            db.query("TRUNCATE TABLE product_reviews", (err) => {
                if(err) reject(err); else resolve();
            });
        });

        // Valid user_ids: 2, 3, 4, 6, 7, 8, 9, 18, 19, 20, 21, 23, 31, 37
        const newReviews = [
            // Áo Khoác Gió Bomber 2 Lớp (id: 9)
            [9, 2, 5, 'Áo khoác rất đẹp, chất gió dày dặn mặc ấm. Form lên dáng rất xịn xò, shop đóng gói cẩn thận. Giao hàng cực nhanh, 10 điểm cho Tiger Shop!'],
            [9, 3, 5, 'Mua đợt sale nên giá quá hời. Đường chỉ may chắc chắn, không có chỉ thừa. Sẽ ủng hộ shop dài dài!'],
            [9, 4, 4, 'Chất lượng áo khá ok, màu sắc y hình. Tuy nhiên size hơi rộng so với mình một chút, nhưng mặc kiểu oversize vẫn ổn.'],
            [9, 18, 5, 'Vải mặc chống gió tốt, đi trời mưa bay lất phất vẫn không sao. Rất ưng ý!'],
            [9, 19, 5, 'Shipper nhiệt tình, hàng bọc 2 lớp seal cẩn thận. Áo giặt xong không bị nhăn. Tuyệt vời.'],

            // Áo Polo Nam Pique Cotton Co Giãn (id: 6)
            [6, 7, 5, 'Chất cotton pique mặc siêu mát, thấm hút mồ hôi tốt. Cổ áo giặt máy không bị nhão, rất đáng tiền!'],
            [6, 8, 4, 'Áo form đẹp, tôn dáng. Đóng gói rất kỹ, có thư cảm ơn của shop. Trừ 1 sao vì shipper giao hàng hơi chậm.'],
            [6, 9, 5, 'Đã mua áo này lần thứ 3 ở shop, mặc đi làm hay đi chơi đều hợp. Shop bán hàng Local Brand nhưng chất lượng quốc tế.'],
            [6, 20, 5, 'Quá ưng! Chất áo dày dặn dệt rất đẹp, bo chun tay áo không quá chật.'],

            // Quần Jean Nam Slimfit (id: 7)
            [7, 3, 5, 'Quần co giãn tốt, mặc cực kỳ thoải mái không bị gò bó. Màu wash chuẩn, giặt chưa thấy phai màu.'],
            [7, 21, 5, 'Quần đẹp lắm shop ơi, mặc ôm chân mà vẫn dễ vận động. Đóng gói hộp cát tông xịn xò.'],
            [7, 23, 4, 'Quần hơi dài so với mình, phải xắn gấu lên xíu nhưng mà chất vải thì không có chỗ nào để chê nha.'],
            
            // Bàn Làm Việc Gỗ Tự Nhiên (id: 1)
            [1, 6, 5, 'Bàn rất chắc chắn, mặt gỗ vân đẹp xuất sắc. Tự lắp ráp cũng rất dễ dàng vì có đủ ốc vít. Rất phù hợp để làm việc tại nhà.'],
            [1, 7, 5, 'Thiết kế tối giản mà tinh tế. Khung sắt dày, sơn tĩnh điện đẹp không bị xước. Giao hàng cẩn thận không bị móp méo.'],
            
            // Áo Sơ Mi Nam Trắng Công Sở (id: 8)
            [8, 31, 5, 'Vải sơ mi chống nhăn tốt, giặt xong phơi lên là phẳng lỳ không cần ủi nhiều. Mặc đi làm rất sang.'],
            [8, 37, 4, 'Chất lượng ổn áp so với giá. Vải hơi mỏng nhẹ nhưng bù lại mặc rất mát.']
        ];

        let inserted = 0;
        for (const r of newReviews) {
            await new Promise((resolve, reject) => {
                const q = `INSERT INTO product_reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)`;
                db.query(q, r, (err) => {
                    if(err) reject(err); else resolve();
                });
            });
            inserted++;
        }

        console.log(`Đã chèn thành công ${inserted} đánh giá thực tế.`);
        process.exit(0);

    } catch (error) {
        console.error("Lỗi:", error);
        process.exit(1);
    }
};

seedReviews();
