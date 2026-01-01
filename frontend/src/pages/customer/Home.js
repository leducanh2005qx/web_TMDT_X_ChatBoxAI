import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import Shop from "./Shop";

function Home({ cart, setCart }) {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (!token || !userRole) {
      navigate("/login");
    } else {
      setRole(userRole);
    }
  }, [navigate]);

  if (!role) return <p>Đang tải...</p>;

  return (
    <>
      <Header />

      {role === "ADMIN" ? (
        navigate("/admin/dashboard")
      ) : (
        <Shop cart={cart} setCart={setCart} />
      )}
    </>
  );
}

export default Home;
