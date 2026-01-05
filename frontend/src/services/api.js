const API_URL = "http://localhost:5000/api";

/* ================= AUTH ================= */

// 🔐 Đăng nhập
export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

// 📝 Đăng ký
export const register = async (name, email, password) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
};

/* ================= PRODUCTS ================= */

export const getProducts = async () => {
  const res = await fetch(`${API_URL}/products`);
  return res.json();
};

export const getProductById = async (id) => {
  const res = await fetch(`${API_URL}/products/${id}`);
  return res.json();
};

export const createProduct = async (formData) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return res.json();
};

export const updateProduct = async (id, formData) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return res.json();
};

export const deleteProduct = async (id) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

/* ================= ORDERS (USER) ================= */

export const createOrder = async (order) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(order),
  });

  return res.json();
};

export const getMyOrders = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/orders/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const getOrderById = async (orderId) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

/* ================= ADMIN ORDERS ================= */

export const getAllOrdersAdmin = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/orders/admin`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

// 🔄 FIX CHÍNH Ở ĐÂY
export const updateOrderStatusAdmin = async (orderId, status) => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${API_URL}/orders/admin/${orderId}/status`, // ✅ ĐÚNG ROUTE
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  return res.json();
};

export const getOrderStatsAdmin = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/orders/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};
