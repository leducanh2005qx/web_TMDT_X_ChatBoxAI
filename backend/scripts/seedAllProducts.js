const db = require('../config/db');

async function seedAllProducts() {
    console.log("Fetching all products...");
    const [products] = await db.promise().query("SELECT id, name, price, display_type, category_id FROM products");

    for (let p of products) {
        // Xóa biến thể cũ
        await db.promise().query('DELETE FROM product_variants WHERE product_id = ?', [p.id]);

        let colors = [];
        let sizes = [];

        const nameLower = (p.name || '').toLowerCase();
        
        // Phân loại tự động để gán màu và size cho hợp lý (ẢNH ĐÃ CHỌN LỌC KỸ ĐÚNG MÀU)
        if (nameLower.includes('dép') || nameLower.includes('sục') || nameLower.includes('giày') || nameLower.includes('sneaker')) {
            colors = [
                // Giày đen
                {name: 'Đen', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=500&auto=format&fit=crop'},
                // Sục/Giày be trắng
                {name: 'Be', img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=500&auto=format&fit=crop'}
            ];
            sizes = ['38', '39', '40', '41', '42'];
        } else if (nameLower.includes('áo') || nameLower.includes('quần') || nameLower.includes('váy') || p.display_type === 'fashion') {
            colors = [
                // Áo trắng
                {name: 'Trắng', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500&auto=format&fit=crop'},
                // Áo đen
                {name: 'Đen', img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=500&auto=format&fit=crop'}
            ];
            sizes = ['S', 'M', 'L', 'XL'];
        } else if (nameLower.includes('điện thoại') || nameLower.includes('iphone') || nameLower.includes('samsung')) {
            colors = [
                // iPhone Titan
                {name: 'Titan Tự Nhiên', img: 'https://images.unsplash.com/photo-1695048064977-bc6cc5a39626?q=80&w=500&auto=format&fit=crop'},
                // iPhone Đen
                {name: 'Đen Xám', img: 'https://images.unsplash.com/photo-1695048132924-f725902bfbc6?q=80&w=500&auto=format&fit=crop'}
            ];
            sizes = ['128GB', '256GB'];
        } else if (nameLower.includes('laptop') || nameLower.includes('macbook')) {
            colors = [
                // Laptop Bạc
                {name: 'Bạc', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=500&auto=format&fit=crop'},
                // Laptop Xám
                {name: 'Xám Không Gian', img: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=500&auto=format&fit=crop'}
            ];
            sizes = ['8GB/256GB', '16GB/512GB'];
        } else {
            // Các sản phẩm khác (mặc định)
            colors = [
                {name: 'Bản Tiêu Chuẩn', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500&auto=format&fit=crop'},
                {name: 'Bản Cao Cấp', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=500&auto=format&fit=crop'}
            ];
            sizes = ['Mặc định'];
        }

        let totalStock = 0;
        let i = 0;
        
        for (let c of colors) {
            for (let s of sizes) {
                let stock = Math.floor(Math.random() * 41) + 10;
                // Cố tình random 1 số biến thể hết hàng để test UI
                if (Math.random() < 0.1) stock = 0; 
                
                const sizeLabel = s === 'Mặc định' ? '' : ` - ${s}`;
                const vName = c.name + sizeLabel;
                
                await db.promise().query(
                    'INSERT INTO product_variants (product_id, sku, variant_name, color, size, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [p.id, `SKU-${p.id}-${i}`, vName, c.name, s !== 'Mặc định' ? s : null, p.price, stock, c.img]
                );
                
                totalStock += stock;
                i++;
            }
        }
        
        // Cập nhật tổng kho cho sản phẩm chính
        await db.promise().query('UPDATE products SET stock = ? WHERE id = ?', [totalStock, p.id]);
        console.log(`[+] Đã sinh xong Ma trận & Ảnh đúng màu cho sản phẩm: ${p.name} (ID: ${p.id})`);
    }

    console.log(`\n=> Hoàn tất! Đã cập nhật ảnh Demo cực chuẩn (Đúng loại, đúng màu) cho ${products.length} sản phẩm.`);
}

async function run() {
    try {
        await seedAllProducts();
    } catch(e) {
        console.error("Lỗi:", e);
    } finally {
        process.exit(0);
    }
}
run();
