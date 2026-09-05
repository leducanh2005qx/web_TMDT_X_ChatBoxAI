/**
 * Tiger3DExperience.jsx — v2.0 WOW Edition
 * ─────────────────────────────────────────
 * Stack: @react-three/fiber v9 · @react-three/drei v10 · three v0.185
 *        framer-motion · lucide-react · Tailwind CSS
 */

import React, {
  Suspense,
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Float,
  Sparkles,
  Environment,
  MeshReflectorMaterial,
  Text,
  useProgress,
  Html,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Bot,
  Palette,
  Star,
  Zap,
  RotateCcw,
  ZoomIn,
  Eye,
  Package,
  Heart,
  BadgeCheck,
  X,
} from "lucide-react";

// ──────────────────────────────────────────
//  DATA
// ──────────────────────────────────────────
const COLOURS = [
  { id: "tiger",  label: "Cam Tiger",   hex: "#ea580c", metalness: 0.3, roughness: 0.35 },
  { id: "obsidian",label: "Đen Obsidian",hex: "#1c1917", metalness: 0.6, roughness: 0.2  },
  { id: "navy",   label: "Navy Sapphire",hex: "#1e3a8a", metalness: 0.4, roughness: 0.3  },
  { id: "silver", label: "Bạc Platium", hex: "#c8c8d4", metalness: 0.95,roughness: 0.05 },
  { id: "gold",   label: "Vàng Hoàng Gia",hex:"#c9a84c",metalness: 0.95,roughness: 0.08 },
];

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

// ──────────────────────────────────────────
//  LOADING
// ──────────────────────────────────────────
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ textAlign: "center", color: "#fff", fontFamily: "Lexend, sans-serif" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🐯</div>
        <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 3, marginBottom: 8 }}>
          TIGER 3D
        </div>
        <div
          style={{
            width: 180,
            height: 4,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 4,
            overflow: "hidden",
            margin: "0 auto 8px",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg,#ea580c,#f97316)",
              borderRadius: 4,
              transition: "width 0.3s",
            }}
          />
        </div>
        <div style={{ fontSize: 12, opacity: 0.5 }}>
          Đang tải {Math.round(progress)}%
        </div>
      </div>
    </Html>
  );
}

// ──────────────────────────────────────────
//  SÀN PHẢN CHIẾU
// ──────────────────────────────────────────
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <MeshReflectorMaterial
        blur={[400, 150]}
        resolution={512}
        mixBlur={1.2}
        mixStrength={80}
        roughness={0.85}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050508"
        metalness={0.6}
        mirror={0.3}
      />
    </mesh>
  );
}

// ──────────────────────────────────────────
//  GRID LINES (visually shows 3D depth)
// ──────────────────────────────────────────
function GridLines() {
  return (
    <gridHelper
      args={[30, 30, "#ea580c22", "#ffffff08"]}
      position={[0, -2.19, 0]}
    />
  );
}

