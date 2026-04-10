const API = "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// --- CUSTOMER APIs ---

export async function getMyThread() {
  const res = await fetch(`${API}/chat/my-thread`, { headers: authHeaders() });
  return res.json();
}

export async function getMyMessages(threadId) {
  if (!threadId) return [];
  const res = await fetch(`${API}/chat/messages/${threadId}`, { headers: authHeaders() });
  return res.json();
}

export async function sendMyMessage(content, threadId) {
  const res = await fetch(`${API}/chat/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content, threadId }),
  });
  return res.json();
}

// 🔥 Hàm bị thiếu gây ra lỗi Compile
export async function getMyOrdersSummary() {
  const res = await fetch(`${API}/chat/orders-summary`, {
    headers: authHeaders(),
  });
  return res.json();
}

// --- ADMIN APIs ---

export async function adminListThreads() {
  const res = await fetch(`${API}/chat/admin/threads`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function adminGetThreadMessages(threadId) {
  const res = await fetch(`${API}/chat/admin/messages/${threadId}`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function adminSendMessage(threadId, content) {
  const res = await fetch(`${API}/chat/admin/messages/${threadId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  return res.json();
}

// Hàm lấy tóm tắt đơn hàng cho Admin Panel
export async function adminGetUserOrdersSummary(userId) {
  const res = await fetch(`${API}/chat/admin/orders/${userId}`, {
    headers: authHeaders(),
  });
  return res.json();
}

// Hàm lấy gợi ý AI
export async function getAiSuggestion(threadId) {
  const res = await fetch(`${API}/chat/ai/suggest/${threadId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  return res.json();
}
