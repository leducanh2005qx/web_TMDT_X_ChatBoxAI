import React from 'react';
import DashboardLayout from './DashboardLayout';

function StaffLayout({ children }) {
  return <DashboardLayout explicitRole="STAFF">{children}</DashboardLayout>;
}

export default StaffLayout;
