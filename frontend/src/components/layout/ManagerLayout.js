import React from 'react';
import DashboardLayout from './DashboardLayout';

function ManagerLayout({ children }) {
  return <DashboardLayout explicitRole="MANAGER">{children}</DashboardLayout>;
}

export default ManagerLayout;
