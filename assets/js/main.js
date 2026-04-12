(function () {

  var EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

  // ── Dark mode toggle ──────────────────────────────────────

  var darkToggle = document.querySelector('.dark-toggle');

  // Restore saved preference
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
    if (menuBtn)  menuBtn.setAttribute('aria-expanded', 'true');
    if (panel)    panel.setAttribute('aria-hidden', 'false');
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

  // Close panel on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePanel();
  });

  // ── Active nav link (based on current URL) ────────────────

  var path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.side-panel__nav a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').replace(/\/$/, '') || '/';
    if (href === path) {
      a.classList.add('is-active');
    } else {
      a.classList.remove('is-active');
    }
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

  // ── Image lightbox ────────────────────────────────────────

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

  // Double-tap to close on mobile
  var lastTap = 0;
  lightboxContainer.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTap < 300) { e.preventDefault(); closeLightbox(); }
    lastTap = now;
  });

  // Open lightbox when any .post-img figure is clicked
  document.addEventListener('click', function (e) {
    var figure = e.target.closest('.post-img');
    if (figure) openLightbox(figure);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });

}());
