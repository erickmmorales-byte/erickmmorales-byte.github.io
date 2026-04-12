(function () {

  var EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

  // ── Dark mode toggle ──────────────────────────────────────

  var darkToggle = document.querySelector('.dark-toggle');

  if (localStorage.getItem('dark-mode') === 'on') {
    document.body.classList.add('dark-mode');
    if (darkToggle) darkToggle.textContent = 'LIGHT';
  }

  if (darkToggle) {
    darkToggle.addEventListener('click', function () {
      var isDark = document.body.classList.toggle('dark-mode');
      darkToggle.textContent = isDark ? 'LIGHT' : 'DARK';
      localStorage.setItem('dark-mode', isDark ? 'on' : 'off');
    });
  }

  // ── Side panel ────────────────────────────────────────────

  var menuBtn  = document.querySelector('.menu-toggle');
  var panel    = document.querySelector('.side-panel');
  var backdrop = document.querySelector('.backdrop');

  function openPanel() {
    document.body.classList.add('panel-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    if (panel)   panel.setAttribute('aria-hidden', 'false');
  }

  function closePanel() {
    document.body.classList.remove('panel-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    if (panel)   panel.setAttribute('aria-hidden', 'true');
  }

  if (menuBtn)  menuBtn.addEventListener('click', function () {
    document.body.classList.contains('panel-open') ? closePanel() : openPanel();
  });
  if (backdrop) backdrop.addEventListener('click', closePanel);

  // ── Active nav link ───────────────────────────────────────

  var path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.side-panel__nav a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').replace(/\/$/, '') || '/';
    a.classList.toggle('is-active', href === path);
  });

  // ── Contact form (mailto fallback) ────────────────────────

  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name    = form.querySelector('[name="name"]').value.trim();
      var email   = form.querySelector('[name="email"]').value.trim();
      var message = form.querySelector('[name="message"]').value.trim();
      var mailto  = 'mailto:erickmmorales@gmail.com'
        + '?subject=' + encodeURIComponent('Message from ' + name)
        + '&body='    + encodeURIComponent(message + '\n\nReply to: ' + email);
      window.location.href = mailto;
    });
  }

  // ── Post modal ────────────────────────────────────────────

  var modal = document.querySelector('.post-modal');
  if (!modal) return;

  var modalBackdrop  = modal.querySelector('.post-modal__backdrop');
  var modalContainer = modal.querySelector('.post-modal__container');
  var modalClose     = modal.querySelector('.post-modal__close');
  var modalDate      = modal.querySelector('.post-modal__date');
  var modalTitle     = modal.querySelector('.post-modal__title');
  var modalBody      = modal.querySelector('.post-modal__body');
  var timeline       = document.querySelector('.timeline');
  var lastCardRect   = null;
  var lastTouchTime  = 0;

  function populateModal(article) {
    var date      = article.querySelector('.post__date');
    var title     = article.querySelector('.post__title');
    var bodyInner = article.querySelector('.post__body-inner');

    modalDate.textContent = date  ? date.textContent  : '';
    modalDate.setAttribute('datetime', date ? (date.getAttribute('datetime') || '') : '');
    modalTitle.textContent = title ? title.textContent : '';
    modalBody.innerHTML    = bodyInner ? bodyInner.innerHTML : '';

    // Strip figcaptions — captions show only in the lightbox
    modalBody.querySelectorAll('figcaption').forEach(function (fc) { fc.remove(); });
  }

  function growModal(fromRect, toMargin) {
    modalContainer.style.transition = 'none';
    modalContainer.style.top    = fromRect.top    + 'px';
    modalContainer.style.left   = fromRect.left   + 'px';
    modalContainer.style.right  = (window.innerWidth  - fromRect.right)  + 'px';
    modalContainer.style.bottom = (window.innerHeight - fromRect.bottom) + 'px';
    modalContainer.style.overflow = 'hidden';

    void modalContainer.offsetHeight; // force reflow

    modalContainer.style.transition =
      'top 0.4s ' + EASING + ', left 0.4s ' + EASING +
      ', right 0.4s ' + EASING + ', bottom 0.4s ' + EASING;
    modalContainer.style.top    = toMargin;
    modalContainer.style.left   = toMargin;
    modalContainer.style.right  = toMargin;
    modalContainer.style.bottom = toMargin;

    modalContainer.addEventListener('transitionend', function handler(e) {
      if (e.propertyName !== 'top') return;
      modalContainer.removeEventListener('transitionend', handler);
      modalContainer.style.overflowY = 'auto';
      modalClose.focus();
    });
  }

  function openModal(article) {
    populateModal(article);
    var card = article.querySelector('.post__card');
    lastCardRect = card.getBoundingClientRect();
    var margin = window.innerWidth <= 700 ? '0.75rem' : '2rem';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    growModal(lastCardRect, margin);

    // Update address bar to the post's own URL (browser back closes modal)
    var postUrl = article.getAttribute('data-post-url');
    if (postUrl) history.pushState({ modal: true }, '', postUrl);
  }

  // Shared close animation — used by both button close and popstate close
  function animateModalClosed() {
    modalContainer.style.overflowY = 'hidden';
    if (lastCardRect) {
      var r = lastCardRect;
      modalContainer.style.transition =
        'top 0.35s ' + EASING + ', left 0.35s ' + EASING +
        ', right 0.35s ' + EASING + ', bottom 0.35s ' + EASING;
      modalContainer.style.top    = r.top    + 'px';
      modalContainer.style.left   = r.left   + 'px';
      modalContainer.style.right  = (window.innerWidth  - r.right)  + 'px';
      modalContainer.style.bottom = (window.innerHeight - r.bottom) + 'px';
    }
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    modal.addEventListener('transitionend', function handler(e) {
      if (e.propertyName !== 'opacity') return;
      modal.removeEventListener('transitionend', handler);
      modalContainer.style.cssText = '';
    });
  }

  function closeModal() {
    animateModalClosed();
    // Navigate back so the URL restores to / (triggers popstate, which is a no-op
    // since is-open is already removed above)
    if (history.state && history.state.modal) history.back();
  }

  // Browser back button while modal is open → close it
  window.addEventListener('popstate', function () {
    if (modal.classList.contains('is-open')) animateModalClosed();
  });

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);

  modalContainer.addEventListener('dblclick', function () {
    if (modal.classList.contains('is-open')) closeModal();
  });

  modalContainer.addEventListener('touchend', function () {
    var now = Date.now();
    if (now - lastTouchTime < 320 && modal.classList.contains('is-open')) closeModal();
    lastTouchTime = now;
  }, { passive: true });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('is-open')) closeModal();
    else closePanel();
  });

  // ── Timeline card click → open modal ─────────────────────

  if (timeline) {
    timeline.addEventListener('click', function (e) {
      var card = e.target.closest('.post__card');
      if (!card) return;
      var article = card.closest('.post');
      if (article) openModal(article);
    });

    timeline.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.post__card');
      if (!card) return;
      e.preventDefault();
      var article = card.closest('.post');
      if (article) openModal(article);
    });
  }

  // ── Image lightbox (opened from inside the modal) ─────────

  var lightbox = document.querySelector('.img-lightbox');
  if (!lightbox) return;

  var lightboxBackdrop  = lightbox.querySelector('.img-lightbox__backdrop');
  var lightboxClose     = lightbox.querySelector('.img-lightbox__close');
  var lightboxContainer = lightbox.querySelector('.img-lightbox__container');
  var lightboxLayout    = lightbox.querySelector('.img-lightbox__layout');
  var lightboxImg       = lightbox.querySelector('.img-lightbox__img');
  var lightboxCaption   = lightbox.querySelector('.img-lightbox__caption');
  var lastFigureRect    = null;

  function openLightbox(figure) {
    var img     = figure.querySelector('img');
    var caption = figure.getAttribute('data-caption') || '';
    var side    = figure.classList.contains('post-img--left')  ? 'left'
                : figure.classList.contains('post-img--right') ? 'right'
                : 'center';

    lightboxImg.src             = img.src;
    lightboxImg.alt             = img.alt;
    lightboxCaption.textContent = caption;
    lightboxLayout.className    = 'img-lightbox__layout img-lightbox__layout--' + side;

    lastFigureRect = figure.getBoundingClientRect();
    var r = lastFigureRect;

    lightboxContainer.style.transition = 'none';
    lightboxContainer.style.top    = r.top    + 'px';
    lightboxContainer.style.left   = r.left   + 'px';
    lightboxContainer.style.right  = (window.innerWidth  - r.right)  + 'px';
    lightboxContainer.style.bottom = (window.innerHeight - r.bottom) + 'px';
    lightboxContainer.style.overflow = 'hidden';

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');

    void lightboxContainer.offsetHeight;

    var lbMargin = window.innerWidth <= 700 ? '1.5rem' : '4rem';
    lightboxContainer.style.transition =
      'top 0.4s ' + EASING + ', left 0.4s ' + EASING +
      ', right 0.4s ' + EASING + ', bottom 0.4s ' + EASING;
    lightboxContainer.style.top    = lbMargin;
    lightboxContainer.style.left   = lbMargin;
    lightboxContainer.style.right  = lbMargin;
    lightboxContainer.style.bottom = lbMargin;

    lightboxContainer.addEventListener('transitionend', function handler(e) {
      if (e.propertyName !== 'top') return;
      lightboxContainer.removeEventListener('transitionend', handler);
      lightboxClose.focus();
    });
  }

  function closeLightbox() {
    if (lastFigureRect) {
      var r = lastFigureRect;
      lightboxContainer.style.overflow = 'hidden';
      lightboxContainer.style.transition =
        'top 0.35s ' + EASING + ', left 0.35s ' + EASING +
        ', right 0.35s ' + EASING + ', bottom 0.35s ' + EASING;
      lightboxContainer.style.top    = r.top    + 'px';
      lightboxContainer.style.left   = r.left   + 'px';
      lightboxContainer.style.right  = (window.innerWidth  - r.right)  + 'px';
      lightboxContainer.style.bottom = (window.innerHeight - r.bottom) + 'px';
    }
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.addEventListener('transitionend', function handler(e) {
      if (e.propertyName !== 'opacity') return;
      lightbox.removeEventListener('transitionend', handler);
      lightboxContainer.style.cssText = '';
    });
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxBackdrop.addEventListener('click', closeLightbox);
  lightboxContainer.addEventListener('dblclick', closeLightbox);

  var lastTap = 0;
  lightboxContainer.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTap < 300) { e.preventDefault(); closeLightbox(); }
    lastTap = now;
  });

  modal.addEventListener('click', function (e) {
    var figure = e.target.closest('.post-img');
    if (figure) openLightbox(figure);
  });

  // ── Search / filter ───────────────────────────────────────

  var searchInput = document.getElementById('timeline-search');
  if (searchInput && timeline) {
    searchInput.addEventListener('input', function () {
      var query = searchInput.value.toLowerCase().trim();
      timeline.querySelectorAll('.post').forEach(function (article) {
        var title   = (article.getAttribute('data-title')   || '').toLowerCase();
        var excerpt = (article.getAttribute('data-excerpt') || '').toLowerCase();
        var match = !query || title.includes(query) || excerpt.includes(query);
        article.style.display = match ? '' : 'none';
      });
    });
  }

}());
