function buildOdometer(el, digitCount) {
  el.innerHTML = '';
  const slots = [];
  for (let i = 0; i < digitCount; i++) {
    const remaining = digitCount - i - 1;
    const slot = document.createElement('span');
    slot.className = 'digit-slot';
    slot.setAttribute('aria-hidden', 'true');
    const strip = document.createElement('span');
    strip.className = 'digit-strip';
    for (let n = 0; n <= 9; n++) {
      const d = document.createElement('span');
      d.className = 'digit';
      d.textContent = n;
      strip.appendChild(d);
    }
    slot.appendChild(strip);
    el.appendChild(slot);
    slots.push(strip);

    if (remaining > 0 && remaining % 3 === 0) {
      const comma = document.createElement('span');
      comma.className = 'digit-comma';
      comma.setAttribute('aria-hidden', 'true');
      comma.textContent = ',';
      el.appendChild(comma);
    }
  }
  return slots;
}

function setOdometerValue(strips, value, digitCount, animate) {
  const str = String(Math.floor(value)).padStart(digitCount, '0');
  strips.forEach((strip, i) => {
    const digit = parseInt(str[i], 10);
    strip.style.transition = animate
      ? 'transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)'
      : 'none';
    strip.style.transform = `translateY(-${digit * 1.4}em)`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const counterEl = document.getElementById('counter');
  if (!counterEl) return;

  const target = 92237156;
  const digitCount = String(target).length;
  const strips = buildOdometer(counterEl, digitCount);

  setOdometerValue(strips, 0, digitCount, false);

  const rampDuration = 1300;
  const startTime = performance.now();

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function ramp(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / rampDuration, 1);
    const eased = easeOutExpo(progress);
    const value = Math.floor(eased * target);
    setOdometerValue(strips, value, digitCount, false);

    if (progress < 1) {
      requestAnimationFrame(ramp);
    } else {
      setOdometerValue(strips, target, digitCount, false);
      scheduleTick(target, 1000, (v1) => {
        scheduleTick(v1, 2000, scheduleNextTick);
      });
    }
  }

  function scheduleTick(currentValue, delay, nextDelayFn) {
    setTimeout(() => {
      const increment = 1 + Math.floor(Math.random() * 4);
      const newValue = currentValue + increment;
      setOdometerValue(strips, newValue, digitCount, true);
      nextDelayFn(newValue);
    }, delay);
  }

  function scheduleNextTick(currentValue) {
    const delay = 9000 + Math.random() * 6000;
    scheduleTick(currentValue, delay, scheduleNextTick);
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setOdometerValue(strips, target, digitCount, false);
  } else { requestAnimationFrame(ramp); }

  const tiles = document.querySelectorAll('.project-tile');
  if (tiles.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Array.from(tiles).indexOf(entry.target);
          entry.target.style.transitionDelay = `${(index % 4) * 90}ms`;
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    tiles.forEach((tile) => observer.observe(tile));
  }
});

// Only the selected project video should play audio.
document.querySelectorAll('.project-media video').forEach(video => {
  video.addEventListener('play', () => {
    document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
  });
  video.addEventListener('error', () => {
    if (video.parentElement.querySelector('.media-error')) return;
    const message = document.createElement('p');
    message.className = 'media-error';
    message.textContent = 'Unable to play this video. ';
    const link = document.createElement('a');
    link.href = video.querySelector('source').src;
    link.textContent = 'Download the video';
    message.append(link);
    video.parentElement.append(message);
  }, true);
});

