const fs = require('fs');
let c = fs.readFileSync('f:/phantichphanmem/backend/controllers/orderController.js', 'utf8');

c = c.replace(/if\s*\(resultStock\.affectedRows\s*===\s*0\)\s*\{\s*throw new Error\([^)]*\);\s*\}\s*\}\s*\}/, (match) => {
  return match.slice(0, match.lastIndexOf('}')) + `  await connection.query(
        "UPDATE products SET sold_count = sold_count + ? WHERE id = ?",
        [i.quantity, i.product_id]
      );
    }`;
});

c = c.replace(/else if\s*\(item\.product_id\)\s*\{\s*await connection\.query\(\s*"UPDATE products SET stock = stock \+ \? WHERE id = \?",\s*\[item\.quantity, item\.product_id\]\s*\);\s*\}/, (match) => {
  return match + `
      await connection.query(
        "UPDATE products SET sold_count = GREATEST(sold_count - ?, 0) WHERE id = ?",
        [item.quantity, item.product_id]
      );`;
});

fs.writeFileSync('f:/phantichphanmem/backend/controllers/orderController.js', c);
console.log("Done regex replace");
