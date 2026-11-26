/* ==========================================================================
   EHVOLUS · Site institucional v2
   Movimento com propósito: cada animação conta uma parte da história.
   Sem GSAP ou com movimento reduzido, tudo continua legível e funcional.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js-ready');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var hasGsap = !!(gsap && ScrollTrigger);
  var motionOk = !reduceMotion.matches;

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  function toArray(list) {
    return Array.prototype.slice.call(list);
  }

  /* ---- divide um texto simples em palavras ---- */
  function splitWords(el, mode) {
    var words = el.textContent.trim().split(/\s+/);
    var parts = [];
    el.textContent = '';
    words.forEach(function (word, index) {
      var outer = document.createElement('span');
      if (mode === 'mask') {
        var inner = document.createElement('span');
        outer.className = 'w';
        outer.style.setProperty('--i', index);
        inner.textContent = word;
        outer.appendChild(inner);
      } else {
        outer.className = 'sw';
        outer.textContent = word;
      }
      el.appendChild(outer);
      if (index < words.length - 1) el.appendChild(document.createTextNode(' '));
      parts.push(outer);
    });
    return parts;
  }

  toArray(document.querySelectorAll('[data-split], [data-split-reveal]')).forEach(function (el) {
    splitWords(el, 'mask');
  });

  /* ==========================================================================
     HEADER: sólido ao rolar, se recolhe ao descer, volta ao subir
     ========================================================================== */
  var header = document.getElementById('siteHeader');
  var lastY = window.scrollY;
  var ticking = false;

  function updateHeader() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 8);
      var goingDown = y > lastY + 2;
      var goingUp = y < lastY - 2;
      if (document.body.classList.contains('nav-open') || y < window.innerHeight * 0.6) {
        header.classList.remove('is-hidden');
      } else if (goingDown) {
        header.classList.add('is-hidden');
      } else if (goingUp) {
        header.classList.remove('is-hidden');
      }
    }
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  if (header) {
    header.addEventListener('focusin', function () {
      header.classList.remove('is-hidden');
    });
  }

  updateHeader();

  /* ==========================================================================
     MENU LATERAL
     ========================================================================== */
  var navToggle = document.getElementById('navToggle');
  var navPanel = document.getElementById('navPanel');
  var navPanelClose = document.getElementById('navPanelClose');
  var navScrim = navPanel ? navPanel.querySelector('[data-nav-scrim]') : null;

  function openNav() {
    if (!navPanel || !navToggle) return;
    navPanel.classList.add('is-open');
    navPanel.setAttribute('aria-hidden', 'false');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    if (header) header.classList.remove('is-hidden');
    if (navPanelClose) navPanelClose.focus();
  }

  function closeNav() {
    if (!navPanel || !navToggle) return;
    navPanel.classList.remove('is-open');
    navPanel.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  }

  function isNavOpen() {
    return !!(navPanel && navPanel.classList.contains('is-open'));
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      if (isNavOpen()) {
        closeNav();
        navToggle.focus();
      } else {
        openNav();
      }
    });
  }

  if (navPanelClose) {
    navPanelClose.addEventListener('click', function () {
      closeNav();
      if (navToggle) navToggle.focus();
    });
  }

  if (navScrim) navScrim.addEventListener('click', closeNav);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isNavOpen()) {
      closeNav();
      if (navToggle) navToggle.focus();
      return;
    }

    if (event.key === 'Tab' && isNavOpen() && navPanel) {
      var focusable = toArray(navPanel.querySelectorAll('a[href], button:not([disabled])'));
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* ==========================================================================
     O FLUXO: triângulo + passos
     ========================================================================== */
  var story = document.querySelector('[data-story]');
  var storyState = { pinned: false, index: -1, trigger: null, keys: [] };

  if (story) {
    var steps = toArray(story.querySelectorAll('[data-step]'));
    var keys = steps.map(function (step) { return step.getAttribute('data-step'); });
    var nodes = toArray(story.querySelectorAll('[data-tri-node]'));
    var edges = toArray(story.querySelectorAll('[data-tri-edge]'));
    var labels = toArray(story.querySelectorAll('[data-tri-label]'));
    var outer = story.querySelector('[data-tri-outer]');
    var countEl = story.querySelector('[data-story-count]');
    var barEl = story.querySelector('[data-story-bar]');
    var names = { ehvolus: 'EHVOLUS', empresa: 'Empresa', profissional: 'Profissional', cliente: 'Cliente' };
    storyState.keys = keys;

    var setStep = function (index) {
      if (index === storyState.index) return;
      storyState.index = index;
      var key = keys[index];

      steps.forEach(function (step, i) {
        step.classList.toggle('is-active', i === index);
      });
      nodes.forEach(function (node) {
        node.classList.toggle('is-active', node.getAttribute('data-tri-node') === key);
      });
      edges.forEach(function (edge) {
        edge.classList.toggle('is-drawn', keys.indexOf(edge.getAttribute('data-tri-edge')) <= index);
      });
      labels.forEach(function (label) {
        label.classList.toggle('is-drawn', keys.indexOf(label.getAttribute('data-tri-label')) <= index);
      });
      if (countEl) countEl.textContent = names[key] || '';
      if (barEl) barEl.style.transform = 'scaleX(' + ((index + 1) / keys.length) + ')';
    };

    storyState.positionFor = function (index) {
      var st = storyState.trigger;
      return st.start + ((index + 0.35) / keys.length) * (st.end - st.start);
    };

    setStep(0);

    /* clique num círculo leva ao lado correspondente */
    nodes.forEach(function (node) {
      node.addEventListener('click', function () {
        var index = keys.indexOf(node.getAttribute('data-tri-node'));
        if (index < 0) return;
        if (storyState.pinned && storyState.trigger) {
          window.scrollTo({ top: storyState.positionFor(index), behavior: motionOk ? 'smooth' : 'auto' });
        } else {
          scrollToElement(steps[index]);
        }
      });
    });

    /* teclado: ao focar um link de um passo escondido, a história vai até ele */
    steps.forEach(function (step, index) {
      step.addEventListener('focusin', function () {
        if (storyState.pinned && storyState.trigger && storyState.index !== index) {
          window.scrollTo({ top: storyState.positionFor(index), behavior: 'auto' });
          setStep(index);
        }
      });
    });

    /* modo fixo: só no desktop, com espaço e com movimento */
    if (hasGsap) {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 1024px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)', function () {
        story.classList.add('is-pinned');
        storyState.pinned = true;
        storyState.index = -1;
        setStep(0);

        storyState.trigger = ScrollTrigger.create({
          trigger: story,
          pin: story.querySelector('[data-story-pin]'),
          start: 'top top',
          end: function () { return '+=' + Math.round(window.innerHeight * 2.8); },
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            var p = self.progress;
            setStep(Math.min(keys.length - 1, Math.floor(p * keys.length)));
            if (outer) outer.style.strokeDashoffset = String(Math.max(0, 1 - p * 1.2));
          }
        });
        if (outer) outer.style.strokeDashoffset = '1';

        return function () {
          story.classList.remove('is-pinned');
          storyState.pinned = false;
          storyState.trigger = null;
          if (outer) outer.style.strokeDashoffset = '';
          storyState.index = -1;
          setStep(0);
        };
      });
    }

    /* leve inclinação 3D que segue o mouse, com inércia */
    var canvas = story.querySelector('[data-tri-canvas]');
    var stage = story.querySelector('[data-tri]');
    if (canvas && stage && finePointer.matches && motionOk) {
      var target = { x: 0, y: 0 };
      var current = { x: 0, y: 0 };
      var raf = null;
      var tick = function () {
        current.x += (target.x - current.x) * 0.08;
        current.y += (target.y - current.y) * 0.08;
        canvas.style.transform = 'perspective(1400px) rotateX(' + current.y.toFixed(3) + 'deg) rotateY(' + current.x.toFixed(3) + 'deg)';
        if (Math.abs(target.x - current.x) > 0.005 || Math.abs(target.y - current.y) > 0.005) {
          raf = window.requestAnimationFrame(tick);
        } else {
          raf = null;
        }
      };
      stage.addEventListener('pointermove', function (event) {
        if (event.pointerType !== 'mouse') return;
        var rect = stage.getBoundingClientRect();
        target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
        target.y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
        if (!raf) raf = window.requestAnimationFrame(tick);
      });
      stage.addEventListener('pointerleave', function () {
        target.x = 0;
        target.y = 0;
        if (!raf) raf = window.requestAnimationFrame(tick);
      });
    }
  }

  /* ==========================================================================
     ÂNCORAS: rolagem suave e ciente da história fixa
     ========================================================================== */
  function headerOffset() {
    return header ? header.offsetHeight : 0;
  }

  function scrollToElement(target) {
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset() + 1;
    window.scrollTo({ top: top, behavior: motionOk ? 'smooth' : 'auto' });
  }

  function scrollToHash(hash, smooth) {
    var target = document.getElementById(hash.slice(1));
    if (!target) return false;
    var stepIndex = storyState.keys.indexOf(target.getAttribute('data-step'));
    if (storyState.pinned && storyState.trigger && stepIndex > -1) {
      window.scrollTo({ top: storyState.positionFor(stepIndex), behavior: smooth && motionOk ? 'smooth' : 'auto' });
    } else if (target.id === 'hero') {
      window.scrollTo({ top: 0, behavior: smooth && motionOk ? 'smooth' : 'auto' });
    } else {
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset() + 1;
      window.scrollTo({ top: top, behavior: smooth && motionOk ? 'smooth' : 'auto' });
    }
    window.setTimeout(function () {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }, smooth && motionOk ? 700 : 0);
    return true;
  }

  toArray(document.querySelectorAll('a[href^="#"]')).forEach(function (link) {
    link.addEventListener('click', function (event) {
      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      if (!document.getElementById(hash.slice(1))) return;
      event.preventDefault();
      closeNav();
      scrollToHash(hash, true);
      if (window.history && window.history.replaceState) window.history.replaceState(null, '', hash);
    });
  });

  /* ==========================================================================
     REVELAÇÕES: uma vez, quando o elemento chega na tela
     ========================================================================== */
  toArray(document.querySelectorAll('[data-stagger]')).forEach(function (group) {
    toArray(group.querySelectorAll('[data-reveal]')).forEach(function (item, index) {
      item.style.setProperty('--d', (index * 90) + 'ms');
    });
  });

  var revealTargets = toArray(document.querySelectorAll('[data-reveal], [data-split-reveal]'));
  if ('IntersectionObserver' in window && motionOk) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ==========================================================================
     ENTRADA DO HERO: depois que a fonte chega, para não pular
     ========================================================================== */
  function markReady() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        root.classList.add('is-ready');
      });
    });
  }

  if (document.fonts && document.fonts.ready) {
    Promise.race([
      document.fonts.ready,
      new Promise(function (resolve) { window.setTimeout(resolve, 900); })
    ]).then(markReady);
  } else {
    markReady();
  }

  /* ==========================================================================
     ROLAGEM COM GSAP (só com movimento permitido)
     ========================================================================== */
  if (hasGsap && motionOk) {
    /* hero: o conteúdo sai devagar, o globo se aproxima */
    var heroContent = document.querySelector('[data-hero-content]');
    var heroGlobe = document.querySelector('[data-hero-globe]');
    if (heroContent) {
      gsap.to(heroContent, {
        yPercent: -10,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }
    if (heroGlobe) {
      gsap.fromTo(heroGlobe, { scale: 1, yPercent: 0 }, {
        scale: 1.14,
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    /* frases que acendem palavra por palavra */
    toArray(document.querySelectorAll('[data-scrub-words]')).forEach(function (el) {
      var words = splitWords(el, 'scrub');
      gsap.fromTo(words, { opacity: 0.14 }, {
        opacity: 1,
        ease: 'none',
        stagger: 0.12,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true }
      });
    });

    /* como funciona: a linha conduz os três passos */
    var how = document.querySelector('.how');
    var track = document.querySelector('[data-how]');
    var line = document.querySelector('[data-how-line]');
    var howSteps = toArray(document.querySelectorAll('[data-how-step]'));
    if (how && track && line && howSteps.length) {
      how.setAttribute('data-animated', '');
      var thresholds = [];
      var measure = function () {
        var lineRect = line.parentNode.getBoundingClientRect();
        var vertical = lineRect.height > lineRect.width;
        var length = vertical ? lineRect.height : lineRect.width;
        thresholds = howSteps.map(function (step) {
          var dot = step.querySelector('.how-dot').getBoundingClientRect();
          var pos = vertical ? dot.top - lineRect.top : dot.left - lineRect.left;
          return Math.max(0.02, pos / Math.max(1, length));
        });
      };
      var paint = function (p) {
        line.style.setProperty('--p', p.toFixed(4));
        howSteps.forEach(function (step, i) {
          step.classList.toggle('is-lit', p >= thresholds[i]);
        });
      };
      measure();
      paint(0);
      ScrollTrigger.create({
        trigger: track,
        start: 'top 78%',
        end: 'bottom 52%',
        scrub: true,
        onRefresh: function (self) { measure(); paint(self.progress); },
        onUpdate: function (self) { paint(self.progress); }
      });
    }

    /* mercados: a foto se abre como uma janela e respira com a rolagem */
    var marketsFigure = document.querySelector('[data-clip-reveal]');
    if (marketsFigure) {
      var gutter = parseFloat(window.getComputedStyle(document.querySelector('.wrap')).paddingLeft) || 24;
      gsap.fromTo(marketsFigure,
        { clipPath: 'inset(12% ' + gutter + 'px 12% ' + gutter + 'px round 16px)' },
        {
          clipPath: 'inset(0% 0px 0% 0px round 0px)',
          ease: 'none',
          scrollTrigger: { trigger: marketsFigure, start: 'top 92%', end: 'top 20%', scrub: true }
        }
      );
      var marketsImg = marketsFigure.querySelector('[data-parallax]');
      if (marketsImg) {
        gsap.fromTo(marketsImg, { yPercent: -7 }, {
          yPercent: 7,
          ease: 'none',
          scrollTrigger: { trigger: marketsFigure, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }
    }

    /* fechamento: a montanha se assenta */
    var closingImg = document.querySelector('[data-closing-img]');
    if (closingImg) {
      gsap.fromTo(closingImg, { scale: 1.2 }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'bottom bottom', scrub: true }
      });
    }

    window.addEventListener('load', function () {
      ScrollTrigger.refresh();
      if (window.location.hash) scrollToHash(window.location.hash, false);
    });
  }
})();
