import ManagerHeader from "./ManagerHeader";

function ManagerLayout({ children }) {
  return (
    <>
      <ManagerHeader />
      <main style={{ padding: "20px" }}>{children}</main>
    </>
  );
}

export default ManagerLayout;
