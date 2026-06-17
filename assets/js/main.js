/* ==========================================================================
   FF SCD — Interações e animações
   GSAP + ScrollTrigger + Lenis (smooth scroll)
   ========================================================================== */

document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !prefersReduced) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- GSAP setup ---------- */
  const hasGSAP = !!window.gsap;
  if (hasGSAP && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------- Header scroll state + progress + back-to-top ---------- */
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  const toTop = document.querySelector(".to-top");

  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle("scrolled", y > 30);
    if (toTop) toTop.classList.toggle("show", y > 500);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", () => {
      if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Mobile menu ---------- */
  const burger = document.querySelector(".burger");
  const mobileMenu = document.querySelector(".mobile-menu");
  const closeMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.add("hidden-menu");
    burger?.classList.remove("open");
    document.body.style.overflow = "";
  };
  if (burger && mobileMenu) {
    burger.addEventListener("click", () => {
      const isHidden = mobileMenu.classList.contains("hidden-menu");
      mobileMenu.classList.toggle("hidden-menu", !isHidden);
      burger.classList.toggle("open", isHidden);
      document.body.style.overflow = isHidden ? "hidden" : "";
    });
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  }

  /* ---------- Anchor smooth scroll (Lenis-aware) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -80 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Accordion ---------- */
  document.querySelectorAll(".acc-item").forEach((item) => {
    const trigger = item.querySelector(".acc-trigger");
    trigger?.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      item.closest("[data-accordion]")?.querySelectorAll(".acc-item.open")
        .forEach((o) => { if (o !== item) o.classList.remove("open"); });
      item.classList.toggle("open", !isOpen);
    });
  });

  /* ========================================================================
     Animações GSAP
     ====================================================================== */
  if (!hasGSAP) return;

  gsap.defaults({ ease: "power3.out", duration: 0.9 });

  const mm = gsap.matchMedia();

  mm.add(
    { reduce: "(prefers-reduced-motion: reduce)", normal: "(prefers-reduced-motion: no-preference)" },
    (ctx) => {
      const { reduce } = ctx.conditions;

      /* Hero entrance timeline */
      const heroTl = gsap.timeline({ defaults: { duration: reduce ? 0 : 1, ease: "power4.out" } });
      heroTl
        .from("[data-hero='badge']", { y: 20, autoAlpha: 0 })
        .from("[data-hero='title'] .line", { yPercent: 110, autoAlpha: 0, stagger: 0.12, duration: reduce ? 0 : 1.1 }, "-=0.4")
        .from("[data-hero='text']", { y: 24, autoAlpha: 0 }, "-=0.7")
        .from("[data-hero='cta'] > *", { y: 20, autoAlpha: 0, stagger: 0.12 }, "-=0.6")
        .from("[data-hero='stat']", { y: 24, autoAlpha: 0, stagger: 0.12 }, "-=0.6")
        .from("[data-hero='visual']", { y: 40, autoAlpha: 0, scale: 0.96, duration: reduce ? 0 : 1.2 }, "-=1");

      /* Reveal on scroll (batch) */
      if (reduce) {
        gsap.set("[data-reveal]", { autoAlpha: 1, x: 0, y: 0, scale: 1 });
      } else {
        ScrollTrigger.batch("[data-reveal]", {
          start: "top 88%",
          onEnter: (els) => gsap.to(els, {
            autoAlpha: 1, x: 0, y: 0, scale: 1,
            duration: 1, ease: "power3.out",
            stagger: { each: 0.1, from: "start" },
            overwrite: true,
          }),
        });
      }

      /* Parallax elements */
      if (!reduce) {
        gsap.utils.toArray("[data-parallax]").forEach((el) => {
          const speed = parseFloat(el.dataset.parallax) || 0.2;
          gsap.to(el, {
            yPercent: speed * 100,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          });
        });

        /* Floating blobs subtle drift on scroll */
        gsap.utils.toArray("[data-drift]").forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 === 0 ? -80 : 80,
            ease: "none",
            scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: 1 },
          });
        });
      }

      return () => {};
    }
  );

  /* ---------- Counters ---------- */
  gsap.utils.toArray("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          val: end, duration: 2, ease: "power2.out",
          onUpdate: () => {
            el.textContent = prefix + obj.val.toLocaleString("pt-BR", {
              minimumFractionDigits: decimals, maximumFractionDigits: decimals,
            }) + suffix;
          },
        });
      },
    });
  });

  /* ---------- Magnetic buttons ---------- */
  if (!prefersReduced && window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.4 });
      });
      btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" }));
    });

    /* ---------- Tilt cards ---------- */
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 12;
        gsap.to(card, { rotationX: rx, rotationY: ry, transformPerspective: 900, duration: 0.4, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.6, ease: "power2.out" }));
    });
  }

  /* Refresh after fonts/images load */
  window.addEventListener("load", () => ScrollTrigger.refresh());
});
