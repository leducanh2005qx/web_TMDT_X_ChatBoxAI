// frontend/src/services/chatApi.js
const API = "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getMyThread() {
  const res = await fetch(`${API}/chat/thread`, { headers: authHeaders() });
  return res.json();
}

export async function getMyMessages() {
  const res = await fetch(`${API}/chat/messages?limit=80`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function sendMyMessage(message, orderId = null) {
  const res = await fetch(`${API}/chat/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message, orderId }),
  });
  return res.json();
}

export async function getMyOrdersSummary() {
  const res = await fetch(`${API}/chat/orders-summary`, {
    headers: authHeaders(),
  });
  return res.json();
}

// ADMIN
export async function adminListThreads() {
  const res = await fetch(`${API}/chat/admin/threads`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function adminGetThreadMessages(threadId) {
  const res = await fetch(
    `${API}/chat/admin/threads/${threadId}/messages?limit=120`,
    {
      headers: authHeaders(),
    }
  );
  return res.json();
}

export async function adminSendMessage(threadId, message, orderId = null) {
  const res = await fetch(`${API}/chat/admin/threads/${threadId}/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message, orderId }),
  });
  return res.json();
}

export async function adminGetUserOrdersSummary(userId) {
  const res = await fetch(`${API}/chat/admin/users/${userId}/orders-summary`, {
    headers: authHeaders(),
  });
  return res.json();
}
