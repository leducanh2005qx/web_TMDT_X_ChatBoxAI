import React, { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { MessageSquare, User, Search } from 'lucide-react';
import StaffChatPanel from './StaffChatPanel';
import './SupportCenter.css';

const BACKEND_URL = 'http://localhost:5000';

export default function StaffSupportCenter() {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const s = io(BACKEND_URL, { transports: ["websocket"] });
    setSocket(s);

    s.on("staff_notification", () => fetchThreads());
    s.on("thread_status_updated", () => fetchThreads());

    return () => s.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchThreads = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/chat/admin/threads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setThreads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredThreads = useMemo(() => {
    return threads
      .filter(t => t.email.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (a.status === 'staff_needed' && b.status !== 'staff_needed') return -1;
        if (a.status !== 'staff_needed' && b.status === 'staff_needed') return 1;
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      });
  }, [threads, searchQuery]);

  return (
    <div className="messenger-layout">
      {/* Cột Trái: Danh sách khách hàng */}
      <div className={`messenger-sidebar ${selectedThread ? 'hidden-mobile' : ''}`}>
        <div className="sidebar-header">
          <h3>Chat Khách Hàng</h3>
          <div className="search-mini">
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Tìm theo email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="thread-scroll-area custom-scrollbar">
          {loading ? (
             <div className="p-3 text-center small text-muted">Đang tải...</div>
          ) : filteredThreads.length === 0 ? (
             <div className="p-3 text-center small text-muted">Không có hội thoại</div>
          ) : (
            filteredThreads.map(t => (
              <div 
                key={t.threadId} 
                className={`messenger-thread-item ${t.status} ${selectedThread?.threadId === t.threadId ? 'active' : ''}`}
                onClick={() => setSelectedThread(t)}
              >
                <div className="item-avatar">
                  <User size={20} />
                  {t.status === 'staff_needed' && <span className="status-dot-red" />}
                </div>
                <div className="item-info">
                  <div className="item-top">
                    <span className="email-label">{t.email.split('@')[0]}</span>
                    <span className="time-label">{new Date(t.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="item-status">
                    {t.status === 'ai' && <span className="txt-ai">🤖 AI trả lời</span>}
                    {t.status === 'staff_needed' && <span className="txt-needed">⚠️ Cần tư vấn</span>}
                    {t.status === 'staff_active' && <span className="txt-active">👨‍💼 Đang hỗ trợ</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cột Phải: Nội dung Chat */}
      <div className={`messenger-chat-area ${!selectedThread ? 'hidden-mobile' : ''}`}>
        {selectedThread ? (
          <StaffChatPanel 
            thread={selectedThread} 
            onBack={() => { setSelectedThread(null); fetchThreads(); }} 
          />
        ) : (
          <div className="chat-empty-state">
            <div className="content">
              <MessageSquare size={64} strokeWidth={1} className="mb-3 text-muted" />
              <h4>Chọn một khách hàng để bắt đầu tư vấn</h4>
              <p>Các yêu cầu "Cần tư vấn" sẽ luôn được ưu tiên lên đầu danh sách.</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .messenger-layout {
          display: flex;
          height: calc(100vh - 120px);
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
        }

        /* Sidebar */
        .messenger-sidebar {
          width: 320px;
          border-right: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .sidebar-header h3 {
          font-size: 1.1rem;
          font-weight: 800;
          margin-bottom: 15px;
        }

        .search-mini {
          position: relative;
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .search-mini input {
          border: none;
          background: transparent;
          font-size: 0.85rem;
          outline: none;
          width: 100%;
        }

        .thread-scroll-area {
          flex: 1;
          overflow-y: auto;
        }

        .messenger-thread-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 20px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid #f8fafc;
        }

        .messenger-thread-item:hover {
          background: #f8fafc;
        }

        .messenger-thread-item.active {
          background: #eff6ff;
        }

        .item-avatar {
          width: 44px;
          height: 44px;
          background: #f1f5f9;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          position: relative;
          flex-shrink: 0;
        }

        .status-dot-red {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: #ef4444;
          border: 2px solid white;
          border-radius: 50%;
        }

        .item-info {
          flex: 1;
          min-width: 0;
        }

        .item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .email-label {
          font-weight: 700;
          font-size: 0.95rem;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .time-label {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .item-status {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .txt-ai { color: #94a3b8; }
        .txt-needed { color: #ef4444; }
        .txt-active { color: #10b981; }

        /* Chat Area */
        .messenger-chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }

        .chat-empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px;
        }

        .chat-empty-state h4 { font-weight: 800; margin-top: 10px; }
        .chat-empty-state p { color: #64748b; max-width: 300px; margin: 0 auto; }

        @media (max-width: 768px) {
          .messenger-sidebar { width: 100%; border-right: none; }
          .hidden-mobile { display: none !important; }
          .messenger-sidebar.hidden-mobile { display: none !important; }
          .messenger-chat-area.hidden-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
