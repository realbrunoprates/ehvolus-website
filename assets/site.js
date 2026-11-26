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

    /* ======================================================================
       O CÍRCULO SE ABRE
       Clique num círculo: a câmera se aproxima dele, um portal circular
       nasce do próprio nó e vira o painel, e cada dificuldade é varrida
       por uma linha dourada que revela como a EHVOLUS conecta.
       ====================================================================== */
    var DETAILS = {
      empresa: {
        tag: 'Empresa',
        title: 'Demanda e gestão',
        pairs: [
          ['Depende de contatos avulsos para montar cada operação.', 'Encontra profissionais adequados à demanda em um só lugar.'],
          ['Cada nova demanda começa do zero, sem histórico reaproveitável.', 'Organiza o fluxo de trabalho sem depender de planilha paralela.'],
          ['Falta visibilidade sobre o andamento do que já está em execução.', 'Acompanha a execução do início ao fim em tempo real.']
        ]
      },
      profissional: {
        tag: 'Profissional',
        title: 'Execução e experiência',
        pairs: [
          ['Cada trabalho novo começa sem levar o histórico anterior.', 'Constrói reputação que acompanha sua trajetória ao longo do tempo.'],
          ['Oportunidades chegam de forma informal e irregular.', 'Acessa demandas compatíveis com sua especialidade.'],
          ['Falta uma estrutura que sustente a autonomia no dia a dia.', 'Ganha autonomia apoiada por uma estrutura consistente.']
        ]
      },
      cliente: {
        tag: 'Cliente',
        title: 'Necessidade e avaliação',
        pairs: [
          ['Não sabe ao certo quem vai atender a própria necessidade.', 'Encontra a solução adequada para a necessidade apresentada.'],
          ['Fica sem visibilidade entre o pedido e a execução.', 'Acompanha quem atende, quando atende e como o serviço avança.'],
          ['Depende de indicação informal para confiar no serviço.', 'Avalia a execução até a conclusão do serviço.']
        ]
      },
      ehvolus: {
        tag: 'EHVOLUS',
        title: 'Coordenação do fluxo',
        before: [
          'Os três lados trabalhavam isolados, cada um com sua própria rotina.',
          'A comunicação entre demanda, execução e acompanhamento se perdia no caminho.'
        ],
        after: [
          'Reúne empresa, profissional e cliente no mesmo fluxo.',
          'Conecta demanda, execução e acompanhamento em tempo real.',
          'Torna o progresso do serviço visível para todos os lados.'
        ]
      }
    };

    var LABEL_BEFORE = 'A dificuldade';
    var LABEL_AFTER = 'Como a EHVOLUS conecta';
    var EASE_PORTAL = 'cubic-bezier(0.77, 0, 0.175, 1)';
    var EASE_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
    var EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

    var detail = story.querySelector('[data-tri-detail]');
    var detailInner = story.querySelector('[data-td-inner]');
    var detailTag = story.querySelector('[data-td-tag]');
    var detailTitle = story.querySelector('[data-td-title]');
    var detailBody = story.querySelector('[data-td-body]');
    var triWrap = story.querySelector('[data-tri]');
    var stepsWrap = story.querySelector('.story-steps');
    var detailState = { open: false, key: null, trigger: null, anims: [], closing: null, timer: null };

    var nodeFor = function (key) {
      return nodes.filter(function (node) { return node.getAttribute('data-tri-node') === key; })[0];
    };

    var trackAnim = function (animation) {
      detailState.anims.push(animation);
      return animation;
    };

    var cancelAnims = function () {
      detailState.anims.forEach(function (animation) { animation.cancel(); });
      detailState.anims = [];
    };

    var renderDetail = function (key) {
      var data = DETAILS[key];
      detailTag.textContent = data.tag;
      detailTitle.textContent = data.title;
      var html = '';
      if (data.pairs) {
        html += '<div class="td-cols" aria-hidden="true"><span>' + LABEL_BEFORE + '</span><span></span><span>' + LABEL_AFTER + '</span></div>';
        html += '<ol class="td-pairs">';
        data.pairs.forEach(function (pair) {
          html += '<li class="td-pair">' +
            '<span class="td-scan" aria-hidden="true"></span>' +
            '<p class="td-before"><span class="td-label">' + LABEL_BEFORE + '</span>' + pair[0] + '</p>' +
            '<span class="td-arrow" aria-hidden="true"></span>' +
            '<p class="td-after"><span class="td-label td-label--gold">' + LABEL_AFTER + '</span>' + pair[1] + '</p>' +
            '</li>';
        });
        html += '</ol>';
      } else {
        html += '<div class="td-split">' +
          '<div><p class="td-col-label">' + LABEL_BEFORE + '</p><ul class="td-list td-list--before">' +
          data.before.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul></div>' +
          '<div><p class="td-col-label td-col-label--gold">' + LABEL_AFTER + '</p><ul class="td-list td-list--after">' +
          data.after.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul></div>' +
          '</div>';
      }
      detailBody.innerHTML = html;
    };

    /* coreografia do conteúdo: cabeçalho, depois antes → depois, linha a linha */
    var choreograph = function (base) {
      var rise = [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }];
      toArray(detail.querySelectorAll('.td-tag, .td-title, .td-close')).forEach(function (el, i) {
        trackAnim(el.animate(rise, { duration: 700, delay: Math.max(0, base - 220) + i * 60, easing: EASE_EXPO, fill: 'both' }));
      });
      toArray(detail.querySelectorAll('.td-cols, .td-col-label')).forEach(function (el, i) {
        trackAnim(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: base - 60 + i * 80, easing: 'ease', fill: 'both' }));
      });

      toArray(detail.querySelectorAll('.td-pair')).forEach(function (row, i) {
        var before = row.querySelector('.td-before');
        var after = row.querySelector('.td-after');
        var arrow = row.querySelector('.td-arrow');
        var scan = row.querySelector('.td-scan');
        var rowWidth = row.offsetWidth;
        var scanWidth = scan.offsetWidth;
        var travel = rowWidth + scanWidth;
        var duration = 950;
        var start = base + 240 + i * 120;
        var at = function (x) { return start + duration * Math.max(0, Math.min(1, x / travel)); };

        trackAnim(before.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
          { duration: 600, delay: base + i * 70, easing: EASE_OUT, fill: 'both' }));
        trackAnim(before.animate([{ color: '#F6F7F8' }, { color: '#A8ACC4' }],
          { duration: 420, delay: at(before.offsetLeft + before.offsetWidth * 0.5), easing: 'ease', fill: 'both' }));
        trackAnim(scan.animate([
          { transform: 'translateX(' + (-scanWidth) + 'px)', opacity: 0 },
          { opacity: 1, offset: 0.08 },
          { opacity: 1, offset: 0.88 },
          { transform: 'translateX(' + rowWidth + 'px)', opacity: 0 }
        ], { duration: duration, delay: start, easing: 'linear', fill: 'both' }));
        trackAnim(arrow.animate([{ opacity: 0, transform: 'translateX(-6px)' }, { opacity: 1, transform: 'none' }],
          { duration: 400, delay: at(arrow.offsetLeft), easing: EASE_OUT, fill: 'both' }));
        var revealStart = at(after.offsetLeft + scanWidth * 0.2);
        var revealEnd = at(after.offsetLeft + after.offsetWidth + scanWidth * 0.2);
        trackAnim(after.animate([{ clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% 0% -10% 0)' }],
          { duration: Math.max(200, revealEnd - revealStart), delay: revealStart, easing: 'linear', fill: 'both' }));
      });

      toArray(detail.querySelectorAll('.td-list--before li')).forEach(function (li, i) {
        trackAnim(li.animate(rise, { duration: 600, delay: base + i * 80, easing: EASE_OUT, fill: 'both' }));
      });
      toArray(detail.querySelectorAll('.td-list--after li')).forEach(function (li, i) {
        trackAnim(li.animate([{ clipPath: 'inset(-10% 100% -10% 0)', opacity: 0.4 }, { clipPath: 'inset(-10% 0% -10% 0)', opacity: 1 }],
          { duration: 700, delay: base + 320 + i * 140, easing: EASE_PORTAL, fill: 'both' }));
      });
    };

    /* geometria do portal: um círculo do tamanho do nó, no lugar do nó */
    var portalGeometry = function (node) {
      var n = node.getBoundingClientRect();
      var p = detail.getBoundingClientRect();
      var cx = n.left + n.width / 2 - p.left;
      var cy = n.top + n.height / 2 - p.top;
      var far = Math.max(
        Math.hypot(cx, cy), Math.hypot(p.width - cx, cy),
        Math.hypot(cx, p.height - cy), Math.hypot(p.width - cx, p.height - cy)
      );
      var at = ' at ' + cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px)';
      return { from: 'circle(' + (n.width / 2).toFixed(1) + 'px' + at, to: 'circle(' + Math.ceil(far + 2) + 'px' + at };
    };

    var focusCamera = function (key) {
      var node = nodeFor(key);
      if (!triWrap || !node) return;
      triWrap.style.setProperty('--fx', node.style.getPropertyValue('--tx'));
      triWrap.style.setProperty('--fy', node.style.getPropertyValue('--ty'));
      triWrap.classList.add('is-focus');
      nodes.forEach(function (n) { n.classList.toggle('is-focused', n === node); });
    };

    var releaseCamera = function () {
      if (!triWrap) return;
      triWrap.classList.remove('is-focus');
      nodes.forEach(function (n) { n.classList.remove('is-focused'); });
    };

    var syncStep = function (key) {
      if (!(storyState.pinned && storyState.trigger)) return;
      var index = keys.indexOf(key);
      if (index > -1 && index !== storyState.index) {
        window.scrollTo({ top: storyState.positionFor(index), behavior: 'auto' });
        setStep(index);
      }
    };

    var finishClose = function () {
      cancelAnims();
      detail.hidden = true;
      detail.style.clipPath = '';
      detail.style.transform = '';
      detail.classList.remove('is-sheet');
      document.body.classList.remove('detail-open');
      detailState.closing = null;
    };

    var openDetail = function (key, trigger) {
      if (!DETAILS[key] || !detail) return;
      if (detailState.open) {
        if (detailState.key === key) return;
        switchDetail(key, trigger);
        return;
      }
      if (detailState.closing) {
        detailState.closing.cancel();
        finishClose();
      }

      var node = nodeFor(key);
      var sheet = !storyState.pinned;
      syncStep(key);
      detailState.open = true;
      detailState.key = key;
      detailState.trigger = trigger || node;

      renderDetail(key);
      detail.classList.toggle('is-sheet', sheet);
      document.body.classList.toggle('detail-open', sheet);
      if (stepsWrap) stepsWrap.classList.add('has-detail');

      if (!motionOk) {
        detail.hidden = false;
        trackAnim(detail.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease' }));
        detailTitle.focus({ preventScroll: true });
        return;
      }

      detail.style.clipPath = 'circle(0px at -9999px -9999px)';
      detail.hidden = false;
      var geo = portalGeometry(node);
      focusCamera(key);
      trackAnim(detail.animate([{ clipPath: geo.from }, { clipPath: geo.to }],
        { duration: sheet ? 820 : 950, delay: 140, easing: EASE_PORTAL, fill: 'both' }));
      choreograph(sheet ? 520 : 600);
      detailTitle.focus({ preventScroll: true });
    };

    var switchDetail = function (key, trigger) {
      detailState.key = key;
      detailState.trigger = trigger || nodeFor(key);
      syncStep(key);
      focusCamera(key);
      if (!motionOk) {
        renderDetail(key);
        detailTitle.focus({ preventScroll: true });
        return;
      }
      window.clearTimeout(detailState.timer);
      var out = detailInner.animate([{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(6px)' }],
        { duration: 160, easing: 'ease', fill: 'forwards' });
      detailState.timer = window.setTimeout(function () {
        cancelAnims();
        renderDetail(key);
        out.cancel();
        trackAnim(detailInner.animate([{ opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)' }],
          { duration: 360, easing: 'ease' }));
        detail.style.clipPath = '';
        choreograph(140);
        detailTitle.focus({ preventScroll: true });
      }, 160);
    };

    var closeDetail = function (options) {
      options = options || {};
      if (!detailState.open) return;
      detailState.open = false;
      window.clearTimeout(detailState.timer);
      var node = nodeFor(detailState.key);
      var trigger = detailState.trigger;
      releaseCamera();
      if (stepsWrap) stepsWrap.classList.remove('has-detail');

      if (options.instant || !motionOk) {
        if (!options.instant) {
          var fade = detail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease' });
          detailState.closing = fade;
          fade.onfinish = finishClose;
        } else {
          finishClose();
        }
      } else if (options.drag) {
        var from = detail.style.transform || 'translateY(0px)';
        cancelAnims();
        var slide = detail.animate([{ transform: from }, { transform: 'translateY(100%)' }], { duration: 280, easing: EASE_OUT, fill: 'forwards' });
        detailState.closing = slide;
        slide.onfinish = finishClose;
      } else {
        var geo = portalGeometry(node);
        cancelAnims();
        var collapse = detail.animate([{ clipPath: geo.to }, { clipPath: geo.from }],
          { duration: 420, easing: 'cubic-bezier(0.7, 0, 0.84, 0)', fill: 'forwards' });
        detailState.closing = collapse;
        collapse.onfinish = finishClose;
      }

      if (options.returnFocus && trigger && typeof trigger.focus === 'function') {
        trigger.focus({ preventScroll: true });
      }
    };

    storyState.closeDetail = closeDetail;
    storyState.detailKey = function () { return detailState.open ? detailState.key : null; };

    nodes.forEach(function (node) {
      node.addEventListener('click', function () {
        var key = node.getAttribute('data-tri-node');
        if (detailState.open && detailState.key === key) closeDetail({ returnFocus: true });
        else openDetail(key, node);
      });
    });

    toArray(story.querySelectorAll('[data-detail-open]')).forEach(function (button) {
      button.addEventListener('click', function () {
        openDetail(button.getAttribute('data-detail-open'), button);
      });
    });

    if (detail) {
      detail.querySelector('[data-td-close]').addEventListener('click', function () {
        closeDetail({ returnFocus: true });
      });

      document.addEventListener('click', function (event) {
        if (!detailState.open) return;
        if (detail.contains(event.target)) return;
        if (event.target.closest('[data-tri-node], [data-detail-open]')) return;
        closeDetail();
      });

      document.addEventListener('keydown', function (event) {
        if (!detailState.open) return;
        if (event.key === 'Escape') {
          closeDetail({ returnFocus: true });
          return;
        }
        if (event.key === 'Tab') {
          var focusable = toArray(detail.querySelectorAll('button, a[href]'));
          var first = focusable[0];
          var last = focusable[focusable.length - 1];
          if (!detail.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
          } else if (event.shiftKey && (document.activeElement === first || document.activeElement === detailTitle)) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      });

      /* celular: arrastar para baixo fecha; para cima resiste */
      var drag = null;
      detail.addEventListener('pointerdown', function (event) {
        if (!detail.classList.contains('is-sheet') || !detailState.open || drag) return;
        if (!event.target.closest('.td-grabber, .td-head') || event.target.closest('button')) return;
        drag = { y: event.clientY, t: performance.now(), dy: 0, id: event.pointerId };
        detail.setPointerCapture(event.pointerId);
      });
      detail.addEventListener('pointermove', function (event) {
        if (!drag || event.pointerId !== drag.id) return;
        var dy = event.clientY - drag.y;
        drag.dy = dy < 0 ? dy * 0.15 : dy;
        detail.style.transform = 'translateY(' + drag.dy.toFixed(1) + 'px)';
      });
      var endDrag = function (event) {
        if (!drag || event.pointerId !== drag.id) return;
        var distance = drag.dy;
        var velocity = Math.abs(distance) / Math.max(1, performance.now() - drag.t);
        drag = null;
        if (distance > 120 || (distance > 16 && velocity > 0.11)) {
          closeDetail({ drag: true, returnFocus: true });
        } else {
          detail.animate([{ transform: 'translateY(' + distance + 'px)' }, { transform: 'translateY(0px)' }], { duration: 320, easing: EASE_OUT });
          detail.style.transform = '';
        }
      };
      detail.addEventListener('pointerup', endDrag);
      detail.addEventListener('pointercancel', endDrag);
    }

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
        storyState.closeDetail({ instant: true });
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
            var openKey = storyState.detailKey();
            if (openKey && keys[storyState.index] !== openKey) storyState.closeDetail();
            if (outer) outer.style.strokeDashoffset = String(Math.max(0, 1 - p * 1.2));
          }
        });
        if (outer) outer.style.strokeDashoffset = '1';

        return function () {
          storyState.closeDetail({ instant: true });
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
