'use strict';
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = $('#motion-toggle');
  let preference = false;
  try { preference = localStorage.getItem('capybara-motion-paused') === 'true'; } catch (_) { /* Storage can be disabled. */ }
  const applyMotion = () => {
    const paused = preference || reduced.matches;
    root.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    const label = reduced.matches ? 'Movimento ridotto attivo nelle impostazioni del dispositivo' : paused ? 'Riattiva le animazioni' : 'Metti in pausa le animazioni';
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
    motionButton.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
  };
  applyMotion();
  motionButton.addEventListener('click', () => { preference = !preference; try { localStorage.setItem('capybara-motion-paused', String(preference)); } catch (_) {} applyMotion(); });
  reduced.addEventListener('change', applyMotion);

  const menuButton = $('#menu-toggle');
  const menu = $('#navlinks');
  const setMenu = (open) => { menu.classList.toggle('is-open', open); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu'); };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', e => { if (!menu.contains(e.target) && !menuButton.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); } });
  window.matchMedia('(min-width:761px)').addEventListener('change', () => setMenu(false));
  const updateHeader = () => $('#header').classList.toggle('scrolled', window.scrollY > 16);
  window.addEventListener('scroll', updateHeader, { passive: true }); updateHeader();

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); reveal.unobserve(entry.target); } }), { threshold: .08 });
    $$('.reveal').forEach(el => { el.classList.add('will-reveal'); reveal.observe(el); });
    const counter = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      counter.unobserve(entry.target);
      const target = Number(entry.target.dataset.count);
      if (root.classList.contains('motion-paused')) return;
      const start = performance.now();
      const tick = now => { const t = Math.min((now - start) / 1000, 1); entry.target.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3)))); if (t < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }), { threshold: .6 });
    $$('[data-count]').forEach(el => counter.observe(el));
  }

  const cards = $$('.gallery-card');
  let shownCards = cards;
  let galleryIndex = 0;
  const lightbox = $('#lightbox');
  const openDialog = dialog => { if (!dialog.open) dialog.showModal(); document.body.classList.add('dialog-open'); };
  const closeDialog = dialog => { dialog.close(); if (!$('dialog[open]')) document.body.classList.remove('dialog-open'); };
  $$('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(document.getElementById(button.dataset.close))));
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => { if (!$('dialog[open]')) document.body.classList.remove('dialog-open'); });
    dialog.addEventListener('click', event => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog); });
  });
  const showPhoto = index => {
    galleryIndex = (index + shownCards.length) % shownCards.length;
    const card = shownCards[galleryIndex];
    const img = $('img', card);
    $('#lightbox-image').src = img.src;
    $('#lightbox-image').alt = img.alt;
    $('#lightbox-caption').textContent = `${galleryIndex + 1} / ${shownCards.length} — ${$('strong', card).textContent}`;
    $('#lightbox-credit').textContent = `Foto: ${card.dataset.credit} ↗`;
    $('#lightbox-credit').href = card.dataset.creditUrl;
    $('#lightbox-prev').hidden = $('#lightbox-next').hidden = shownCards.length < 2;
  };
  cards.forEach(card => card.addEventListener('click', () => { showPhoto(shownCards.indexOf(card)); openDialog(lightbox); }));
  $('#lightbox-prev').addEventListener('click', () => showPhoto(galleryIndex - 1));
  $('#lightbox-next').addEventListener('click', () => showPhoto(galleryIndex + 1));
  lightbox.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); showPhoto(galleryIndex + (e.key === 'ArrowRight' ? 1 : -1)); } });
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    $$('.filter').forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    cards.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; });
    shownCards = cards.filter(card => !card.hidden);
    $('#gallery-status').textContent = `${shownCards.length} ${shownCards.length === 1 ? 'fotografia' : 'fotografie'}`;
  }));

  const video = $('#capy-video');
  const playButton = $('#video-play');
  playButton.addEventListener('click', async () => {
    playButton.hidden = true;
    video.parentElement.classList.add('playing');
    $('#video-error').hidden = true;
    try { await video.play(); video.focus(); } catch (_) { $('#video-error').hidden = false; }
  });
  video.addEventListener('play', () => { playButton.hidden = true; video.parentElement.classList.add('playing'); });
  const videoError = () => { $('#video-error').hidden = false; playButton.hidden = true; };
  video.addEventListener('error', videoError);
  $('source', video).addEventListener('error', videoError);

  const questions = [
    { question: 'A quale famiglia di talenti appartiene il capybara?', options: ['È un roditore', 'È un piccolo ippopotamo', 'È un marsupiale'], answer: 0, explanation: 'È il roditore più grande del mondo, parente dei porcellini d’India.' },
    { question: 'Quanto può restare sott’acqua senza riemergere?', options: ['Circa 20 secondi', 'Fino a 5 minuti', 'Più di un’ora'], answer: 1, explanation: 'Può restare immerso fino a cinque minuti: l’acqua è anche un rifugio dai predatori.' },
    { question: 'Cosa ordina un capybara al ristorante?', options: ['Pesce e crostacei', 'Insetti del giorno', 'Erbe e piante acquatiche'], answer: 2, explanation: 'È erbivoro: erbe e piante acquatiche sono al centro della sua alimentazione.' }
  ];
  let questionIndex = 0, score = 0, answered = false, finished = false;
  const questionTitle = $('#quiz-question'), options = $('#quiz-options'), next = $('#quiz-next'), feedback = $('#quiz-feedback');
  const renderQuestion = () => {
    answered = false; finished = false;
    const q = questions[questionIndex];
    $('#quiz-progress').textContent = `DOMANDA ${questionIndex + 1} DI ${questions.length}`;
    $('#quiz-bar').style.width = `${(questionIndex + 1) / questions.length * 100}%`;
    questionTitle.textContent = q.question; options.replaceChildren();
    q.options.forEach((text, i) => { const button = document.createElement('button'); button.type = 'button'; button.dataset.answer = String(i); const letter = document.createElement('span'); letter.textContent = String.fromCharCode(65 + i); button.append(letter, document.createTextNode(text)); options.append(button); });
    feedback.textContent = ''; next.hidden = true;
  };
  options.addEventListener('click', e => {
    const button = e.target.closest('button[data-answer]');
    if (!button || answered || finished) return;
    answered = true;
    const q = questions[questionIndex], choice = Number(button.dataset.answer), correct = choice === q.answer;
    if (correct) score++;
    $$('button', options).forEach((b, i) => { b.disabled = true; if (i === q.answer) b.classList.add('correct'); if (i === choice && !correct) b.classList.add('incorrect'); });
    feedback.textContent = `${correct ? 'Esatto! ' : 'Quasi! '}${q.explanation}`;
    next.textContent = questionIndex === questions.length - 1 ? 'Scopri il risultato →' : 'Prossima domanda →'; next.hidden = false;
  });
  next.addEventListener('click', () => {
    if (finished) { questionIndex = 0; score = 0; renderQuestion(); questionTitle.focus(); return; }
    questionIndex++;
    if (questionIndex < questions.length) { renderQuestion(); questionTitle.focus(); return; }
    finished = true; $('#quiz-progress').textContent = 'PICCOLA MISSIONE COMPIUTA';
    questionTitle.textContent = score === 3 ? 'Sei ufficialmente capy-esperto.' : score === 2 ? 'Lo spirito capy è già con te.' : 'Ogni esperto parte da un piccolo passo.';
    options.replaceChildren(); feedback.textContent = `${score} risposte corrette su 3. ${score === 3 ? 'Perfetto! Ora ti sei meritato una pausa.' : 'La curiosità vale più del punteggio. Riproviamo, senza fretta?'}`;
    next.textContent = 'Gioca di nuovo ↻'; questionTitle.focus();
  });

  const pauseDialog = $('#pause-dialog');
  let timer = null;
  const stopPause = () => { if (timer !== null) clearInterval(timer); timer = null; };
  $('#pause-open').addEventListener('click', () => {
    stopPause(); const deadline = Date.now() + 30000;
    $('#pause-dialog-title').textContent = 'Solo un respiro.'; $('#breathing-label').textContent = 'Rallenta.';
    $('#pause-seconds').textContent = '30'; openDialog(pauseDialog);
    timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      $('#pause-seconds').textContent = String(remaining);
      if (remaining === 20) $('#breathing-label').textContent = 'Nessuna fretta.';
      if (remaining === 10) $('#breathing-label').textContent = 'Solo questo istante.';
      if (remaining === 0) { stopPause(); $('#breathing-label').textContent = 'Bentornato.'; $('#pause-dialog-title').textContent = 'Un po’ più capy.'; }
    }, 250);
  });
  pauseDialog.addEventListener('close', stopPause);
})();
