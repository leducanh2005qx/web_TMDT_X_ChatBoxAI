import React, { useEffect, useState, useMemo } from 'react';
import { CreditCard, DollarSign, TrendingUp, PieChart, Calendar, Award } from 'lucide-react';
import { getMyPayroll } from '../../services/api';

export default function StaffPayroll() {
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const data = await getMyPayroll(month);
      setPayrollData(data);
    } catch (err) {
      console.error("Lỗi tải bảng lương:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, [month]);

  if (loading) return <div className="text-center py-5">Đang tính toán bảng lương...</div>;

  const baseSalary = Number(payrollData?.base_salary || 0);
  const commission = Number(payrollData?.commission_amount || 0);
  const totalSalary = baseSalary + commission;
  const totalHours = Number(payrollData?.total_hours || 0);

  return (
    <div className="payroll-section">
      <div className="d-flex justify-content-between align-items-center mb-4">
         <h2 className="m-0 h4">💰 Thu nhập cá nhân</h2>
         <input 
            type="month" 
            className="form-control form-control-sm w-auto" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)} 
         />
      </div>

      <div className="stats-strip">
        <div className="stat-item">
          <span className="stat-label">Lương theo giờ ({payrollData?.employment_status})</span>
          <span className="stat-value">{baseSalary.toLocaleString()}đ</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Hoa hồng (1%)</span>
          <span className="stat-value text-success">+{commission.toLocaleString()}đ</span>
        </div>
        <div className="stat-item total-salary shadow-sm border-primary">
          <span className="stat-label">TỔNG THU NHẬP</span>
          <span className="stat-value text-blue">{totalSalary.toLocaleString()}đ</span>
        </div>
      </div>

      <div className="card mt-4 p-4 border-0 shadow-sm rounded-4">
        <h4 className="mb-4 d-flex align-items-center gap-2"><PieChart size={20} className="text-primary" /> Chi tiết hiệu suất {month}</h4>
        
        <div className="performance-grid">
          <div className="perf-card">
            <div className="icon-box blue"><Calendar size={24} /></div>
            <div className="info">
              <div className="label">Tổng giờ làm</div>
              <div className="val">{totalHours} giờ</div>
            </div>
          </div>
          
          <div className="perf-card">
            <div className="icon-box green"><Award size={24} /></div>
            <div className="info">
              <div className="label">Hoa hồng đơn hàng</div>
              <div className="val">{commission.toLocaleString()}đ</div>
            </div>
          </div>
        </div>

        <div className="alert alert-warning mt-4 border-0 rounded-3">
          <small>
            <strong>Ghi chú:</strong> Lương cứng được tính bằng <code>Tổng giờ làm x Mức lương ({payrollData?.employment_status === 'official' ? '25k' : '20k'}/h)</code>. 
            Hoa hồng 1% được tính trên các đơn hàng bạn trực tiếp xác nhận thành công.
          </small>
        </div>
      </div>

      <style jsx>{`
        .payroll-section { animation: fadeIn 0.3s ease; }
        .stats-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .stat-item { background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .stat-label { display: block; font-size: 0.8rem; color: #64748b; margin-bottom: 5px; }
        .stat-value { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
        
        .performance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .perf-card { display: flex; align-items: center; gap: 15px; padding: 20px; background: #f8fafc; border-radius: 15px; }
        .icon-box { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
        .icon-box.blue { background: #3b82f6; }
        .icon-box.green { background: #10b981; }
        .perf-card .label { font-size: 0.85rem; color: #64748b; }
        .perf-card .val { font-size: 1.2rem; font-weight: 700; color: #1e293b; }
        .total-salary { background: #f0f9ff !important; border-color: #0369a1 !important; border-width: 2px !important; }
        .text-blue { color: #0369a1; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .stats-strip { grid-template-columns: 1fr; }
          .performance-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
