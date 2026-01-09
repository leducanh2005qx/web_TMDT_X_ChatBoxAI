export function flyToCart(imgEl) {
  const cartIcon = document.getElementById("cart-icon");
  if (!imgEl || !cartIcon) return;

  const imgRect = imgEl.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();

  const flyingImg = imgEl.cloneNode(true);
  flyingImg.className = "fly-image";

  flyingImg.style.position = "fixed";
  flyingImg.style.left = imgRect.left + "px";
  flyingImg.style.top = imgRect.top + "px";
  flyingImg.style.width = imgRect.width + "px";
  flyingImg.style.height = imgRect.height + "px";
  flyingImg.style.zIndex = 9999;
  flyingImg.style.transition = "all 0.8s cubic-bezier(0.65, 0, 0.35, 1)";
  flyingImg.style.pointerEvents = "none";
  flyingImg.style.borderRadius = "12px";

  document.body.appendChild(flyingImg);

  requestAnimationFrame(() => {
    flyingImg.style.left = cartRect.left + "px";
    flyingImg.style.top = cartRect.top + "px";
    flyingImg.style.width = "20px";
    flyingImg.style.height = "20px";
    flyingImg.style.opacity = "0.5";
  });

  setTimeout(() => {
    if (flyingImg.parentNode) flyingImg.parentNode.removeChild(flyingImg);
  }, 800);
}
