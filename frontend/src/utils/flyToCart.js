export function flyToCart(imgElement) {
  if (!imgElement) return;

  const cartIcon = document.querySelector(".cart-btn");
  if (!cartIcon) return;

  const imgRect = imgElement.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();

  const clone = imgElement.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.left = imgRect.left + "px";
  clone.style.top = imgRect.top + "px";
  clone.style.width = imgRect.width + "px";
  clone.style.height = imgRect.height + "px";
  clone.style.transition = "all 0.8s ease-in-out";
  clone.style.zIndex = 9999;
  clone.style.pointerEvents = "none";

  document.body.appendChild(clone);

  requestAnimationFrame(() => {
    clone.style.left = cartRect.left + cartRect.width / 2 + "px";
    clone.style.top = cartRect.top + cartRect.height / 2 + "px";
    clone.style.width = "20px";
    clone.style.height = "20px";
    clone.style.opacity = "0.3";
  });

  setTimeout(() => {
    document.body.removeChild(clone);
  }, 900);
}
