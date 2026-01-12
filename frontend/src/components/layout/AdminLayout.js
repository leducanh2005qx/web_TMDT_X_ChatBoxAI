import AdminHeader from "./AdminHeader";

function AdminLayout({ children }) {
  return (
    <>
      <AdminHeader />
      <main style={{ padding: "20px" }}>{children}</main>
    </>
  );
}

export default AdminLayout;
