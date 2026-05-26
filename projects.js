/**
 * projects.js — Dynamic project loader for index.html
 *
 * Responsibilities:
 *  1. Load published projects from Supabase → render in #featured .cards
 *  2. Load the most recent draft project → populate the "Currently Building" badge
 *  3. Fall back gracefully if Supabase is unavailable
 */

import { supabase } from './supabase.js';

// ─── Currently Building Badge ─────────────────────────────────────────────────
const badge       = document.getElementById('building-badge');
const badgeName   = document.getElementById('building-name');

async function loadCurrentBuild() {
  if (!badge || !badgeName) return;

  try {
    // Use the most recent draft as "Currently Building"
    const { data, error } = await supabase
      .from('projects')
      .select('name')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) throw error ?? new Error('none');

    badgeName.textContent = data.name;
    badge.removeAttribute('hidden');
  } catch {
    // No draft found — hide the badge gracefully
    badge.setAttribute('hidden', '');
  }
}

// ─── Featured Projects ────────────────────────────────────────────────────────
const cardsContainer = document.querySelector('#featured .cards');

/** Static fallback cards shown when DB is empty or unreachable. */
const FALLBACK_CARDS = [
  {
    number: '01',
    title:  'Smart Gate System',
    desc:   'An automated gate system that detects vehicles and controls access using sensors and computer vision.',
    tags:   ['Sensors', 'Automation', 'Computer Vision'],
    link:   'index.html#iot-projects',
  },
  {
    number: '02',
    title:  'Smart Lamp System',
    desc:   'A decorative smart desk lamp combining IoT control with a custom 3D-printed enclosure.',
    tags:   ['LED', 'IoT Control', '3D Enclosure'],
    link:   'index.html#design',
  },
  {
    number: '03',
    title:  'Smart Irrigation System',
    desc:   'An automated watering system that monitors soil conditions for efficient, water-saving farming.',
    tags:   ['Sensors', 'Pumps', 'Telemetry'],
    link:   'project-smart-irrigation.html',
    images: [
      {
        srcset: './images/smart-irrigation-side-640.webp 640w, ./images/smart-irrigation-side-1100.webp 1100w',
        src:    './images/smart-irrigation-side.jpg',
        alt:    'Smart Irrigation System (side view)',
      },
      {
        srcset: './images/smart-irrigation-top-640.webp 640w, ./images/smart-irrigation-top-1100.webp 1100w',
        src:    './images/smart-irrigation-top.jpg',
        alt:    'Smart Irrigation System (top view)',
      },
    ],
  },
];

/** Build a DOM card from a Supabase project row (XSS-safe via textContent). */
function buildDynamicCard(project, index) {
  const article = document.createElement('article');
  article.className = 'card reveal';

  const icon = document.createElement('div');
  icon.className = 'card-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = String(index + 1).padStart(2, '0');

  const title = document.createElement('h3');
  title.textContent = project.name;

  const desc = document.createElement('p');
  const descText = project.description ?? '';
  desc.textContent = descText.length > 130 ? descText.substring(0, 130) + '…' : descText;

  const tags = document.createElement('div');
  tags.className = 'tags';
  tags.setAttribute('aria-label', 'Tech stack tags');

  const tagList = Array.isArray(project.tags) ? project.tags : [];
  tagList.forEach((tag) => {
    const span = document.createElement('span');
    span.textContent = tag;
    tags.appendChild(span);
  });

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const link = document.createElement('a');
  link.className   = 'btn ghost';
  link.href        = 'index.html#iot-projects';
  link.textContent = 'View details';
  actions.appendChild(link);

  if (project.image_url) {
    const thumbs = document.createElement('div');
    thumbs.className = 'thumbs';
    const img = document.createElement('img');
    img.className  = 'thumb-img';
    img.src        = project.image_url;
    img.alt        = project.name;
    img.loading    = 'lazy';
    img.decoding   = 'async';
    img.onerror    = () => { img.style.display = 'none'; };
    thumbs.appendChild(img);
    article.append(icon, title, desc, tags, thumbs, actions);
  } else {
    article.append(icon, title, desc, tags, actions);
  }

  return article;
}

/** Build a static fallback card using safe DOM API. */
function buildFallbackCard(data) {
  const article = document.createElement('article');
  article.className = 'card reveal';

  const icon = document.createElement('div');
  icon.className = 'card-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = data.number;

  const title = document.createElement('h3');
  title.textContent = data.title;

  const desc = document.createElement('p');
  desc.textContent = data.desc;

  const tags = document.createElement('div');
  tags.className = 'tags';
  tags.setAttribute('aria-label', 'Tech stack tags');
  data.tags.forEach((t) => {
    const span = document.createElement('span');
    span.textContent = t;
    tags.appendChild(span);
  });

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const link = document.createElement('a');
  link.className   = 'btn ghost';
  link.href        = data.link;
  link.textContent = 'View details';
  actions.appendChild(link);

  if (data.images) {
    const thumbs = document.createElement('div');
    thumbs.className = 'thumbs';

    data.images.forEach((imgData) => {
      const picture = document.createElement('picture');
      const source  = document.createElement('source');
      source.type   = 'image/webp';
      source.srcset = imgData.srcset;
      source.sizes  = '220px';

      const img     = document.createElement('img');
      img.className = 'thumb-img';
      img.src       = imgData.src;
      img.alt       = imgData.alt;
      img.loading   = 'lazy';
      img.decoding  = 'async';

      picture.append(source, img);
      thumbs.appendChild(picture);
    });

    article.append(icon, title, desc, tags, thumbs, actions);
  } else {
    article.append(icon, title, desc, tags, actions);
  }

  return article;
}

/** Wire up IntersectionObserver reveal for newly injected cards. */
function observeReveal(container) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    container.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  if (!('IntersectionObserver' in window)) {
    container.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  container.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

/** Load published projects and render them. */
async function loadPublishedProjects() {
  if (!cardsContainer) return;

  const loading = document.createElement('p');
  loading.style.cssText = 'color: var(--muted); grid-column: 1/-1; text-align: center; padding: 2rem 0;';
  loading.textContent   = 'Loading projects…';
  cardsContainer.replaceChildren(loading);

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, image_url, tags, status')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      const fragment = document.createDocumentFragment();
      data.forEach((project, i) => fragment.appendChild(buildDynamicCard(project, i)));
      cardsContainer.replaceChildren(fragment);
    } else {
      renderFallback();
    }
  } catch {
    renderFallback();
  }

  observeReveal(cardsContainer);
}

function renderFallback() {
  if (!cardsContainer) return;
  const fragment = document.createDocumentFragment();
  FALLBACK_CARDS.forEach((data) => fragment.appendChild(buildFallbackCard(data)));
  cardsContainer.replaceChildren(fragment);
}

// ─── Counter animation for stats bar ─────────────────────────────────────────
function animateCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach((el) => {
      el.textContent = el.dataset.count;
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        const target   = parseInt(entry.target.dataset.count, 10);
        const suffix   = entry.target.dataset.suffix ?? '';
        const duration = 1200;
        const start    = performance.now();

        const tick = (now) => {
          const elapsed  = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          entry.target.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
loadCurrentBuild();
loadPublishedProjects();
animateCounters();
