(() => {
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const demoHref = "https://easyhostel.onrender.com";
  document.querySelectorAll("#live-demo-link, #nav-demo, #hero-demo").forEach((el) => {
    el.setAttribute("href", demoHref);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  });

  const header = document.querySelector("[data-header]");
  const darkSections = [...document.querySelectorAll(".zone-dark")];

  const syncHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    const y = window.scrollY + 64;
    const onDark = darkSections.some((s) => {
      const top = s.offsetTop;
      return y >= top && y < top + s.offsetHeight;
    });
    header.classList.toggle("on-dark", onDark);
  };
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  const toggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = mobileNav.hasAttribute("hidden");
      if (open) mobileNav.removeAttribute("hidden");
      else mobileNav.setAttribute("hidden", "");
      toggle.setAttribute("aria-expanded", String(open));
    });
    mobileNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        mobileNav.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const chips = document.querySelectorAll("[data-filter]");
  const shots = document.querySelectorAll(".shot");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const mode = chip.getAttribute("data-filter");
      shots.forEach((shot) => {
        const show = mode === "all" || shot.getAttribute("data-mode") === mode;
        shot.toggleAttribute("hidden", !show);
      });
    });
  });

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImg = document.querySelector("[data-lightbox-img]");
  const closeBtn = document.querySelector("[data-lightbox-close]");

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.setAttribute("hidden", "");
    document.body.style.overflow = "";
  };

  const openLightbox = (src, alt) => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "Screenshot";
    lightbox.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  };

  shots.forEach((shot) => {
    shot.addEventListener("click", () => {
      openLightbox(shot.getAttribute("data-full"), shot.querySelector("img")?.alt);
    });
  });
  closeBtn?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || typeof gsap === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const heroBits = gsap.utils.toArray("[data-hero]");
  gsap.from(heroBits, {
    y: 36,
    opacity: 0,
    duration: 0.9,
    stagger: 0.12,
    ease: "power3.out",
  });

  gsap.from("[data-hero-stage]", {
    y: 56,
    opacity: 0,
    duration: 1.15,
    delay: 0.25,
    ease: "power3.out",
  });

  gsap.to(".hero-float-a", {
    y: -18,
    duration: 3.2,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
  gsap.to(".hero-float-b", {
    y: 16,
    duration: 3.8,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
    delay: 0.4,
  });

  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none",
      },
      y: 40,
      opacity: 0,
      duration: 0.85,
      ease: "power2.out",
    });
  });

  const stage = document.querySelector("[data-hero-stage]");
  if (stage) {
    gsap.to(stage, {
      y: -40,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }
})();
