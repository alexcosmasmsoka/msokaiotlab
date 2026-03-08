const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const backToTop = document.querySelector("[data-back-to-top]");
const root = document.documentElement;

const cursor = document.querySelector("[data-cursor]");
const scrollProgress = document.querySelector("[data-scroll-progress]");

// HUD Cursor Logic
if (cursor && !prefersReducedMotion.matches) {
  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const animateCursor = () => {
    // Add a slight lag for a "trailing" tech effect
    const easing = 0.15;
    cursorX += (mouseX - cursorX) * easing;
    cursorY += (mouseY - cursorY) * easing;

    cursor.style.transform = `translate3d(${cursorX - 22}px, ${cursorY - 22}px, 0)`;
    requestAnimationFrame(animateCursor);
  };
  requestAnimationFrame(animateCursor);

  const hoverable = document.querySelectorAll("a, button, .card, .content-card, .btn, summary");
  hoverable.forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hovering"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hovering"));
  });
}

// Scroll Logic
const updateScrollEffects = () => {
  const scrollY = window.scrollY || 0;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = (scrollY / height) * 100;

  if (scrollProgress) {
    scrollProgress.style.width = `${scrolled}%`;
  }

  root.style.setProperty("--scroll-px", `${scrollY}px`);
  scrollTicking = false;
};

const setExpanded = (expanded) => {
  if (!navToggle || !navMenu) return;
  navToggle.setAttribute("aria-expanded", String(expanded));
  navToggle.setAttribute("aria-label", expanded ? "Close menu" : "Open menu");
  navMenu.classList.toggle("is-open", expanded);
};

const closeMenu = () => setExpanded(false);
const openMenu = () => setExpanded(true);
const toggleMenu = () => {
  const expanded = navToggle?.getAttribute("aria-expanded") === "true";
  setExpanded(!expanded);
};

navToggle?.addEventListener("click", toggleMenu);

navMenu?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.matches("a")) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (!navMenu || !navToggle) return;

  const menuOpen = navMenu.classList.contains("is-open");
  if (!menuOpen) return;

  const clickedInsideMenu = navMenu.contains(target);
  const clickedToggle = navToggle.contains(target);
  if (!clickedInsideMenu && !clickedToggle) closeMenu();
});

const yearEl = document.querySelector("[data-year]");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

let scrollTicking = false;

const onScroll = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
  backToTop?.classList.toggle("is-visible", window.scrollY > 680);

  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateScrollEffects);
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

if (!prefersReducedMotion.matches) {
  updateScrollEffects();
}

const setActiveNav = (id) => {
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    const isActive = href === `#${id}`;
    link.classList.toggle("is-active", isActive);
  });
};

const sections = Array.from(
  document.querySelectorAll("main section[id]")
).filter((el) => el instanceof HTMLElement);

if (sections.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
      const id = visible?.target?.id;
      if (id) setActiveNav(id);
    },
    {
      root: null,
      threshold: [0.35, 0.5, 0.65],
    }
  );

  sections.forEach((section) => observer.observe(section));
}

// Force local videos to play
document.addEventListener("DOMContentLoaded", () => {
  const videos = document.querySelectorAll("video.section-video");
  console.log(`Found ${videos.length} videos to autoplay`);
  videos.forEach((video) => {
    if (video instanceof HTMLVideoElement) {
      console.log(`Checking video: ${video.querySelector("source")?.src}`);
      video.muted = true;
      video.loop = true;
      video.setAttribute("autoplay", "");
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.playsInline = true;
      video.preload = "auto";
      const sourceEl = video.querySelector("source");
      if (sourceEl) {
        video.load();
      }

      // Check for loading errors
      video.addEventListener("error", (e) => {
        console.error(`Video error for ${video.querySelector("source")?.src}:`, video.error);
      });

      const tryPlay = () => {
        const p = video.play();
        if (p && typeof p.then === "function") {
          p.then(() => {
            console.log(`Playing video: ${video.currentSrc}`);
          }).catch((err) => {
            console.warn(`Autoplay failed for ${video.currentSrc}:`, err);
          });
        }
      };

      const userRetry = () => {
        tryPlay();
        window.removeEventListener("click", userRetry);
        window.removeEventListener("touchstart", userRetry);
        window.removeEventListener("keydown", userRetry);
      };

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              tryPlay();
            }
          });
        },
        { threshold: 0.15 }
      );
      io.observe(video);

      tryPlay();
      window.addEventListener("click", userRetry);
      window.addEventListener("touchstart", userRetry, { passive: true });
      window.addEventListener("keydown", userRetry);
    }
  });
});

const revealEls = Array.from(document.querySelectorAll(".reveal")).filter(
  (el) => el instanceof HTMLElement
);

const revealNow = (el) => el.classList.add("is-visible");

if (!prefersReducedMotion.matches && revealEls.length && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealNow(entry.target);
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach(revealNow);
}

const form = document.querySelector(".contact-form");
const formNote = document.querySelector("[data-form-note]");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!(form instanceof HTMLFormElement)) return;

  const formData = new FormData(form);
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const recipient = "alexcosmasmsoka@gmail.com";
  const subject = `Website message from ${name || "Visitor"}`;
  const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;

  const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  try {
    window.location.href = mailto;
    if (formNote) formNote.textContent = "Opening your email app… If it doesn't open, copy your message and email me.";
    form.reset();
  } catch {
    if (formNote) formNote.textContent = "Couldn't open email app. Please email alexcosmasmsoka@gmail.com.";
  }
});
