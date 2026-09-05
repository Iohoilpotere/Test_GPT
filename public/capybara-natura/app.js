/* Capybara Club — progressive enhancement. No libraries, tracking or storage. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userReduced = false;
  const motionButton = $('#motion-toggle');
  function syncMotion() {
    const reduced = userReduced || reducedPreference.matches;
    root.classList.toggle('reduce-motion', reduced);
    motionButton.setAttribute('aria-pressed', String(reduced));
    motionButton.textContent = reducedPreference.matches ? 'Animazioni ridotte dal dispositivo' : reduced ? 'Riattiva le animazioni' : 'Riduci le animazioni';
    motionButton.disabled = reducedPreference.matches;
  }
  motionButton.hidden = false;
  motionButton.addEventListener('click', () => { userReduced = !userReduced; syncMotion(); });
  reducedPreference.addEventListener?.('change', syncMotion);
  syncMotion();

  // Mobile menu: proper disclosure semantics and Escape/focus restoration.
  const menu = $('.menu-toggle');
  const nav = $('#primary-nav');
  function closeMenu(returnFocus = false) {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Apri menu');
    nav.classList.remove('is-open');
    if (returnFocus) menu.focus();
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    nav.classList.toggle('is-open', open);
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true);
  });
  window.matchMedia('(min-width: 761px)').addEventListener?.('change', () => closeMenu());

  // Use the original image once if Wikimedia's thumbnail service is unavailable.
  function imageFallback(image) {
    if (image.dataset.fallback) {
      const fallback = image.dataset.fallback;
      delete image.dataset.fallback;
      image.src = fallback;
    } else image.classList.add('image-unavailable');
  }
  $$('img:not(#lightbox-image)').forEach(image => {
    image.addEventListener('error', () => imageFallback(image));
    if (image.complete && image.naturalWidth === 0) imageFallback(image);
  });

  // Reveal once. If IntersectionObserver is unavailable, everything stays visible.
  if ('IntersectionObserver' in window && !reducedPreference.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    $$('.reveal').forEach(element => {
      element.classList.add('reveal-ready');
      observer.observe(element);
    });
  }
  let scrollQueued = false;
  const progress = $('.reading-progress');
  function paintProgress() {
    const available = root.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0})`;
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; window.requestAnimationFrame(paintProgress); }
  }, { passive: true });
  window.addEventListener('resize', paintProgress);
  paintProgress();

  // Gallery filters work without fetching or rebuilding the accessible photo links.
  const photos = $$('.gallery-item');
  const filterBar = $('.gallery-filters');
  filterBar.hidden = false;
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    $$('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    photos.forEach(photo => { photo.hidden = category !== 'all' && !photo.dataset.category.split(' ').includes(category); });
    $('.gallery-grid').classList.toggle('is-filtered', category !== 'all');
    const count = photos.filter(photo => !photo.hidden).length;
    $('#gallery-count').textContent = `${count} fotografie da esplorare`;
    paintProgress();
  }));

  // Native dialog handles focus trapping, Escape, and focus restoration.
  const dialog = $('#lightbox');
  let activePhotos = photos;
  let photoIndex = 0;
  let lastPhoto = null;
  function showPhoto(index) {
    photoIndex = (index + activePhotos.length) % activePhotos.length;
    const photo = activePhotos[photoIndex];
    const preview = $('img', photo);
    const image = $('#lightbox-image');
    image.classList.remove('image-unavailable');
    image.src = preview.currentSrc || preview.src;
    image.alt = preview.alt;
    $('#lightbox-title').textContent = photo.dataset.title;
    $('#lightbox-credit').textContent = photo.dataset.credit;
    $('#lightbox-position').textContent = `${photoIndex + 1} / ${activePhotos.length}`;
    $('#lightbox-source').href = photo.dataset.source;
  }
  if (typeof dialog.showModal === 'function') {
    photos.forEach(photo => photo.addEventListener('click', event => {
      event.preventDefault();
      activePhotos = photos.filter(item => !item.hidden);
      lastPhoto = photo;
      showPhoto(activePhotos.indexOf(photo));
      dialog.showModal();
      document.body.classList.add('modal-open');
      $('#lightbox-close').focus();
    }));
    $('#lightbox-close').addEventListener('click', () => dialog.close());
    $('#lightbox-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
    $('#lightbox-next').addEventListener('click', () => showPhoto(photoIndex + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(photoIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(photoIndex - 1); }
    });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); lastPhoto?.focus({ preventScroll: true }); });
    let touchStart = 0;
    $('#lightbox-image').addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
    $('#lightbox-image').addEventListener('touchend', event => {
      const delta = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(delta) > 55) showPhoto(photoIndex + (delta < 0 ? 1 : -1));
    }, { passive: true });
  }

  // YouTube is contacted only when the user explicitly requests playback.
  const players = new Map();
  function stopVideo(button, restoreFocus = false) {
    const player = players.get(button);
    if (!player) return;
    player.frame.remove();
    player.close.remove();
    button.hidden = false;
    players.delete(button);
    if (restoreFocus) button.focus();
  }
  $$('[data-video-id]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const id = button.dataset.videoId;
      if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
      [...players.keys()].forEach(key => stopVideo(key));
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.title = button.dataset.videoTitle;
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allowFullscreen = true;
      const close = document.createElement('button');
      close.type = 'button'; close.className = 'video-stop';
      close.textContent = 'Chiudi player ✕';
      close.addEventListener('click', () => stopVideo(button, true));
      players.set(button, { frame, close });
      button.parentElement.append(frame, close);
      button.hidden = true;
      close.focus({ preventScroll: true });
    });
  });

  // Open the credits when a source link is followed (also works with native details).
  $$('a[href="#fonti"]').forEach(link => link.addEventListener('click', () => { $('#fonti').open = true; }));
  if (window.location.hash === '#fonti') $('#fonti').open = true;
  const shareButton = $('#share-button');
  shareButton.hidden = false;
  shareButton.addEventListener('click', async () => {
    const url = /^https?:$/.test(location.protocol) ? location.href.split('#')[0] : 'https://iohoilpotere.github.io/Test_GPT/capybara-natura/';
    const status = $('#share-status');
    try {
      if (navigator.share) { await navigator.share({ title: document.title, text: 'Un piccolo invito a rallentare.', url }); status.textContent = 'Grazie per aver condiviso un po’ di natura.'; }
      else if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(url); status.textContent = 'Link copiato. Condividilo con chi ha bisogno di una pausa.'; }
      else status.textContent = `Copia questo indirizzo: ${url}`;
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = `La condivisione non è disponibile. Copia questo indirizzo: ${url}`;
    }
  });
})();
