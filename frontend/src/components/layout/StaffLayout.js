import StaffHeader from "./StaffHeader";

function StaffLayout({ children }) {
  return (
    <>
      <StaffHeader />
      <main style={{ padding: "20px" }}>{children}</main>
    </>
  );
}

export default StaffLayout;
