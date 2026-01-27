const API_URL = "http://localhost:5000/api";

/* ================= HELPER FUNCTIONS ================= */

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Bạn chưa đăng nhập");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

const handleResponse = async (res) => {
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(data.message || "Không có quyền truy cập");
    }
    if (res.status >= 500) {
      throw new Error(data.message || "Lỗi hệ thống server");
    }
    throw new Error(data.message || "Lỗi yêu cầu");
  }
  return data;
};

/* ================= AUTHENTICATION ================= */

export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(res);
  if (data.token) localStorage.setItem("token", data.token);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
  return data;
};

export const register = (name, email, password, phone) =>
  fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, phone }),
  }).then(handleResponse);

/* ================= PRODUCTS ================= */

export const getProducts = () =>
  fetch(`${API_URL}/products`).then(handleResponse);

export const getProductById = (id) =>
  fetch(`${API_URL}/products/${id}`).then(handleResponse);

export const createProduct = (formData) =>
  fetch(`${API_URL}/products`, {
    method: "POST",
    headers: getAuthHeader(),
    body: formData,
  }).then(handleResponse);

export const updateProduct = (id, formData) =>
  fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: getAuthHeader(),
    body: formData,
  }).then(handleResponse);

export const deleteProduct = (id) =>
  fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  }).then(handleResponse);

/* ================= PRODUCT VARIANTS ================= */

export const getVariantsByProductId = (productId) =>
  fetch(`${API_URL}/variants/product/${productId}`).then(handleResponse);

export const createVariant = (productId, payload) =>
  fetch(`${API_URL}/variants/product/${productId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateVariant = (variantId, payload) =>
  fetch(`${API_URL}/variants/${variantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const deleteVariant = (variantId) =>
  fetch(`${API_URL}/variants/${variantId}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  }).then(handleResponse);

/* ================= ORDERS (USER & ADMIN) ================= */

export const createOrder = (order) =>
  fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(order),
  }).then(handleResponse);

export const getMyOrders = () =>
  fetch(`${API_URL}/orders/my`, { headers: getAuthHeader() }).then(
    handleResponse,
  );

export const getOrderById = (orderId) =>
  fetch(`${API_URL}/orders/${orderId}`, { headers: getAuthHeader() }).then(
    handleResponse,
  );

export const getAllOrdersAdmin = () =>
  fetch(`${API_URL}/orders/admin`, { headers: getAuthHeader() }).then(
    handleResponse,
  );

export const updateOrderStatusAdmin = (orderId, status) =>
  fetch(`${API_URL}/orders/admin/${orderId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ status }),
  }).then(handleResponse);

/* ================= CATEGORIES ================= */

export const getCategories = () =>
  fetch(`${API_URL}/categories`).then(handleResponse);

export const createCategory = (name) =>
  fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ name }),
  }).then(handleResponse);

export const updateCategory = (id, name) =>
  fetch(`${API_URL}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ name }),
  }).then(handleResponse);

export const deleteCategory = (id) =>
  fetch(`${API_URL}/categories/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  }).then(handleResponse);

/* ================= USER PROFILE ================= */

export const getMyProfile = () =>
  fetch(`${API_URL}/users/me`, { headers: getAuthHeader() }).then(
    handleResponse,
  );

export const updateMyProfile = (payload) =>
  fetch(`${API_URL}/users/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  }).then(handleResponse);

/* ================= VOUCHERS (ĐỒNG BỘ MYSQL) ================= */

export const getAvailableVouchers = () =>
  fetch(`${API_URL}/vouchers`, { headers: getAuthHeader() }).then(
    handleResponse,
  );

export const applyVoucher = (code, total) =>
  fetch(`${API_URL}/vouchers/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ code, total }),
  }).then(handleResponse);

export const getAllVouchersAdmin = () =>
  fetch(`${API_URL}/vouchers`, { headers: getAuthHeader() }).then(
    handleResponse,
  );

export const createVoucher = (payload) =>
  fetch(`${API_URL}/vouchers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateVoucher = (id, payload) =>
  fetch(`${API_URL}/vouchers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateVoucherStatusAdmin = (id) =>
  fetch(`${API_URL}/vouchers/${id}/toggle`, {
    method: "PUT",
    headers: getAuthHeader(),
  }).then(handleResponse);

export const toggleVoucher = (id) => updateVoucherStatusAdmin(id);

/* ================= CHAT SYSTEM ================= */

export const getChatRooms = () =>
  fetch(`${API_URL}/chat/rooms`, { headers: getAuthHeader() }).then(
    handleResponse,
  );

export const getMessagesByRoom = (roomId) =>
  fetch(`${API_URL}/chat/messages/${roomId}`, {
    headers: getAuthHeader(),
  }).then(handleResponse);

/* ================= ADMIN STATISTICS ================= */

export const getOrderStatsAdmin = () =>
  fetch(`${API_URL}/orders/admin/stats`, { headers: getAuthHeader() }).then(
    handleResponse,
  );

export const getBestSellingProducts = () =>
  fetch(`${API_URL}/orders/admin/best-products`, {
    headers: getAuthHeader(),
  }).then(handleResponse);

export const getUncompletedOrders = () =>
  fetch(`${API_URL}/orders/admin/uncompleted`, {
    headers: getAuthHeader(),
  }).then(handleResponse);