// ──────────────────────────────────────────
//  PRODUCT MODEL — Stylized Tech Device
// ──────────────────────────────────────────
function ProductModel({ colour }) {
  const groupRef   = useRef();
  const coreRef    = useRef();
  const ring1Ref   = useRef();
  const ring2Ref   = useRef();
  const glowRef    = useRef();
  const [hovered, setHovered] = useState(false);

  const col = useMemo(() => new THREE.Color(colour.hex), [colour.hex]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Tự xoay chậm
    groupRef.current.rotation.y += delta * 0.55;

    // Nảy nhẹ theo sin
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.12;

    // Core spinning
    if (coreRef.current) coreRef.current.rotation.x += delta * 1.1;
    if (coreRef.current) coreRef.current.rotation.z += delta * 0.7;

    // Ring spinning
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 1.3;
    if (ring2Ref.current) ring2Ref.current.rotation.x += delta * 0.9;

    // Glow pulse
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity =
        0.3 + Math.sin(t * 2.5) * 0.15;
    }

    // Hover: scale up
    const target = hovered ? 1.12 : 1.0;
    groupRef.current.scale.lerp(
      new THREE.Vector3(target, target, target),
      0.08
    );
  });

  return (
    <Float floatIntensity={1.2} speed={2.5} rotationIntensity={0.15}>
      <group
        ref={groupRef}
        castShadow
        receiveShadow
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        {/* ── Thân chính: Octahedron tinh thể ── */}
        <mesh castShadow>
          <octahedronGeometry args={[1.15, 3]} />
          <meshStandardMaterial
            color={col}
            metalness={colour.metalness}
            roughness={colour.roughness}
            envMapIntensity={3}
          />
        </mesh>

        {/* ── Lõi phát sáng bên trong ── */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.52, 1]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={col}
            emissiveIntensity={hovered ? 5 : 2.5}
            metalness={1}
            roughness={0}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* ── Vành xoay 1 ── */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.45, 0.035, 16, 100]} />
          <meshStandardMaterial
            color={col}
            emissive={col}
            emissiveIntensity={1.2}
            metalness={1}
            roughness={0.05}
          />
        </mesh>

        {/* ── Vành xoay 2 ── */}
        <mesh ref={ring2Ref} rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
          <torusGeometry args={[1.6, 0.018, 12, 100]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.55}
          />
        </mesh>

        {/* ── Aura / Hào quang ngoài ── */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.7, 32, 32]} />
          <meshStandardMaterial
            color={col}
            emissive={col}
            emissiveIntensity={0.3}
            transparent
            opacity={0.06}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {/* ── Điểm sáng tại 6 đỉnh ── */}
        {[
          [0, 1.3, 0], [0, -1.3, 0],
          [1.3, 0, 0], [-1.3, 0, 0],
          [0, 0, 1.3], [0, 0, -1.3],
        ].map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={col}
              emissiveIntensity={3}
              metalness={1}
              roughness={0}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

// ──────────────────────────────────────────
//  VỆ TINH BAY XUNG QUANH
// ──────────────────────────────────────────
function Satellite({ radius, speed, phaseOffset, meshColor, scale = 1 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + phaseOffset;
    ref.current.position.set(
      Math.cos(t) * radius,
      Math.sin(t * 0.7) * 0.6,
      Math.sin(t) * radius
    );
    ref.current.rotation.x += 0.04;
    ref.current.rotation.y += 0.02;
  });
  return (
    <mesh ref={ref} castShadow scale={scale}>
      <dodecahedronGeometry args={[0.1, 0]} />
      <meshStandardMaterial
        color={meshColor}
        emissive={meshColor}
        emissiveIntensity={2}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
}

// ──────────────────────────────────────────
//  ĐÈN
// ──────────────────────────────────────────
function Lights({ hexColor }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      {/* Đèn chính đổ bóng */}
      <directionalLight
        position={[6, 10, 6]}
        intensity={3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        color="#fff5e6"
      />
      {/* Đèn cam Tiger */}
      <pointLight position={[-5, 4, -3]} intensity={4} color={hexColor} distance={20} />
      {/* Fill light tím */}
      <pointLight position={[5, 2, 5]} intensity={2.5} color="#7c3aed" distance={15} />
      {/* Rim light trắng */}
      <pointLight position={[0, -1.5, 4]} intensity={1} color="#e0e8ff" distance={10} />
      {/* Under glow */}
      <pointLight position={[0, -2, 0]} intensity={0.8} color={hexColor} distance={8} />
    </>
  );
}

// ──────────────────────────────────────────
//  FULL SCENE
// ──────────────────────────────────────────
function Scene({ colour }) {
  return (
    <>
      <Lights hexColor={colour.hex} />
      <Environment preset="warehouse" />

      <Floor />
      <GridLines />

      {/* Bụi sáng cam */}
      <Sparkles
        count={160}
        scale={[14, 8, 14]}
        size={[0.4, 1.8]}
        speed={0.35}
        opacity={0.7}
        color={colour.hex}
      />
      {/* Bụi trắng nhỏ */}
      <Sparkles
        count={80}
        scale={[10, 5, 10]}
        size={[0.2, 0.8]}
        speed={0.2}
        opacity={0.25}
        color="#ffffff"
      />

      <ProductModel colour={colour} />

      {/* Vệ tinh 1 – màu product */}
      <Satellite radius={2.4} speed={0.65} phaseOffset={0} meshColor={colour.hex} scale={1.3} />
      {/* Vệ tinh 2 – tím */}
      <Satellite radius={2.8} speed={0.42} phaseOffset={2.1} meshColor="#7c3aed" scale={0.9} />
      {/* Vệ tinh 3 – trắng */}
      <Satellite radius={2.1} speed={0.9}  phaseOffset={4.2} meshColor="#e0e8ff" scale={0.7} />
      {/* Vệ tinh 4 – gold */}
      <Satellite radius={3.1} speed={0.3}  phaseOffset={1.05} meshColor="#f59e0b" scale={1.0} />

      {/* Bóng contact shadow */}
      <ContactShadows
        position={[0, -2.18, 0]}
        opacity={0.6}
        scale={10}
        blur={2.5}
        far={4}
        color="#000000"
      />

      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate={false}
        minDistance={3.5}
        maxDistance={11}
        maxPolarAngle={Math.PI / 2 - 0.08}
        minPolarAngle={0.15}
        dampingFactor={0.06}
        enableDamping
        rotateSpeed={0.8}
      />
    </>
  );
}

// ──────────────────────────────────────────
//  COLOUR SWATCH
// ──────────────────────────────────────────
function Swatch({ opt, active, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.25, y: -3 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onClick(opt)}
      title={opt.label}
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: opt.hex,
        border: active ? "2.5px solid #fff" : "2.5px solid rgba(255,255,255,0.18)",
        boxShadow: active ? `0 0 0 2.5px ${opt.hex}, 0 4px 14px ${opt.hex}88` : "none",
        cursor: "pointer",
        flexShrink: 0,
        transition: "box-shadow 0.2s",
      }}
    />
  );
}

