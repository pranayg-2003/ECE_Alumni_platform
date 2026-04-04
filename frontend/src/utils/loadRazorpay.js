/** Load Razorpay Checkout script once (browser only). */
export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay is only available in the browser."));
      return;
    }
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector("script[data-mentorbridge-razorpay]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.dataset.mentorbridgeRazorpay = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay."));
    document.body.appendChild(s);
  });
}
