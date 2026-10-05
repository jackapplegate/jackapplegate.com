function buildOdometer(el, digitCount) {
  el.innerHTML = '';
  const slots = [];
  for (let i = 0; i < digitCount; i++) {
    const remaining = digitCount - i - 1;
    const slot = document.createElement('span');
    slot.className = 'digit-slot';
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

  const target = 75356532;
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

  requestAnimationFrame(ramp);

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
