import React from 'react';
import DashboardLayout from './DashboardLayout';

function AdminLayout({ children }) {
  return <DashboardLayout explicitRole="ADMIN">{children}</DashboardLayout>;
}

export default AdminLayout;
