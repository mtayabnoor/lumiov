// ═══════════════════════════════════════════════════════
// Lumiov Landing Page — Script
// ═══════════════════════════════════════════════════════

// ── Scroll-triggered reveal animations ─────────────────
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
);

document
  .querySelectorAll(".feature-card, .tech-card, .ai-card")
  .forEach((el) => {
    observer.observe(el);
  });

// ── Mobile nav toggle ──────────────────────────────────
const mobileToggle = document.getElementById("mobileToggle");
const navLinks = document.querySelector(".nav__links");
const navActions = document.querySelector(".nav__actions");

if (mobileToggle) {
  mobileToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    navActions.classList.toggle("active");
  });

  // Close mobile menu when a link is clicked
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      navActions.classList.remove("active");
    });
  });
}

// ── Nav background on scroll ───────────────────────────
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    nav.style.background = "rgba(13, 13, 15, 0.92)";
  } else {
    nav.style.background = "rgba(13, 13, 15, 0.75)";
  }
});

// ── Smooth anchor scrolling ────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});
