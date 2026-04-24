const nodemailer = require("nodemailer");

// Cấu hình Mailtrap (Placeholder - Sếp tự thay SMTP thật sau)
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "7b4a69e776e273", // Thay bằng user Mailtrap của sếp
    pass: "a4387d8969427e"  // Thay bằng pass Mailtrap của sếp
  }
});

/**
 * Gửi hóa đơn Email cho khách hàng
 */
const sendInvoice = async (orderData) => {
  const { id, receiver_name, email, total, items, status, created_at } = orderData;
  
  const formatDate = (d) => new Date(d).toLocaleString("vi-VN");
  const formatMoney = (m) => Number(m || 0).toLocaleString() + " đ";

  // Tạo hàng cho bảng sản phẩm
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(item.price)}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e4e8; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #ee4d2d; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🐅 TIGER SHOP - HÓA ĐƠN</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Xin chào <strong>${receiver_name || email}</strong>,</p>
        <p>Cảm ơn bạn đã mua sắm tại Tiger Shop. Đây là thông tin chi tiết đơn hàng của bạn:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> #${id}</p>
          <p style="margin: 5px 0;"><strong>Ngày đặt:</strong> ${formatDate(created_at)}</p>
          <p style="margin: 5px 0;"><strong>Trạng thái:</strong> <span style="text-transform: uppercase;">${status}</span></p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead style="background-color: #f1f3f5;">
            <tr>
              <th style="padding: 10px; text-align: left;">Sản phẩm</th>
              <th style="padding: 10px; text-align: center;">SL</th>
              <th style="padding: 10px; text-align: right;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px 10px; font-weight: bold; border-top: 2px solid #ee4d2d;">TỔNG THANH TOÁN</td>
              <td style="padding: 15px 10px; font-weight: bold; text-align: right; color: #ee4d2d; font-size: 1.2rem; border-top: 2px solid #ee4d2d;">
                ${formatMoney(total)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div style="text-align: center; color: #6a737d; font-size: 0.9rem;">
          <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ Chat trực tiếp với shop.</p>
          <p>Tiger Shop - Thời trang & Phong cách</p>
        </div>
      </div>
      
      <div style="background-color: #f6f8fa; padding: 15px; text-align: center; font-size: 0.8rem; color: #959da5;">
        Đây là email tự động, vui lòng không trả lời.
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: '"Tiger Shop 🐅" <no-reply@tigershop.com>',
    to: email,
    subject: `🐅 Hóa đơn đơn hàng #${id} - Tiger Shop`,
    html: htmlContent
  });

  return info;
};

module.exports = {
  sendInvoice
};
