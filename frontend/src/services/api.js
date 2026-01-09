const API_URL = "http://localhost:5000/api";

/* ================= HELPER ================= */

// Lấy token + check tồn tại
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Bạn chưa đăng nhập");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// ✅ HANDLE RESPONSE CHUẨN – KHÔNG LÀM CRASH UI
const handleResponse = async (res) => {
  let data = {};

  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Không có quyền truy cập");
    }

    if (res.status >= 500) {
      throw new Error(data.message || "Lỗi hệ thống");
    }

    return data;
  }

  return data;
};

/* ================= AUTH ================= */

export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse(res);
};

export const register = async (name, email, password) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  return handleResponse(res);
};

/* ================= PRODUCTS ================= */

export const getProducts = async () => {
  const res = await fetch(`${API_URL}/products`);
  return handleResponse(res);
};

export const getProductById = async (id) => {
  const res = await fetch(`${API_URL}/products/${id}`);
  return handleResponse(res);
};

export const createProduct = async (formData) => {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
    },
    body: formData,
  });

  return handleResponse(res);
};

export const updateProduct = async (id, formData) => {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
    },
    body: formData,
  });

  return handleResponse(res);
};

export const deleteProduct = async (id) => {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  return handleResponse(res);
};

/* ================= ORDERS (USER) ================= */

export const createOrder = async (order) => {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(order),
  });

  return handleResponse(res);
};

export const getMyOrders = async () => {
  const res = await fetch(`${API_URL}/orders/my`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  return handleResponse(res);
};

export const getOrderById = async (orderId) => {
  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  return handleResponse(res);
};

/* ================= ADMIN ORDERS ================= */

export const getAllOrdersAdmin = async () => {
  const res = await fetch(`${API_URL}/orders/admin`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  return handleResponse(res);
};

export const updateOrderStatusAdmin = async (orderId, status) => {
  const res = await fetch(`${API_URL}/orders/admin/${orderId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ status }),
  });

  return handleResponse(res);
};

/* ================= ADMIN STATISTICS ================= */

export const getOrderStatsAdmin = async () => {
  const res = await fetch(`${API_URL}/orders/admin/stats`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  return handleResponse(res);
};

// 🔥 Sản phẩm bán chạy
export const getBestSellingProducts = async () => {
  const res = await fetch(`${API_URL}/orders/admin/best-products`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  return handleResponse(res);
};

// ⏳ Đơn hàng chưa hoàn thành
export const getUncompletedOrders = async () => {
  const res = await fetch(`${API_URL}/orders/admin/uncompleted`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  return handleResponse(res);
};
export const getCategories = async () => {
  const res = await fetch("http://localhost:5000/api/categories");
  return res.json();
};
