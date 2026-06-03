import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, Zap, Quote } from "lucide-react";
import { getProducts, getCategories } from "../../services/api";
import SmartProductCard from "../../components/customer/SmartProductCard";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function Home({ addToCart }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch Products
    getProducts().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setFeaturedProducts(list.slice(0, 10));
    });

    // Fetch Categories
    getCategories().then((data) => {
      setCategories(Array.isArray(data) ? data : []);
    });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  // Helper for category emojis
  const getCategoryEmoji = (name) => {
    const n = name.toLowerCase();
    if (n.includes("điện tử") || n.includes("electronics") || n.includes("điện thoại") || n.includes("máy tính")) return "💻";
    if (n.includes("thời trang") || n.includes("fashion") || n.includes("quần áo")) return "👕";
    if (n.includes("phụ kiện") || n.includes("accessory")) return "🎧";
    if (n.includes("giày") || n.includes("shoes")) return "👟";
    if (n.includes("mỹ phẩm") || n.includes("beauty")) return "💄";
    return "📦";
  };

  const testimonials = [
    {
      name: "Nguyễn Đức Mạnh",
      tag: "Đại gia Hà Đông",
      comment: "Giao hàng cực kỳ nhanh, chất lượng sản phẩm quá đỉnh sếp Đức Anh ơi! Vừa đặt 1 tiếng đã có shipper gõ cửa giao hỏa tốc.",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=manh"
    },
    {
      name: "Trần Thu Trang",
      tag: "Tín đồ mua sắm",
      comment: "Đồ của Tiger Shop dùng siêu bền, được tặng voucher 50% mua hời kinh khủng. Chắc chắn sẽ quay lại mua thêm nhiều lần nữa!",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=trang"
    },
    {
      name: "Phạm Quốc Huy",
      tag: "Tech Reviewer",
      comment: "Là người khó tính về đồ công nghệ nhưng mình hoàn toàn bị thuyết phục bởi Tiger Shop. Hàng chính hãng, đóng gói cực kỳ cẩn thận.",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=huy"
    }
  ];

  return (
    <div className="flex flex-col gap-16 lg:gap-24 relative overflow-hidden">
      {/* BACKGROUND DECORATIVE BLOBS */}
      <div className="absolute top-[10%] left-[-200px] neon-blob blob-orange opacity-10"></div>
      <div className="absolute bottom-[20%] right-[-200px] neon-blob blob-peach opacity-10"></div>

      {/* HERO SECTION WITH SWIPER CAROUSEL */}
      <section className="relative h-[400px] md:h-[550px] lg:h-[600px] overflow-hidden rounded-[2rem] bg-gray-950 shadow-2xl">
        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          className="h-full"
          style={{
            '--swiper-navigation-color': '#FFFFFF',
            '--swiper-pagination-color': '#FF8C00',
          }}
        >
          {/* Slide 1 - Tech */}
          <SwiperSlide className="relative h-full flex items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" 
              alt="Tech Banner" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="relative z-20 text-left px-8 md:px-20 max-w-3xl flex flex-col items-start gap-4">
              <span className="premium-tag text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] uppercase">
                ⚡ Tiger Tech Premium
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl text-white font-extrabold tracking-tight font-['Lexend'] leading-none">
                BẢN LĨNH <span className="text-[#FF8C00]">CÔNG NGHỆ</span>
              </h1>
              <p className="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed max-w-xl font-medium">
                Khám phá thế giới số đỉnh cao với những siêu phẩm công nghệ, điện thoại và phụ kiện chính hãng đẳng cấp dành cho người dẫn đầu.
              </p>
              <button 
                onClick={() => navigate("/shop")}
                className="tiger-btn mt-2 px-8 py-3.5 text-sm uppercase tracking-wider"
              >
                MUA SẮM NGAY <ArrowRight size={18} />
              </button>
            </div>
          </SwiperSlide>

          {/* Slide 2 - Fashion */}
          <SwiperSlide className="relative h-full flex items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" 
              alt="Fashion Banner" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="relative z-20 text-left px-8 md:px-20 max-w-3xl flex flex-col items-start gap-4">
              <span className="premium-tag text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] uppercase">
                🔥 Tiger Fashion 2026
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl text-white font-extrabold tracking-tight font-['Lexend'] leading-none">
                PHONG CÁCH <span className="text-[#FF8C00]">THỜI THƯỢNG</span>
              </h1>
              <p className="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed max-w-xl font-medium">
                Tự tin khẳng định chất riêng qua những bộ trang phục thời thượng, kiểu dáng trẻ trung, hiện đại được đề xuất bởi sếp Đức Anh.
              </p>
              <button 
                onClick={() => navigate("/shop")}
                className="tiger-btn mt-2 px-8 py-3.5 text-sm uppercase tracking-wider"
              >
                XEM BỘ SƯU TẬP <ArrowRight size={18} />
              </button>
            </div>
          </SwiperSlide>

          {/* Slide 3 - Welcome Voucher */}
          <SwiperSlide className="relative h-full flex items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1513885045260-6b35d6d3a9a7?q=80&w=2070&auto=format&fit=crop" 
              alt="Voucher Banner" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="relative z-20 text-left px-8 md:px-20 max-w-3xl flex flex-col items-start gap-4">
              <span className="premium-tag text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] uppercase">
                🎁 Quà Chào Mừng
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl text-white font-extrabold tracking-tight font-['Lexend'] leading-none">
                TẶNG VOUCHER <span className="text-[#FF8C00]">GIẢM 50%</span>
              </h1>
              <p className="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed max-w-xl font-medium">
                Mở tài khoản thành viên ngay hôm nay để nhận voucher giảm nửa giá tự động lên đến 100.000đ gửi thẳng vào ví cá nhân của bạn.
              </p>
              <button 
                onClick={() => navigate("/register")}
                className="tiger-btn mt-2 px-8 py-3.5 text-sm uppercase tracking-wider"
              >
                ĐĂNG KÝ NHẬN QUÀ <ArrowRight size={18} />
              </button>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>

      {/* SERVICE GRID */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
      >
        <motion.div variants={itemVariants} className="tiger-card p-6 flex items-center gap-5 hover:border-[#FF8C00]/40 transition-all">
          <div className="w-14 h-14 bg-orange-100/80 text-[#FF8C00] rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <Truck size={26} />
          </div>
          <div>
            <h4 className="text-md font-bold mb-1">Giao hàng hỏa tốc</h4>
            <p className="text-xs text-gray-500">Đơn hàng đến tay bạn chỉ trong vòng vài giờ nội thành Hà Đông.</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="tiger-card p-6 flex items-center gap-5 hover:border-[#FF8C00]/40 transition-all">
          <div className="w-14 h-14 bg-green-100/80 text-[#10B981] rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h4 className="text-md font-bold mb-1">Bảo hành 1 đổi 1</h4>
            <p className="text-xs text-gray-500">Cam kết bảo hành 12 tháng, đổi trả miễn phí 30 ngày nếu có lỗi.</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="tiger-card p-6 flex items-center gap-5 hover:border-[#FF8C00]/40 transition-all">
          <div className="w-14 h-14 bg-blue-100/80 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <Zap size={26} />
          </div>
          <div>
            <h4 className="text-md font-bold mb-1">Ưu đãi độc quyền</h4>
            <p className="text-xs text-gray-500">Mã giảm giá cá nhân hóa từ Tiger AI thông minh gợi ý riêng cho bạn.</p>
          </div>
        </motion.div>
      </motion.section>

      {/* FEATURED CATEGORIES SECTION */}
      {categories.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[#FF8C00] font-black text-xs tracking-widest uppercase">Phân loại</span>
            <h2 className="text-2xl lg:text-3xl font-extrabold mt-1">DANH MỤC NỔI BẬT</h2>
          </div>

          <div className="w-full relative px-2">
            <Swiper
              modules={[Navigation]}
              spaceBetween={16}
              slidesPerView={2}
              navigation
              breakpoints={{
                480: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 6 }
              }}
              className="pb-4 !px-2"
              style={{
                '--swiper-navigation-color': '#FF8C00',
                '--swiper-pagination-color': '#FF8C00',
              }}
            >
              {categories.map((cat) => (
                <SwiperSlide key={cat.id}>
                  <div 
                    onClick={() => navigate("/shop", { state: { category: cat.name } })}
                    className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center cursor-pointer shadow-sm hover:shadow-md hover:border-[#FF8C00] transition-all hover:-translate-y-1.5 h-full"
                  >
                    <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-2xl shadow-inner shrink-0">
                      {getCategoryEmoji(cat.name)}
                    </div>
                    <span className="text-xs font-bold text-gray-700 truncate w-full">{cat.name}</span>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section className="flex flex-col gap-8">
        <div className="flex items-end justify-between border-b border-gray-100 pb-4">
          <div>
            <span className="text-[#FF8C00] font-black text-xs tracking-widest uppercase">Gợi ý siêu phẩm</span>
            <h2 className="text-2xl lg:text-3xl font-extrabold mt-1">SẢN PHẨM NỔI BẬT</h2>
          </div>
          <button 
            onClick={() => navigate("/shop")}
            className="text-[#FF8C00] font-bold text-xs flex items-center gap-2 hover:underline uppercase tracking-wider"
          >
            Xem tất cả <ArrowRight size={16} />
          </button>
        </div>

        <div className="w-full">
          {featuredProducts.length > 4 ? (
             <Swiper
               modules={[Autoplay, Navigation, Pagination]}
               spaceBetween={24}
               slidesPerView={2}
               breakpoints={{
                 768: { slidesPerView: 3 },
                 1024: { slidesPerView: 4 },
               }}
               navigation
               autoplay={{
                 delay: 3500,
                 disableOnInteraction: false,
               }}
               className="pb-10 !px-2"
               style={{
                 '--swiper-navigation-color': '#FF8C00',
                 '--swiper-pagination-color': '#FF8C00',
               }}
             >
               {featuredProducts.map(p => (
                 <SwiperSlide key={p.id} className="h-auto pb-4">
                   <SmartProductCard 
                     product={p} 
                     onAddToCart={addToCart} 
                   />
                 </SwiperSlide>
               ))}
             </Swiper>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 px-2">
              {featuredProducts.map(p => (
                <SmartProductCard 
                  key={p.id} 
                  product={p} 
                  onAddToCart={addToCart} 
                />
              ))}
            </div>
          ) : (
            // Skeleton Placeholders
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 px-2">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-100 animate-pulse aspect-[3/4] rounded-2xl"></div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CUSTOMER TESTIMONIALS */}
      <section className="bg-orange-50/50 rounded-[2.5rem] p-10 lg:p-16 border border-orange-100 flex flex-col gap-10">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-[#FF8C00] font-black text-xs tracking-widest uppercase">Phản hồi thực tế</span>
          <h2 className="text-2xl lg:text-3xl font-extrabold mt-1">KHÁCH HÀNG NÓI GÌ VỀ TIGER SHOP? 💬</h2>
        </div>

        <div className="w-full">
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000 }}
            className="pb-10"
          >
            {testimonials.map((t, idx) => (
              <SwiperSlide key={idx} className="h-auto">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-full hover:border-[#FF8C00]/30 transition-all">
                  <div className="flex flex-col gap-4">
                    <Quote className="text-orange-200" size={32} />
                    <p className="text-sm text-gray-600 italic leading-relaxed">"{t.comment}"</p>
                  </div>
                  <div className="flex items-center gap-4 border-t border-gray-50 pt-4 mt-6">
                    <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full bg-orange-100 p-1 border border-orange-200" />
                    <div>
                      <h5 className="text-sm font-bold text-gray-800">{t.name}</h5>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#FF8C00] bg-orange-50 px-2 py-0.5 rounded-full">{t.tag}</span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="bg-gradient-to-r from-[#FF8C00] to-[#CC7000] rounded-[2rem] p-10 lg:p-20 text-white flex flex-col lg:flex-row items-center justify-between gap-10 shadow-lg">
        <div className="max-w-xl text-center lg:text-left">
          <h2 className="text-3xl lg:text-4xl mb-4 font-extrabold tracking-tight">Trở thành thành viên của Tiger Shop</h2>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">Đăng ký ngay để nhận thông báo về các siêu phẩm giới hạn và ưu đãi độc quyền 50% cho đơn hàng đầu tiên.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/20 p-2 rounded-2xl backdrop-blur-md w-full max-w-md border border-white/10">
           <input type="text" placeholder="Email của bạn..." className="bg-transparent border-none outline-none px-4 py-3 text-white placeholder:text-white/60 w-full text-sm" />
           <button className="bg-white text-[#FF8C00] hover:bg-orange-50 px-6 py-3 rounded-xl font-bold whitespace-nowrap shadow-xl text-sm transition-colors active:scale-95">ĐĂNG KÝ</button>
        </div>
      </section>
    </div>
  );
}

export default Home;
