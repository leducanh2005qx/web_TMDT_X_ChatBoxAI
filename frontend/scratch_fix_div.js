const fs = require('fs');
let c = fs.readFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', 'utf8');

// The end of the file looks like:
//       </div>
//     </div>
//   );
// }
// 
// export default ProductDetail;

c = c.replace(/<\/div>\s*<\/div>\s*\);\s*\}\s*export default ProductDetail;/, 
`      </div>
  );
}

export default ProductDetail;`);

fs.writeFileSync('f:/phantichphanmem/frontend/src/pages/customer/ProductDetail.js', c);