// ──────────────────────────────────────────
//  WEBGL NOT SUPPORTED
// ──────────────────────────────────────────
function NoWebGL() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg,#0a0a0f,#1a1a2e)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ fontSize: 48 }}>🐯</div>
      <p style={{ fontWeight: 700, fontSize: 18 }}>Trình duyệt không hỗ trợ WebGL</p>
      <p style={{ opacity: 0.4, fontSize: 13, textAlign: "center", maxWidth: 300 }}>
        Vui lòng dùng Chrome / Firefox / Edge để trải nghiệm Tiger 3D.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────
//  MAIN EXPORT
// ──────────────────────────────────────────
export default function Tiger3DExperience({ onOpenChat, onAddToCart, hideHeader }) {
  const [colour, setColour]       = useState(COLOURS[0]);
  const [cart, setCart]           = useState(0);
  const [added, setAdded]         = useState(false);
  const [liked, setLiked]         = useState(false);
  const [webgl, setWebgl]         = useState(true);
  const [showHint, setShowHint]   = useState(true);
  const [showToast, setShowToast] = useState(false);

  // detect WebGL
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      if (!c.getContext("webgl") && !c.getContext("experimental-webgl")) setWebgl(false);
    } catch { setWebgl(false); }
    const t = setTimeout(() => setShowHint(false), 4500);
    return () => clearTimeout(t);
  }, []);

  const handleAdd = useCallback(() => {
    setCart((n) => n + 1);
    setAdded(true);
    setShowToast(true);
    if (onAddToCart) onAddToCart();
    setTimeout(() => setAdded(false),  2000);
    setTimeout(() => setShowToast(false), 3000);
  }, [onAddToCart]);

  return (
    <div
      style={{
        width: "100%",
        height: "100svh",
        minHeight: 560,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(155deg,#040408 0%,#0c0c18 60%,#07070e 100%)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ── Grid BG ── */}
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(rgba(234,88,12,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(234,88,12,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* ── CANVAS ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        {webgl ? (
          <Canvas
            shadows
            dpr={[1, Math.min(window.devicePixelRatio, 2)]}
            camera={{ position: [0, 1.8, 6.5], fov: 42, near: 0.1, far: 200 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <Suspense fallback={<Loader />}>
              <Scene colour={colour} />
            </Suspense>
          </Canvas>
        ) : (
          <NoWebGL />
        )}
      </div>

      {/* ── Colour-reactive ambient glow ── */}
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
          background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${colour.hex}14 0%, transparent 70%)`,
          transition: "background 0.6s ease",
        }}
      />
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
          zIndex: 2, pointerEvents: "none",
          background: `linear-gradient(to top, ${colour.hex}0a, transparent)`,
          transition: "background 0.6s ease",
        }}
      />

      {/* ════════════════════════════════════
          HEADER
      ════════════════════════════════════ */}
      {!hideHeader && (
        <header
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: 60, zIndex: 30,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
          background: "rgba(4,4,12,0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg,#ea580c,#7c2d12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17,
              boxShadow: "0 4px 14px rgba(234,88,12,0.55)",
            }}
          >
            🐯
          </div>
          <div>
            <div style={{ fontFamily: "Lexend, sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: "0.18em", color: "#fff" }}>
              TIGER<span style={{ color: "#ea580c" }}>SHOP</span>
            </div>
            <div style={{ fontSize: 8.5, color: "#ea580c", fontWeight: 700, letterSpacing: "0.1em" }}>
              3D EXPERIENCE BETA
            </div>
          </div>
        </div>

        {/* Centre hint */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                color: "rgba(255,255,255,0.42)", fontSize: 11,
                position: "absolute", left: "50%", transform: "translateX(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              <RotateCcw size={11} />
              Kéo để xoay 360°
              <span style={{ opacity: 0.3 }}>|</span>
              <ZoomIn size={11} />
              Cuộn để zoom
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setLiked((v) => !v)}
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: liked ? "#ef4444" : "rgba(255,255,255,0.6)",
            }}
          >
            <Heart size={15} fill={liked ? "#ef4444" : "none"} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "rgba(255,255,255,0.6)",
              position: "relative",
            }}
          >
            <ShoppingCart size={15} />
            <AnimatePresence>
              {cart > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  style={{
                    position: "absolute", top: -6, right: -6,
                    width: 17, height: 17, borderRadius: "50%",
                    background: "linear-gradient(135deg,#ea580c,#ef4444)",
                    color: "#fff", fontSize: 8.5, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {cart}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </header>
      )}

      {/* ════════════════════════════════════
          HUD BOTTOM CARD
      ════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          zIndex: 30,
          display: "flex", justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "min(460px, 100vw)",
            background: "rgba(6,6,16,0.82)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            borderRadius: "22px 22px 0 0",
            border: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "none",
            padding: "20px 20px 28px",
            boxShadow: `0 -10px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06), 0 -2px 0 ${colour.hex}66`,
            transition: "box-shadow 0.5s ease",
          }}
        >
          {/* Row 1: badge + rating */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <motion.span
              layout
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 999,
                fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
                background: `${colour.hex}20`,
                color: colour.hex,
                border: `1px solid ${colour.hex}40`,
                fontFamily: "Lexend, sans-serif",
                transition: "all 0.35s",
              }}
            >
              <Eye size={10} /> Interactive 3D View
            </motion.span>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={11} fill="#f59e0b" stroke="#f59e0b" />
              ))}
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginLeft: 3 }}>
                4.9 (1,238)
              </span>
            </div>
          </div>

          {/* Row 2: product name */}
          <h1 style={{
            fontFamily: "Lexend, sans-serif", fontWeight: 900,
            fontSize: "clamp(15px,4.5vw,22px)", color: "#fff",
            letterSpacing: "-0.01em", margin: "0 0 3px", lineHeight: 1.2,
          }}>
            Tiger Pro X1 — Flagship Edition
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 11 }}>
            Công nghệ · Tuỳ biến màu &amp; vật liệu realtime
          </p>

          {/* Row 3: price */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 14 }}>
            <span style={{
              fontFamily: "Lexend, sans-serif", fontWeight: 900,
              fontSize: "clamp(18px,5vw,27px)", lineHeight: 1,
              color: colour.hex, transition: "color 0.35s",
            }}>
              {fmt(4_590_000)}
            </span>
            <span style={{ color: "rgba(255,255,255,0.25)", textDecoration: "line-through", fontSize: 12, marginBottom: 2 }}>
              {fmt(6_200_000)}
            </span>
            <span style={{
              padding: "2px 8px", borderRadius: 6,
              background: "#ef4444", color: "#fff",
              fontSize: 9.5, fontWeight: 800, marginBottom: 2,
            }}>
              -26%
            </span>
          </div>

          {/* Row 4: colour swatches */}
          <div style={{ marginBottom: 15 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Palette size={11} style={{ color: "rgba(255,255,255,0.35)" }} />
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                Màu:{" "}
                <span style={{ color: colour.hex, fontWeight: 700, transition: "color 0.3s" }}>
                  {colour.label}
                </span>
              </span>
              <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.2)", fontSize: 10 }}>
                M {Math.round(colour.metalness * 100)}% · R {Math.round(colour.roughness * 100)}%
              </span>
            </div>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              {COLOURS.map((c) => (
                <Swatch key={c.id} opt={c} active={colour.id === c.id} onClick={setColour} />
              ))}
            </div>
          </div>

          {/* Row 5: CTA */}
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px 0", borderRadius: 15,
                fontFamily: "Lexend, sans-serif", fontWeight: 800, fontSize: 13,
                color: "#fff", border: "none", cursor: "pointer",
                background: added
                  ? "linear-gradient(135deg,#10b981,#059669)"
                  : `linear-gradient(135deg,${colour.hex},#7c2d12)`,
                boxShadow: added
                  ? "0 6px 22px rgba(16,185,129,0.45)"
                  : `0 6px 22px ${colour.hex}55`,
                transition: "background 0.35s, box-shadow 0.35s",
              }}
            >
              <ShoppingCart size={16} />
              {added ? "Đã thêm vào giỏ ✓" : "Thêm vào giỏ hàng"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenChat}
              title="Tư vấn Tiger AI"
              style={{
                width: 46, height: 46, borderRadius: 15, flexShrink: 0,
                background: "rgba(124,58,237,0.18)",
                border: "1px solid rgba(124,58,237,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#a78bfa",
              }}
            >
              <Bot size={19} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════
          RIGHT INFO PILLS (desktop)
      ════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{
          position: "absolute", top: "50%", right: 16,
          transform: "translateY(-50%)", zIndex: 30,
          display: "flex", flexDirection: "column", gap: 10,
        }}
        className="hidden lg:flex"
      >
        {[
          { Icon: Package,   text: "Vật liệu cao cấp" },
          { Icon: Zap,       text: "Giao hỏa tốc 2h" },
          { Icon: BadgeCheck,text: "Bảo hành 12 tháng" },
        ].map(({ Icon, text }) => (
          <div
            key={text}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(10px)",
              color: "rgba(255,255,255,0.5)", fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={13} style={{ color: colour.hex, transition: "color 0.3s" }} />
            {text}
          </div>
        ))}
      </motion.div>

      {/* ════════════════════════════════════
          TOAST
      ════════════════════════════════════ */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "absolute", top: 74, left: "50%",
              transform: "translateX(-50%)", zIndex: 50,
              background: "rgba(16,185,129,0.95)",
              backdropFilter: "blur(12px)",
              borderRadius: 12, padding: "10px 18px",
              color: "#fff", fontWeight: 700, fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 8px 30px rgba(16,185,129,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            <BadgeCheck size={16} />
            Đã thêm vào giỏ hàng!
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════
          MOBILE DRAG HINT
      ════════════════════════════════════ */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none", zIndex: 10,
            }}
            className="lg:hidden"
          >
            <div style={{
              padding: "10px 20px", borderRadius: 999,
              background: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)",
              color: "rgba(255,255,255,0.75)", fontSize: 12,
              display: "flex", alignItems: "center", gap: 8,
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <RotateCcw size={13} /> Kéo để xoay 3D
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
