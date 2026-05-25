import { supabase } from './supabase.js';

// ─── Preferences ────────────────────────────────────────────────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ─── DOM refs ───────────────────────────────────────────────────────────────
const header      = document.querySelector('[data-header]');
const navToggle   = document.querySelector('[data-nav-toggle]');
const navMenu     = document.querySelector('[data-nav-menu]');
const navLinks    = Array.from(document.querySelectorAll('.nav-link'));
const backToTop   = document.querySelector('[data-back-to-top]');
const root        = document.documentElement;
const cursor      = document.querySelector('[data-cursor]');
const scrollProgress = document.querySelector('[data-scroll-progress]');

// ─── Scroll state (declared first to avoid TDZ issues) ──────────────────────
let scrollTicking = false;

// ─── HUD Cursor ─────────────────────────────────────────────────────────────
if (cursor && !prefersReducedMotion.matches) {
  let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const animateCursor = () => {
    const easing = 0.15;
    cursorX += (mouseX - cursorX) * easing;
    cursorY += (mouseY - cursorY) * easing;
    cursor.style.transform = `translate3d(${cursorX - 22}px, ${cursorY - 22}px, 0)`;
    requestAnimationFrame(animateCursor);
  };
  requestAnimationFrame(animateCursor);

  const hoverable = document.querySelectorAll('a, button, .card, .content-card, .btn, summary');
  hoverable.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
  });
}

// ─── Scroll effects ──────────────────────────────────────────────────────────
const updateScrollEffects = () => {
  const scrollY = window.scrollY || 0;
  const height  = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = height > 0 ? (scrollY / height) * 100 : 0;

  if (scrollProgress) scrollProgress.style.width = `${scrolled}%`;
  root.style.setProperty('--scroll-px', `${scrollY}px`);
  scrollTicking = false;
};

const onScroll = () => {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 8);
  backToTop?.classList.toggle('is-visible', window.scrollY > 680);

  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateScrollEffects);
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

if (!prefersReducedMotion.matches) updateScrollEffects();

// ─── Nav menu ────────────────────────────────────────────────────────────────
const setExpanded = (expanded) => {
  if (!navToggle || !navMenu) return;
  navToggle.setAttribute('aria-expanded', String(expanded));
  navToggle.setAttribute('aria-label', expanded ? 'Close menu' : 'Open menu');
  navMenu.classList.toggle('is-open', expanded);
};

const closeMenu = () => setExpanded(false);
const toggleMenu = () => setExpanded(navToggle?.getAttribute('aria-expanded') !== 'true');

navToggle?.addEventListener('click', toggleMenu);

navMenu?.addEventListener('click', (event) => {
  if (event.target instanceof HTMLElement && event.target.matches('a')) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Node) || !navMenu || !navToggle) return;
  if (!navMenu.classList.contains('is-open')) return;
  if (!navMenu.contains(target) && !navToggle.contains(target)) closeMenu();
});

// ─── Year stamp ──────────────────────────────────────────────────────────────
const yearEl = document.querySelector('[data-year]');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// ─── Active nav via IntersectionObserver ─────────────────────────────────────
const setActiveNav = (id) => {
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    link.classList.toggle('is-active', href === `#${id}`);
  });
};

const sections = Array.from(document.querySelectorAll('main section[id]'))
  .filter((el) => el instanceof HTMLElement);

if (sections.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
      const id = visible?.target?.id;
      if (id) setActiveNav(id);
    },
    { root: null, threshold: [0.35, 0.5, 0.65] }
  );
  sections.forEach((section) => observer.observe(section));
}

// ─── Background videos — viewport-driven autoplay ────────────────────────────
// Use IntersectionObserver as the PRIMARY trigger; only play when visible.
// A one-time user-gesture listener re-enables blocked autoplay on mobile.
document.addEventListener('DOMContentLoaded', () => {
  const videos = document.querySelectorAll('video.section-video');

  // One-time gesture listener shared across all videos
  let userGestureListened = false;
  const onUserGesture = () => {
    videos.forEach((video) => {
      if (video instanceof HTMLVideoElement && video.paused) video.play().catch(() => {});
    });
    window.removeEventListener('click',      onUserGesture);
    window.removeEventListener('touchstart', onUserGesture);
    window.removeEventListener('keydown',    onUserGesture);
    userGestureListened = false;
  };

  videos.forEach((video) => {
    if (!(video instanceof HTMLVideoElement)) return;

    video.muted    = true;
    video.loop     = true;
    video.playsInline = true;
    video.preload  = 'metadata';           // only metadata until visible

    const tryPlay = () => {
      video.play().catch(() => {
        // Autoplay was blocked — register gesture listener once
        if (!userGestureListened) {
          userGestureListened = true;
          window.addEventListener('click',      onUserGesture);
          window.addEventListener('touchstart', onUserGesture, { passive: true });
          window.addEventListener('keydown',    onUserGesture);
        }
      });
    };

    // Only start playing when the video enters the viewport
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.preload = 'auto';
            tryPlay();
          } else {
            // Optionally pause off-screen videos to save resources
            if (!video.paused) video.pause();
          }
        });
      },
      { threshold: 0.1 }
    );
    io.observe(video);
  });
});

// ─── Reveal animations ───────────────────────────────────────────────────────
const revealEls = Array.from(document.querySelectorAll('.reveal'))
  .filter((el) => el instanceof HTMLElement);

const revealNow = (el) => el.classList.add('is-visible');

if (!prefersReducedMotion.matches && revealEls.length && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealNow(entry.target);
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach(revealNow);
}

// ─── Contact form — save to Supabase, fall back to mailto ────────────────────
const form     = document.querySelector('.contact-form');
const formNote = document.querySelector('[data-form-note]');

if (form instanceof HTMLFormElement) {
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name    = String(formData.get('name')    ?? '').trim();
    const email   = String(formData.get('email')   ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();

    if (!name || !email || !message) return;

    // Loading state
    if (submitBtn) {
      submitBtn.disabled  = true;
      submitBtn.textContent = 'Sending…';
    }
    if (formNote) formNote.textContent = '';

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ name, email, message }]);

      if (error) throw error;

      // Success
      form.reset();
      if (formNote) {
        formNote.textContent = '✓ Message received! I\'ll get back to you soon.';
        formNote.style.color = 'var(--neon-c)';
      }
    } catch {
      // Supabase failed — fall back to mailto
      const recipient = 'alexcosmasmsoka@gmail.com';
      const subject   = `Website message from ${name || 'Visitor'}`;
      const body      = `Name: ${name}\nEmail: ${email}\n\n${message}`;
      const mailto    = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      try {
        window.location.href = mailto;
        if (formNote) {
          formNote.textContent = 'Opening your email app… If it doesn\'t open, email alexcosmasmsoka@gmail.com directly.';
          formNote.style.color = '';
        }
        form.reset();
      } catch {
        if (formNote) {
          formNote.textContent = 'Couldn\'t send — please email alexcosmasmsoka@gmail.com.';
          formNote.style.color = '#f87171';
        }
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled   = false;
        submitBtn.textContent = 'Send Message';
      }
    }
  });
}
