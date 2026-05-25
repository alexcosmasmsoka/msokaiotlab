/**
 * projects.js — Dynamically loads published projects from Supabase
 * and renders them in the #featured section of index.html.
 *
 * Falls back to the static hardcoded cards if Supabase is unavailable
 * or returns no published projects.
 */

import { supabase } from './supabase.js';

const cardsContainer = document.querySelector('#featured .cards');
if (!cardsContainer) throw new Error('Could not find #featured .cards container');

/** Static fallback cards (shown when DB is empty or unreachable). */
const FALLBACK_CARDS = [
  {
    number: '01',
    title:  'Smart Gate System',
    desc:   'An automated gate system that detects vehicles and controls access using sensors and computer vision.',
    tags:   ['Sensors', 'Automation', 'Computer Vision'],
    link:   '#iot-projects',
  },
  {
    number: '02',
    title:  'Smart Lamp System',
    desc:   'A decorative smart desk lamp combining IoT control with a custom 3D-printed enclosure.',
    tags:   ['LED', 'IoT Control', '3D Enclosure'],
    link:   '#design',
  },
  {
    number: '03',
    title:  'Smart Irrigation System',
    desc:   'An automated watering system that monitors soil conditions for efficient, water-saving farming.',
    tags:   ['Sensors', 'Pumps', 'Telemetry'],
    link:   '#iot-projects',
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

/** Build a DOM card from a Supabase project row. */
function buildDynamicCard(project, index) {
  const article = document.createElement('article');
  article.className = 'card reveal';

  const icon = document.createElement('div');
  icon.className       = 'card-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent     = String(index + 1).padStart(2, '0');

  const title = document.createElement('h3');
  title.textContent = project.name;        // textContent — no XSS

  const desc = document.createElement('p');
  desc.textContent = project.description;  // textContent — no XSS

  const tags = document.createElement('div');
  tags.className = 'tags';
  tags.setAttribute('aria-label', 'Tech stack tags');

  (project.tags ?? []).forEach((tag) => {
    const span = document.createElement('span');
    span.textContent = tag;
    tags.appendChild(span);
  });

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  if (project.image_url) {
    const thumb = document.createElement('div');
    thumb.className = 'thumbs';
    const img = document.createElement('img');
    img.className = 'thumb-img';
    img.src     = project.image_url;
    img.alt     = project.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    thumb.appendChild(img);
    article.append(icon, title, desc, tags, thumb, actions);
  } else {
    article.append(icon, title, desc, tags, actions);
  }

  const link = document.createElement('a');
  link.className = 'btn ghost';
  link.href      = '#iot-projects';
  link.textContent = 'View details';
  actions.appendChild(link);

  return article;
}

/** Build a fallback static card. */
function buildFallbackCard(data) {
  const article = document.createElement('article');
  article.className = 'card reveal';

  const icon = document.createElement('div');
  icon.className       = 'card-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent     = data.number;

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

  // Optional thumbnail images
  if (data.images) {
    const thumbs = document.createElement('div');
    thumbs.className = 'thumbs';

    data.images.forEach((imgData) => {
      const picture = document.createElement('picture');
      const source  = document.createElement('source');
      source.type   = 'image/webp';
      source.srcset = imgData.srcset;
      source.sizes  = '220px';

      const img = document.createElement('img');
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

/** Trigger reveal animation for newly added cards. */
function observeReveal(container) {
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
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );
  container.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

/** Main loader — runs on page load. */
async function loadPublishedProjects() {
  // Show loading state
  const loading = document.createElement('p');
  loading.style.cssText = 'color: var(--muted); grid-column: 1/-1; text-align: center; padding: 2rem;';
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
      // No published projects in DB — show static fallback cards
      renderFallback();
    }
  } catch {
    // Network / Supabase error — show static fallback silently
    renderFallback();
  }

  observeReveal(cardsContainer);
}

function renderFallback() {
  const fragment = document.createDocumentFragment();
  FALLBACK_CARDS.forEach((data) => fragment.appendChild(buildFallbackCard(data)));
  cardsContainer.replaceChildren(fragment);
}

loadPublishedProjects();
