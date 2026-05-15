(function () {
  'use strict';

  const nav         = document.getElementById('nav');
  const hamburger   = document.querySelector('.nav__hamburger');
  const mobileMenu  = document.getElementById('nav__mobile');
  const mobileLinks = mobileMenu.querySelectorAll('a');

  /* ── 1. Nav: transparent → frosted glass on scroll ──────────────────── */
  const SCROLL_THRESHOLD = 80;

  function onScroll() {
    nav.classList.toggle('nav--scrolled', window.scrollY > SCROLL_THRESHOLD);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── 2. Mobile menu ──────────────────────────────────────────────────── */
  function openMenu() {
    nav.classList.add('nav--open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    nav.classList.remove('nav--open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    const isOpen = nav.classList.contains('nav--open');
    isOpen ? closeMenu() : openMenu();
  });

  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
      closeMenu();
      hamburger.focus();
    }
  });

  /* ── 3. Intersection Observer: scroll-triggered reveals ─────────────── */
  var revealElements = document.querySelectorAll('.reveal');

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealElements.forEach(function (el) {
      el.classList.add('reveal-hidden');
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.remove('reveal-hidden');
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -48px 0px'
      }
    );

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ── 4. Smooth scroll for nav anchor links ───────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var offset = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    });
  });

}());
