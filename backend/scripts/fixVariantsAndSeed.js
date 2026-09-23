const db = require('../config/db');

async function fixExistingVariants() {
  const [rows] = await db.promise().query('SELECT * FROM product_variants');
  let fixedCount = 0;
  for (let row of rows) {
    if (row.color) {
      const c = row.color.toUpperCase();
      const isSize = c.includes('SIZE') || ['S','M','L','XL','2XL','3XL'].includes(c) || !isNaN(Number(c));
      if (isSize) {
        let sizeVal = row.color.replace(/size/i, '').trim();
        if (sizeVal === '') sizeVal = row.color;
        // set color to null, set size to sizeVal
        await db.promise().query('UPDATE product_variants SET size = ?, color = NULL WHERE id = ?', [sizeVal, row.id]);
        fixedCount++;
      }
    }
  }
  console.log(`[+] Fixed existing variants mapping. Affected ${fixedCount} rows.`);
}

async function seedMatrix() {
    const [shoes] = await db.promise().query("SELECT id, price FROM products WHERE display_type = 'fashion' OR name LIKE '%dép%' OR name LIKE '%giày%' LIMIT 3");
    const [clothes] = await db.promise().query("SELECT id, price FROM products WHERE name LIKE '%áo%' OR name LIKE '%quần%' LIMIT 2");

    let seededIds = [];

    // seed shoes
    for (let p of shoes) {
        await db.promise().query('DELETE FROM product_variants WHERE product_id = ?', [p.id]);
        const colors = [
            {name: 'Đen', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=300&auto=format&fit=crop'},
            {name: 'Be', img: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=300&auto=format&fit=crop'}
        ];
        const sizes = ['38', '39', '40', '41'];
        
        let i = 0;
        let totalStock = 0;
        for (let c of colors) {
            for (let s of sizes) {
                let stock = Math.floor(Math.random() * 41) + 10;
                if (i === 1 || i === 5) stock = 0; // force out of stock for testing
                const vName = c.name + ' - ' + s;
                await db.promise().query('INSERT INTO product_variants (product_id, sku, variant_name, color, size, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [p.id, 'SKU-S-'+p.id+'-'+i, vName, c.name, s, p.price, stock, c.img]
                );
                totalStock += stock;
                i++;
            }
        }
        await db.promise().query('UPDATE products SET stock = ? WHERE id = ?', [totalStock, p.id]);
        console.log(`[+] Seeded Matrix for Shoes Product ID: ${p.id}`);
        seededIds.push(p.id);
    }

    // seed clothes
    for (let p of clothes) {
        await db.promise().query('DELETE FROM product_variants WHERE product_id = ?', [p.id]);
        const colors = [
            {name: 'Trắng', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300&auto=format&fit=crop'},
            {name: 'Xanh', img: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=300&auto=format&fit=crop'}
        ];
        const sizes = ['S', 'M', 'L'];
        
        let i = 0;
        let totalStock = 0;
        for (let c of colors) {
            for (let s of sizes) {
                let stock = Math.floor(Math.random() * 41) + 10;
                if (i === 2) stock = 0; 
                const vName = c.name + ' - ' + s;
                await db.promise().query('INSERT INTO product_variants (product_id, sku, variant_name, color, size, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [p.id, 'SKU-C-'+p.id+'-'+i, vName, c.name, s, p.price, stock, c.img]
                );
                totalStock += stock;
                i++;
            }
        }
        await db.promise().query('UPDATE products SET stock = ? WHERE id = ?', [totalStock, p.id]);
        console.log(`[+] Seeded Matrix for Clothes Product ID: ${p.id}`);
        seededIds.push(p.id);
    }

    console.log(`\n=> Seeding Complete! Seeded IDs: ${seededIds.join(', ')}`);
}

async function run() {
    try {
        await fixExistingVariants();
        await seedMatrix();
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
