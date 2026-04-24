import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, ShieldCheck, Truck, Zap } from "lucide-react";
import { getProducts } from "../../services/api";
import SmartProductCard from "../../components/customer/SmartProductCard";

function Home({ addToCart }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setFeaturedProducts(list.slice(0, 4)); // Get first 4 for featured
    });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex flex-col gap-12 lg:gap-20">
      {/* HERO SECTION */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden rounded-[2rem] bg-[#333]">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent z-10"></div>
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero" 
            className="w-full h-full object-cover opacity-60"
          />
        </motion.div>

        <div className="relative z-20 text-center px-6 max-w-4xl">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="bg-[#FF8C00] text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] mb-6 inline-block uppercase">
              ✨ Tiger Shop Premium 2026
            </span>
            <h1 className="text-5xl lg:text-8xl text-white font-['Lexend'] mb-6 tracking-tighter">
              BẢN LĨNH <span className="text-[#FF8C00]">TIGER</span>
            </h1>
            <p className="text-gray-300 text-lg lg:text-xl mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
              Khám phá hệ sinh thái mua sắm đẳng cấp. Nơi hội tụ những siêu phẩm công nghệ và thời trang hàng đầu dành cho bản lĩnh dẫn đầu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate("/shop")}
                className="tiger-btn text-lg py-4 px-8"
              >
                MUA SẮM NGAY <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => navigate("/orders")}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 py-4 px-8 rounded-xl font-bold transition-all"
              >
                THEO DÕI ĐƠN
              </button>
            </div>
          </motion.div>
        </div>

        {/* Floating Stat Labels */}
        <div className="absolute bottom-10 left-10 z-20 hidden lg:flex gap-8">
           <div className="text-white border-l-2 border-[#FF8C00] pl-4">
              <div className="text-2xl font-bold font-['Lexend']">50k+</div>
              <div className="text-[10px] uppercase tracking-widest opacity-60">Khách hàng tin dùng</div>
           </div>
           <div className="text-white border-l-2 border-[#FF8C00] pl-4">
              <div className="text-2xl font-bold font-['Lexend']">24h</div>
              <div className="text-[10px] uppercase tracking-widest opacity-60">Giao hàng nội thành</div>
           </div>
        </div>
      </section>

      {/* SERVICE GRID */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10"
      >
        <motion.div variants={itemVariants} className="tiger-card p-8 flex flex-col gap-4">
          <div className="w-12 h-12 bg-orange-100 text-[#FF8C00] rounded-xl flex items-center justify-center">
            <Truck size={24} />
          </div>
          <div>
            <h4 className="text-lg font-bold mb-2">Giao hàng thần tốc</h4>
            <p className="text-sm text-gray-500">Hệ thống Tiger Express giúp đơn hàng đến tay bạn chỉ trong vài giờ.</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="tiger-card p-8 flex flex-col gap-4">
          <div className="w-12 h-12 bg-green-100 text-[#10B981] rounded-xl flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="text-lg font-bold mb-2">Bảo hành 12 tháng</h4>
            <p className="text-sm text-gray-500">Chính sách bảo hành 1 đổi 1 trong vòng 30 ngày nếu phát hiện lỗi từ NSX.</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="tiger-card p-8 flex flex-col gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Zap size={24} />
          </div>
          <div>
            <h4 className="text-lg font-bold mb-2">Ưu đãi độc quyền</h4>
            <p className="text-sm text-gray-500">Tiger AI gợi ý các mã giảm giá cá nhân hóa giúp bạn tiết kiệm tối đa.</p>
          </div>
        </motion.div>
      </motion.section>

      {/* FEATURED PRODUCTS */}
      <section className="flex flex-col gap-8">
        <div className="flex items-end justify-between border-b border-gray-100 pb-6">
          <div>
            <span className="text-[#FF8C00] font-black text-xs tracking-widest uppercase">Bộ sưu tập</span>
            <h2 className="text-3xl lg:text-4xl">SẢN PHẨM NỔI BẬT</h2>
          </div>
          <button 
            onClick={() => navigate("/shop")}
            className="text-[#FF8C00] font-bold text-sm flex items-center gap-2 hover:underline"
          >
            XEM TẤT CẢ <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {featuredProducts.length > 0 ? (
            featuredProducts.map(p => (
              <SmartProductCard 
                key={p.id} 
                product={p} 
                onAddToCart={addToCart} 
              />
            ))
          ) : (
            // Skeleton Placeholders
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse aspect-[3/4] rounded-2xl"></div>
            ))
          )}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="bg-gradient-to-r from-[#FF8C00] to-[#CC7000] rounded-[2rem] p-10 lg:p-20 text-white flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="max-w-xl text-center lg:text-left">
          <h2 className="text-4xl lg:text-5xl mb-6">Trở thành thành viên của Tiger Shop</h2>
          <p className="text-white/80 text-lg">Đăng ký ngay để nhận thông báo về các siêu phẩm giới hạn và ưu đãi độc quyền 50% cho đơn hàng đầu tiên.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/20 p-2 rounded-2xl backdrop-blur-md w-full max-w-md">
           <input type="text" placeholder="Email của bạn..." className="bg-transparent border-none outline-none px-4 py-3 text-white placeholder:text-white/60 w-full" />
           <button className="bg-white text-[#FF8C00] px-6 py-3 rounded-xl font-bold whitespace-nowrap shadow-xl">ĐĂNG KÝ</button>
        </div>
      </section>
    </div>
  );
}

export default Home;
