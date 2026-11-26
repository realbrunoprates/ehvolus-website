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
     O FLUXO: cada lado se abre a partir do seu círculo
     No desktop, a rolagem acende um lado por vez: a câmera acompanha o nó,
     o novo card nasce dele em um portal circular e cada dificuldade é
     varrida por uma linha dourada que revela como a EHVOLUS conecta.
     No celular, cada card se abre a partir do próprio marcador ao chegar na tela.
     ========================================================================== */
  var story = document.querySelector('[data-story]');
  var storyState = { pinned: false, index: -1, trigger: null, keys: [] };

  var EASE_PORTAL = 'cubic-bezier(0.77, 0, 0.175, 1)';
  var EASE_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

  /* coreografia de um card: cabeçalho, depois antes → depois, linha a linha */
  function playCard(card, base) {
    var list = [];
    var keep = function (animation) { list.push(animation); return animation; };
    var rise = [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }];
    card.classList.remove('is-prep');

    toArray(card.querySelectorAll('.fc-tag, .fc-title, .fc-hub-title')).forEach(function (el, i) {
      keep(el.animate(rise, { duration: 750, delay: base + i * 70, easing: EASE_EXPO, fill: 'both' }));
    });
    toArray(card.querySelectorAll('.fc-cols, .fc-col-label')).forEach(function (el, i) {
      keep(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: base + 180 + i * 80, easing: 'ease', fill: 'both' }));
    });

    toArray(card.querySelectorAll('.fc-pair')).forEach(function (row, i) {
      var before = row.querySelector('.fc-before');
      var after = row.querySelector('.fc-after');
      var arrow = row.querySelector('.fc-arrow');
      var scan = row.querySelector('.fc-scan');
      var rowWidth = row.offsetWidth;
      var scanWidth = scan.offsetWidth;
      var travel = rowWidth + scanWidth;
      var duration = 950;
      var start = base + 440 + i * 120;
      var at = function (x) { return start + duration * Math.max(0, Math.min(1, x / travel)); };

      keep(before.animate(rise, { duration: 650, delay: base + 220 + i * 70, easing: EASE_OUT, fill: 'both' }));
      keep(before.animate([{ color: '#10132A' }, { color: '#4A4E68' }],
        { duration: 420, delay: at(before.offsetLeft + before.offsetWidth * 0.5), easing: 'ease', fill: 'both' }));
      keep(scan.animate([
        { transform: 'translateX(' + (-scanWidth) + 'px)', opacity: 0 },
        { opacity: 1, offset: 0.08 },
        { opacity: 1, offset: 0.88 },
        { transform: 'translateX(' + rowWidth + 'px)', opacity: 0 }
      ], { duration: duration, delay: start, easing: 'linear', fill: 'both' }));
      keep(arrow.animate([{ opacity: 0, transform: 'translateX(-6px)' }, { opacity: 1, transform: 'none' }],
        { duration: 400, delay: at(arrow.offsetLeft), easing: EASE_OUT, fill: 'both' }));
      var revealStart = at(after.offsetLeft + scanWidth * 0.2);
      var revealEnd = at(after.offsetLeft + after.offsetWidth + scanWidth * 0.2);
      keep(after.animate([{ clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% 0% -10% 0)' }],
        { duration: Math.max(200, revealEnd - revealStart), delay: revealStart, easing: 'linear', fill: 'both' }));
    });

    toArray(card.querySelectorAll('.fc-list--before li')).forEach(function (li, i) {
      keep(li.animate(rise, { duration: 650, delay: base + 260 + i * 80, easing: EASE_OUT, fill: 'both' }));
    });
    toArray(card.querySelectorAll('.fc-list--after li')).forEach(function (li, i) {
      keep(li.animate([{ clipPath: 'inset(-10% 100% -10% 0)', opacity: 0.4 }, { clipPath: 'inset(-10% 0% -10% 0)', opacity: 1 }],
        { duration: 750, delay: base + 560 + i * 150, easing: EASE_PORTAL, fill: 'both' }));
    });
    return list;
  }

  /* portal: um círculo do tamanho do nó, no lugar do nó, que cresce até cobrir o card */
  function portalGeometry(card, origin, startRadius) {
    var o = origin.getBoundingClientRect();
    var c = card.getBoundingClientRect();
    var cx = o.left + o.width / 2 - c.left;
    var cy = o.top + o.height / 2 - c.top;
    var far = Math.max(
      Math.hypot(cx, cy), Math.hypot(c.width - cx, cy),
      Math.hypot(cx, c.height - cy), Math.hypot(c.width - cx, c.height - cy)
    );
    var at = ' at ' + cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px)';
    var r0 = startRadius != null ? startRadius : o.width / 2;
    return { from: 'circle(' + r0.toFixed(1) + 'px' + at, to: 'circle(' + Math.ceil(far + 2) + 'px' + at };
  }

  if (story) {
    var cards = toArray(story.querySelectorAll('[data-step]'));
    var keys = cards.map(function (card) { return card.getAttribute('data-step'); });
    var nodes = toArray(story.querySelectorAll('[data-tri-node]'));
    var edges = toArray(story.querySelectorAll('[data-tri-edge]'));
    var labels = toArray(story.querySelectorAll('[data-tri-label]'));
    var outer = story.querySelector('[data-tri-outer]');
    var countEl = story.querySelector('[data-story-count]');
    var barEl = story.querySelector('[data-story-bar]');
    var panel = story.querySelector('[data-flow-panel]');
    var triWrap = story.querySelector('[data-tri]');
    var names = { ehvolus: 'EHVOLUS', empresa: 'Empresa', profissional: 'Profissional', cliente: 'Cliente' };
    storyState.keys = keys;

    var shown = 0;
    var portalRun = null;
    var cardAnims = [];
    var stackObserver = null;

    var nodeFor = function (key) {
      return nodes.filter(function (node) { return node.getAttribute('data-tri-node') === key; })[0];
    };

    var cancelCardAnims = function () {
      cardAnims.forEach(function (animation) { animation.cancel(); });
      cardAnims = [];
    };

    var trackCamera = function (key) {
      if (!triWrap) return;
      var node = nodeFor(key);
      if (key === 'ehvolus' || !node) {
        triWrap.classList.remove('is-tracking');
      } else {
        triWrap.style.setProperty('--fx', node.style.getPropertyValue('--tx'));
        triWrap.style.setProperty('--fy', node.style.getPropertyValue('--ty'));
        triWrap.classList.add('is-tracking');
      }
      if (node && motionOk) {
        node.classList.remove('is-pulse');
        void node.offsetWidth;
        node.classList.add('is-pulse');
      }
    };

    var showInstant = function (index) {
      cards.forEach(function (card, i) {
        card.classList.toggle('is-shown', i === index);
        card.classList.remove('is-entering', 'is-prep');
        card.style.clipPath = '';
      });
      shown = index;
    };

    /* modo fixo: o novo card se abre por cima do anterior a partir do nó */
    var revealPinned = function (index) {
      if (portalRun) {
        portalRun.animation.cancel();
        showInstant(portalRun.index);
        portalRun = null;
      }
      if (index === shown) return;
      cancelCardAnims();
      var card = cards[index];
      var node = nodeFor(keys[index]);
      card.classList.add('is-entering');
      var geo = portalGeometry(card, node);
      var animation = card.animate([{ clipPath: geo.from }, { clipPath: geo.to }],
        { duration: 1000, easing: EASE_PORTAL, fill: 'both' });
      portalRun = { animation: animation, index: index };
      cardAnims = playCard(card, 380);
      animation.onfinish = function () {
        if (!portalRun || portalRun.animation !== animation) return;
        animation.cancel();
        showInstant(index);
        portalRun = null;
      };
    };

    var setStep = function (index) {
      if (index === storyState.index) return;
      storyState.index = index;
      var key = keys[index];

      cards.forEach(function (card, i) { card.classList.toggle('is-active', i === index); });
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

      if (storyState.pinned) {
        trackCamera(key);
        if (motionOk) revealPinned(index);
        else showInstant(index);
      }
    };

    storyState.positionFor = function (index) {
      var st = storyState.trigger;
      return st.start + ((index + 0.4) / keys.length) * (st.end - st.start);
    };

    /* celular, tablet ou sem GSAP: cada card se abre a partir do próprio marcador */
    var setupStacked = function () {
      if (!motionOk || !('IntersectionObserver' in window)) return;
      cards.forEach(function (card) {
        card.classList.add('is-prep');
        var badge = card.querySelector('.fc-node');
        if (badge) card.style.clipPath = portalGeometry(card, badge, 5).from;
      });
      stackObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var card = entry.target;
          stackObserver.unobserve(card);
          var badge = card.querySelector('.fc-node');
          if (badge) {
            var geo = portalGeometry(card, badge, 5);
            var animation = card.animate([{ clipPath: geo.from }, { clipPath: geo.to }],
              { duration: 1100, easing: EASE_PORTAL, fill: 'both' });
            animation.onfinish = function () { animation.cancel(); card.style.clipPath = ''; };
          }
          card.style.clipPath = '';
          playCard(card, 300);
        });
      }, { threshold: 0, rootMargin: '0px 0px -30% 0px' }); /* o card recortado só expõe o marcador; dispara quando ele passa de 70% da tela */
      cards.forEach(function (card) { stackObserver.observe(card); });
    };

    var teardownStacked = function () {
      if (stackObserver) stackObserver.disconnect();
      stackObserver = null;
      cards.forEach(function (card) {
        card.classList.remove('is-prep');
        card.style.clipPath = '';
      });
    };

    setStep(0);

    var pinQuery = '(min-width: 1024px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)';
    if (!(hasGsap && window.matchMedia(pinQuery).matches)) setupStacked();

    /* modo fixo: só no desktop, com espaço e com movimento */
    if (hasGsap) {
      var mm = gsap.matchMedia();
      mm.add(pinQuery, function () {
        teardownStacked();
        story.classList.add('is-pinned');
        storyState.pinned = true;
        storyState.index = -1;
        showInstant(0);
        setStep(0);

        if (motionOk && panel) {
          cards[0].classList.add('is-prep');
          ScrollTrigger.create({
            trigger: panel,
            start: 'top 78%',
            once: true,
            onEnter: function () {
              if (storyState.index === 0 && !portalRun) cardAnims = playCard(cards[0], 0);
              else cards[0].classList.remove('is-prep');
            }
          });
        }

        storyState.trigger = ScrollTrigger.create({
          trigger: story,
          pin: story.querySelector('[data-story-pin]'),
          start: 'top top',
          end: function () { return '+=' + Math.round(window.innerHeight * 3); },
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
          if (portalRun) portalRun.animation.cancel();
          portalRun = null;
          cancelCardAnims();
          story.classList.remove('is-pinned');
          storyState.pinned = false;
          storyState.trigger = null;
          if (outer) outer.style.strokeDashoffset = '';
          if (triWrap) triWrap.classList.remove('is-tracking');
          showInstant(0);
          storyState.index = -1;
          setStep(0);
        };
      });
    }

    /* clique num círculo leva ao lado correspondente */
    nodes.forEach(function (node) {
      node.addEventListener('click', function () {
        var index = keys.indexOf(node.getAttribute('data-tri-node'));
        if (index < 0) return;
        if (storyState.pinned && storyState.trigger) {
          window.scrollTo({ top: storyState.positionFor(index), behavior: motionOk ? 'smooth' : 'auto' });
        } else {
          scrollToElement(cards[index]);
        }
      });
    });

    /* leve inclinação 3D que segue o mouse, com inércia */
    var canvas = story.querySelector('[data-tri-canvas]');
    if (canvas && triWrap && finePointer.matches && motionOk) {
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
      triWrap.addEventListener('pointermove', function (event) {
        if (event.pointerType !== 'mouse') return;
        var rect = triWrap.getBoundingClientRect();
        target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
        target.y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
        if (!raf) raf = window.requestAnimationFrame(tick);
      });
      triWrap.addEventListener('pointerleave', function () {
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