// Shared navigation and restrained motion enhancements, independent of the counter.
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('nav');
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.nav-links');
  const mobile = matchMedia('(max-width: 900px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const setMenu = open => {
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu?.classList.toggle('is-open', open);
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('click', event => { if (!nav?.contains(event.target)) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  nav?.addEventListener('focusout', event => { if (!nav.contains(event.relatedTarget)) setMenu(false); });
  mobile.addEventListener('change', () => setMenu(false));

  const brand = document.querySelector('.brand-lockup');
  if (brand && !reduced.matches && 'IntersectionObserver' in window) {
    brand.classList.add('brand-ready');
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { brand.classList.add('brand-visible'); observer.disconnect(); }
    }, { threshold: .5 });
    observer.observe(brand);
  }

  const surfaces = document.querySelectorAll('#work, .project-page, .about-content, .contact-content, .site-footer');
  surfaces.forEach(surface => {
    surface.classList.add('ambient-surface');
    const light = document.createElement('span'); light.className = 'ambient-light'; light.setAttribute('aria-hidden','true'); surface.append(light);
  });
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let lit, pointerFrame;
  const clearLight = () => { lit?.classList.remove('is-lit'); lit = null; };
  document.addEventListener('pointermove', event => {
    if (!finePointer.matches || reduced.matches) { clearLight(); return; }
    const surface = event.target.closest('.ambient-surface');
    // Limit activation to empty container space. Media and interactive/text elements never trigger light.
    const empty = event.target.matches('.ambient-surface, .work-grid, .project-gallery, .photo-gallery, .page-header, .about-photos');
    if (!surface || !empty) { clearLight(); return; }
    if (lit !== surface) { clearLight(); lit = surface; }
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      if (lit !== surface) return;
      const rect = surface.getBoundingClientRect();
      surface.style.setProperty('--light-x', `${event.clientX - rect.left}px`);
      surface.style.setProperty('--light-y', `${event.clientY - rect.top}px`);
      surface.classList.add('is-lit');
    });
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', clearLight);
  window.addEventListener('blur', clearLight);
  window.addEventListener('scroll', clearLight, { passive: true });

  const hero = document.querySelector('.hero-wrap');
  if (hero) {
    let scrollFrame;
    const updateDepth = () => {
      scrollFrame = null;
      const rect = hero.getBoundingClientRect();
      const progress = reduced.matches ? 0 : Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      hero.style.setProperty('--scroll-blur', `${(progress * 1.5).toFixed(2)}px`);
      hero.style.setProperty('--scroll-opacity', (1 - progress * .15).toFixed(3));
    };
    const queueDepth = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateDepth); };
    window.addEventListener('scroll', queueDepth, { passive: true });
    window.addEventListener('resize', queueDepth);
    reduced.addEventListener('change', queueDepth);
    updateDepth();
  }
});

// Match v17's actual pixels/second: four original nine-logo cycles per 70s.
// Adding SoFlo changes the loop length, not the established movement speed.
document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.logo-track');
  const group = track?.querySelector('.logo-group');
  if (!group) return;
  const matchOriginalSpeed = () => {
    const gap = parseFloat(getComputedStyle(group).gap) || 80;
    const originalMarks = [...group.children].filter(mark => !mark.classList.contains('soflo-logo'));
    const originalCycle = originalMarks.reduce((total, mark) => total + mark.getBoundingClientRect().width + gap, 0);
    if (originalCycle) track.style.animationDuration = `${70 * group.getBoundingClientRect().width / (4 * originalCycle)}s`;
  };
  new ResizeObserver(matchOriginalSpeed).observe(group);
  matchOriginalSpeed();
});

// Start the decorative reel as soon as mobile browsers allow muted inline video.
(() => {
  const video = document.querySelector('.hero-video');
  if (!video) return;
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  let pending = false;
  const start = () => {
    if (document.hidden || !video.paused || pending) return;
    video.muted = true;
    const attempt = video.play();
    if (attempt) {
      pending = true;
      attempt.catch(() => { /* Autoplay can be blocked by device power/data settings. */ })
        .finally(() => { pending = false; });
    }
  };
  video.addEventListener('loadeddata', start);
  video.addEventListener('canplay', start);
  window.addEventListener('pageshow', start);
  document.addEventListener('visibilitychange', start);
  // A real interaction can release autoplay restrictions; never intercept scrolling or taps.
  document.addEventListener('touchend', start, { passive: true });
  document.addEventListener('pointerup', start, { passive: true });
  document.addEventListener('keydown', start);
  start();
})();
