exports.updateOrderAddress = async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const { address } = req.body;

  if (!address || !address.trim()) {
    return res.status(400).json({ message: "Vui lòng nhập địa chỉ mới." });
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    const [orders] = await connection.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [orderId, userId]);
    
    if (!orders.length) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    const order = orders[0];
    if (order.status !== 'pending' && order.status !== 'processing') {
      return res.status(400).json({ message: "Chỉ có thể đổi địa chỉ khi đơn hàng đang chờ xử lý." });
    }

    await connection.query("UPDATE orders SET shipping_address = ? WHERE id = ?", [address.trim(), orderId]);
    
    res.json({ success: true, message: "Đã cập nhật địa chỉ giao hàng thành công." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật địa chỉ.", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};
