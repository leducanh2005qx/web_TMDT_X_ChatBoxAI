const fs = require('fs');
let c = fs.readFileSync('f:/phantichphanmem/backend/controllers/orderController.js', 'utf8');
const search = `        if (resultStock.affectedRows === 0) {
          throw new Error("Hết hàng (sản phẩm chính). Product ID: " + i.product_id);
        }
      }
    }`;
const replace = `        if (resultStock.affectedRows === 0) {
          throw new Error("Hết hàng (sản phẩm chính). Product ID: " + i.product_id);
        }
      }
      // UPDATE SOLD_COUNT
      await connection.query(
        "UPDATE products SET sold_count = sold_count + ? WHERE id = ?",
        [i.quantity, i.product_id]
      );
    }`;
if (c.includes(search)) {
  c = c.replace(search, replace);
  fs.writeFileSync('f:/phantichphanmem/backend/controllers/orderController.js', c);
  console.log("Success increment");
} else {
  console.log("Search string not found!");
}

const searchCancel = `      if (item.variant_id) {
        await connection.query(
          "UPDATE product_variants SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.variant_id]
        );
      } else if (item.product_id) {
        await connection.query(
          "UPDATE products SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.product_id]
        );
      }`;
const replaceCancel = `      if (item.variant_id) {
        await connection.query(
          "UPDATE product_variants SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.variant_id]
        );
      } else if (item.product_id) {
        await connection.query(
          "UPDATE products SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.product_id]
        );
      }
      
      // DECREMENT SOLD_COUNT
      await connection.query(
        "UPDATE products SET sold_count = GREATEST(sold_count - ?, 0) WHERE id = ?",
        [item.quantity, item.product_id]
      );`;

if (c.includes(searchCancel)) {
  c = c.replace(searchCancel, replaceCancel);
  fs.writeFileSync('f:/phantichphanmem/backend/controllers/orderController.js', c);
  console.log("Success decrement");
} else {
  console.log("Search string cancel not found!");
}
