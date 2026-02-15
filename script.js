/* ═══════════════════════════════════════════════
   LUMIOV — Website Script
   ═══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  // ─── Mobile Nav Toggle ───
  const toggle = document.getElementById("mobileToggle");
  const navLinks = document.getElementById("navLinks");

  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      navLinks.classList.toggle("nav__links--open");
      toggle.classList.toggle("active");
    });

    // Close mobile nav on link click
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("nav__links--open");
        toggle.classList.remove("active");
      });
    });
  }

  // ─── Download Platform Tabs ───
  const platforms = document.querySelectorAll(".download-platform");
  const downloadInfos = document.querySelectorAll(".download-info");

  platforms.forEach((platform) => {
    platform.addEventListener("click", () => {
      const target = platform.dataset.platform;

      // Update active platform tab
      platforms.forEach((p) => p.classList.remove("download-platform--active"));
      platform.classList.add("download-platform--active");

      // Show matching content
      downloadInfos.forEach((info) => {
        info.classList.remove("download-info--active");
        if (info.id === `download-${target}`) {
          info.classList.add("download-info--active");
        }
      });
    });
  });

  // ─── Scroll-based Fade-in Animations ───
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Apply fade-up to sections
  const animatable = document.querySelectorAll(
    ".feature-row__content, .ai-section__inner, .tech-card, .demo-section__player, .download-section__card",
  );

  animatable.forEach((el) => {
    el.classList.add("fade-up");
    observer.observe(el);
  });

  // ─── Smooth Scroll for Nav Links ───
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector(".nav").offsetHeight;
        const top = target.offsetTop - navHeight - 16;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  });

  // ─── Nav background on scroll ───
  const nav = document.getElementById("nav");
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 10) {
        nav.style.borderBottomColor = "rgba(48, 54, 61, 0.6)";
      } else {
        nav.style.borderBottomColor = "rgba(48, 54, 61, 0.3)";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
});
