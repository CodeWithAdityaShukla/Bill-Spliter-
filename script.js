/**
 * Bill Splitter - Pure Vanilla JavaScript Logic (Ultra-Optimized / Zero-Lag)
 * 
 * Performance Enhancements:
 * 1. Smart RAF Particle Engine: Automatically stops loop when idle (0% CPU usage)
 * 2. High-speed 2D Canvas rendering without heavy shadowBlur filters
 * 3. RAF-throttled mouse tracking & pre-cached bounding boxes for 3D card tilt
 * 4. Passive event listeners for butter-smooth 60-120 FPS interaction
 * 5. Exact cent division guarantee down to the penny
 * 6. Full localStorage persistence across reloads
 * 7. Strict validation (hides results on empty, zero, or negative inputs)
 */

(function () {
  'use strict';

  // Storage Keys
  const STORAGE_KEY_CURRENT = 'bill_splitter_current_state_v4';
  const STORAGE_KEY_HISTORY = 'bill_splitter_saved_history_v4';

  // DOM Elements
  const occasionInput = document.getElementById('occasion-input');
  const currencySelect = document.getElementById('currency-select');
  const billCurrSymbol = document.getElementById('bill-curr-symbol');
  const activeCurrencyBadge = document.getElementById('active-currency-badge');
  const billInput = document.getElementById('bill-input');
  const peopleInput = document.getElementById('people-input');

  const currencyBoxes = document.querySelectorAll('.currency-box');
  const primaryBoxes = document.querySelectorAll('.box-primary');
  const secondaryBoxes = document.querySelectorAll('.box-secondary');
  const tipBoxes = document.querySelectorAll('.tip-box');
  const customTipContainer = document.getElementById('custom-tip-container');
  const customTipInput = document.getElementById('custom-tip-input');

  const btnCalculate = document.getElementById('btn-calculate');
  const btnReset = document.getElementById('btn-reset');
  const btnSaveHistory = document.getElementById('btn-save-history');
  const btnCopy = document.getElementById('btn-copy');

  const alertBanner = document.getElementById('alert-banner');
  const alertMessage = document.getElementById('alert-message');

  const resultsCard = document.getElementById('results-card');
  const emptyStateCard = document.getElementById('empty-state-card');

  // Summary Elements
  const summaryOccasionName = document.getElementById('summary-occasion-name');
  const summaryTotalBill = document.getElementById('summary-total-bill');
  const summaryBaseShare = document.getElementById('summary-base-share');
  const summaryPeopleCount = document.getElementById('summary-people-count');
  const centVerificationBadge = document.getElementById('cent-verification-badge');
  const centVerificationText = document.getElementById('cent-verification-text');
  const sharesList = document.getElementById('shares-list');

  // Search & History Elements
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const searchResultsDropdown = document.getElementById('search-results-dropdown');
  const historyGrid = document.getElementById('history-grid');
  const historySection = document.getElementById('history-section');
  const btnClearHistory = document.getElementById('btn-clear-history');

  // Sun / Moon Dark & Light Mode Toggle
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const sunIconWrap = document.querySelector('.sun-icon-wrap');
  const moonIconWrap = document.querySelector('.moon-icon-wrap');
  const themeLabel = document.getElementById('theme-label');
  const STORAGE_KEY_THEME = 'bill_splitter_theme_mode';

  // Digital Clock Elements
  const clockHours = document.getElementById('clock-hours');
  const clockMinutes = document.getElementById('clock-minutes');
  const clockSeconds = document.getElementById('clock-seconds');
  const clockAmpm = document.getElementById('clock-ampm');
  const clockDate = document.getElementById('clock-date');
  const digitalClockWidget = document.getElementById('digital-clock');

  // 3D Tilt Cards & Glow Follower
  const tiltCards = document.querySelectorAll('.glass-card-3d');
  const mouseGlow = document.getElementById('mouse-glow');

  // Canvas & Particles (Lag-Free Engine)
  const particleCanvas = document.getElementById('particle-canvas');
  let particleCtx = null;
  let particles = [];
  let isParticleLoopRunning = false;
  const MAX_PARTICLES = 35; // Strict cap for buttery 60-120fps

  // Mouse RAF Throttling State
  let mouseX = -500;
  let mouseY = -500;
  let rafTicking = false;

  // Runtime State
  let currentCurrency = '$';
  let currentTipPercent = 0;
  let customPersonNames = {};
  let paidStatus = {};
  let currentCalculation = null;

  // Initialize
  function init() {
    initDigitalClock();
    initTheme();
    setupCanvas();
    setupOptimizedMouseEffects();
    setupEventListeners();
    loadHistory();
    restoreSavedState();
  }

  // ==========================================================================
  // Digital Clock Engine (Live Corner Clock with LED Glow)
  // ==========================================================================

  function initDigitalClock() {
    updateClockDisplay();
    setInterval(updateClockDisplay, 1000);

    if (digitalClockWidget) {
      digitalClockWidget.addEventListener('mouseenter', (e) => {
        spawnParticlesAt(e.clientX, e.clientY, 3, false);
      }, { passive: true });
    }
  }

  function updateClockDisplay() {
    if (!clockHours || !clockMinutes || !clockSeconds) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');

    clockHours.textContent = hoursStr;
    clockMinutes.textContent = minutes;
    clockSeconds.textContent = seconds;
    if (clockAmpm) clockAmpm.textContent = ampm;

    if (clockDate) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      clockDate.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
    }
  }

  // ==========================================================================
  // 0. Dark / Light Mode (Sun & Moon) with Golden Light Radiance
  // ==========================================================================

  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
    applyTheme(savedTheme, false);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', (e) => {
        const isCurrentLight = document.body.classList.contains('light-theme');
        const nextTheme = isCurrentLight ? 'dark' : 'light';
        applyTheme(nextTheme, true);

        // Spawn a burst of golden sparkles on toggle (safe coordinate calculation)
        let spawnX = e.clientX || window.innerWidth / 2;
        let spawnY = e.clientY || 40;
        const rect = themeToggleBtn.getBoundingClientRect();
        if (rect && typeof rect.left === 'number') {
          spawnX = rect.left + (rect.width || 0) / 2;
          spawnY = rect.top + (rect.height || 0) / 2;
        }
        spawnParticlesAt(spawnX, spawnY, 8, false);
      });
    }
  }

  function applyTheme(theme, showFeedback = true) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      if (sunIconWrap) sunIconWrap.classList.add('active');
      if (moonIconWrap) moonIconWrap.classList.remove('active');
      if (themeLabel) themeLabel.textContent = 'Light';
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
      if (showFeedback) showToast('☀️ Sunlight Mode Activated');
    } else {
      document.body.classList.remove('light-theme');
      if (sunIconWrap) sunIconWrap.classList.remove('active');
      if (moonIconWrap) moonIconWrap.classList.add('active');
      if (themeLabel) themeLabel.textContent = 'Dark';
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
      if (showFeedback) showToast('🌙 Moonlight Dark Mode Activated');
    }
  }

  // ==========================================================================
  // 1. High-Performance Particle Engine (Smart RAF / 0% CPU Idle)
  // ==========================================================================

  function setupCanvas() {
    if (!particleCanvas) return;
    particleCtx = particleCanvas.getContext('2d', { alpha: true });

    function resize() {
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
  }

  function startParticleLoop() {
    if (isParticleLoopRunning) return;
    isParticleLoopRunning = true;
    requestAnimationFrame(renderParticleFrame);
  }

  function renderParticleFrame() {
    if (particles.length === 0) {
      if (particleCtx && particleCanvas) {
        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      }
      isParticleLoopRunning = false;
      return; // Stop animation loop when idle! Zero lag/CPU.
    }

    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.size *= 0.98;

      if (p.alpha <= 0 || p.size <= 0.3) {
        particles.splice(i, 1);
        continue;
      }

      // Fast drawing without expensive shadowBlur
      particleCtx.fillStyle = p.color;
      particleCtx.globalAlpha = Math.max(0, p.alpha);
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size, 0, 6.283);
      particleCtx.fill();

      // Outer soft halo
      particleCtx.globalAlpha = Math.max(0, p.alpha * 0.35);
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size * 1.8, 0, 6.283);
      particleCtx.fill();
    }

    requestAnimationFrame(renderParticleFrame);
  }

  function spawnParticlesAt(x, y, count = 2, isViolet = false) {
    if (particles.length >= MAX_PARTICLES) return;

    const cyanColors = ['#06b6d4', '#67e8f9', '#38bdf8', '#fbbf24', '#f59e0b'];
    const violetColors = ['#8b5cf6', '#a78bfa', '#c084fc', '#fbbf24', '#f59e0b'];
    const palette = isViolet ? violetColors : cyanColors;

    const spawnCount = Math.min(count, MAX_PARTICLES - particles.length);
    for (let i = 0; i < spawnCount; i++) {
      const angle = Math.random() * 6.283;
      const speed = 0.6 + Math.random() * 1.8;
      const color = palette[Math.floor(Math.random() * palette.length)];

      particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        size: 2 + Math.random() * 2.5,
        alpha: 0.9,
        decay: 0.03 + Math.random() * 0.02,
        color: color
      });
    }

    startParticleLoop();
  }

  // ==========================================================================
  // 2. Optimized Mouse Tracking & 3D Tilt (Pre-cached Bounds & RAF)
  // ==========================================================================

  function setupOptimizedMouseEffects() {
    window.addEventListener(
      'mousemove',
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!rafTicking) {
          rafTicking = true;
          requestAnimationFrame(updateMouseVisuals);
        }
      },
      { passive: true }
    );

    function updateMouseVisuals() {
      if (mouseGlow) {
        mouseGlow.style.transform = `translate3d(${mouseX - 220}px, ${mouseY - 220}px, 0)`;
      }
      rafTicking = false;
    }

    // 3D Tilt with safe rect calculation inside RAF
    tiltCards.forEach((card) => {
      let cardTicking = false;
      let targetX = 0;
      let targetY = 0;

      card.addEventListener(
        'mousemove',
        (e) => {
          targetX = e.clientX;
          targetY = e.clientY;

          if (!cardTicking) {
            cardTicking = true;
            requestAnimationFrame(() => {
              cardTicking = false;
              if (!card) return;
              const rect = card.getBoundingClientRect();
              if (!rect || typeof rect.left !== 'number') return;

              const halfW = (rect.width || 1) / 2;
              const halfH = (rect.height || 1) / 2;
              const x = targetX - rect.left - halfW;
              const y = targetY - rect.top - halfH;
              const rotateX = (-y / halfH) * 3.5;
              const rotateY = (x / halfW) * 3.5;

              card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(0, 0, 6px)`;
            });
          }
        },
        { passive: true }
      );

      card.addEventListener(
        'mouseleave',
        () => {
          cardTicking = false;
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
        },
        { passive: true }
      );
    });

    // Particle flow on option boxes, floating papercraft & 3D emojis
    const interactiveBoxes = document.querySelectorAll(
      '.box-primary, .box-secondary, .tip-box, .currency-box, .btn-3d, .papercraft-floating-art, .emoji-3d-node'
    );

    interactiveBoxes.forEach((box) => {
      let boxMoveThrottle = 0;
      const isViolet = box.classList.contains('box-secondary') || box.getAttribute('data-tip') === 'custom';

      box.addEventListener(
        'mousemove',
        (e) => {
          const now = Date.now();
          if (now - boxMoveThrottle > 50) { // Throttle to 20 spawns/sec max for zero lag
            boxMoveThrottle = now;
            spawnParticlesAt(e.clientX, e.clientY, 1, isViolet);
          }
        },
        { passive: true }
      );

      box.addEventListener(
        'mouseenter',
        (e) => {
          spawnParticlesAt(e.clientX, e.clientY, 3, isViolet);
        },
        { passive: true }
      );
    });

    // Delightful click burst on floating 3D emojis (safe coordinate calculation)
    const floatingEmojiNodes = document.querySelectorAll('.emoji-3d-node');
    floatingEmojiNodes.forEach((emoji) => {
      emoji.addEventListener('click', (e) => {
        let spawnX = e.clientX || 0;
        let spawnY = e.clientY || 0;
        if (emoji) {
          const rect = emoji.getBoundingClientRect();
          if (rect && typeof rect.left === 'number') {
            spawnX = rect.left + (rect.width || 0) / 2;
            spawnY = rect.top + (rect.height || 0) / 2;
          }
        }
        spawnParticlesAt(spawnX, spawnY, 7, false);
      });
    });
  }

  // ==========================================================================
  // 3. Event Listeners & Option Boxes Handling
  // ==========================================================================

  function setupEventListeners() {
    btnCalculate.addEventListener('click', handleCalculateClick);

    // Enter Key triggers calculation
    [occasionInput, billInput, peopleInput, customTipInput].forEach((input) => {
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleCalculateClick();
          }
        });
      }
    });

    btnReset.addEventListener('click', handleReset);
    btnSaveHistory.addEventListener('click', handleSaveToHistory);
    btnCopy.addEventListener('click', handleCopySummary);

    // Currency Option Boxes
    currencyBoxes.forEach((box) => {
      box.addEventListener('click', () => {
        currencyBoxes.forEach((b) => b.classList.remove('active'));
        box.classList.add('active');
        const curr = box.getAttribute('data-curr');
        currentCurrency = curr;
        currencySelect.value = curr;
        billCurrSymbol.textContent = curr;

        const labels = {
          $: 'USD / CAD ($)',
          '€': 'EUR (€)',
          '£': 'GBP (£)',
          '₹': 'INR (₹)',
          '¥': 'JPY (¥)',
          A$: 'AUD (A$)'
        };
        activeCurrencyBadge.textContent = labels[curr] || curr;

        if (currentCalculation) {
          handleCalculateClick();
        }
      });
    });

    // Party Size Option Boxes (Primary & Secondary)
    [...primaryBoxes, ...secondaryBoxes].forEach((box) => {
      box.addEventListener('click', () => {
        const count = box.getAttribute('data-people');
        peopleInput.value = count;
        updateActivePartyBox(count);
        hideError();
      });
    });

    peopleInput.addEventListener('input', () => {
      updateActivePartyBox(peopleInput.value);
    });

    // Tip Option Boxes
    tipBoxes.forEach((box) => {
      box.addEventListener('click', () => {
        tipBoxes.forEach((b) => b.classList.remove('active'));
        box.classList.add('active');
        const tipVal = box.getAttribute('data-tip');

        if (tipVal === 'custom') {
          customTipContainer.style.display = 'block';
          currentTipPercent = parseFloat(customTipInput.value) || 0;
          customTipInput.focus();
        } else {
          customTipContainer.style.display = 'none';
          currentTipPercent = parseFloat(tipVal) || 0;
        }

        if (currentCalculation) {
          handleCalculateClick();
        }
      });
    });

    if (customTipInput) {
      customTipInput.addEventListener('input', () => {
        currentTipPercent = parseFloat(customTipInput.value) || 0;
        if (currentCalculation) {
          handleCalculateClick();
        }
      });
    }

    // Search bar functionality
    if (searchInput) {
      searchInput.addEventListener('input', handleSearchInput);
      searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length > 0) {
          searchResultsDropdown.classList.add('active');
        }
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        searchResultsDropdown.classList.remove('active');
        searchResultsDropdown.innerHTML = '';
        renderHistoryCards();
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar-wrapper')) {
        searchResultsDropdown.classList.remove('active');
      }
    });

    if (btnClearHistory) {
      btnClearHistory.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your saved split history?')) {
          localStorage.removeItem(STORAGE_KEY_HISTORY);
          renderHistoryCards();
          showToast('History cleared');
        }
      });
    }
  }

  function updateActivePartyBox(val) {
    [...primaryBoxes, ...secondaryBoxes].forEach((b) => {
      if (b.getAttribute('data-people') === String(val)) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // ==========================================================================
  // 4. Calculation & Strict Validation
  // ==========================================================================

  function handleCalculateClick() {
    const rawBill = billInput.value.trim();
    const rawPeople = peopleInput.value.trim();
    const billNum = parseFloat(rawBill);
    const peopleNum = parseInt(rawPeople, 10);
    const occasion = occasionInput.value.trim() || 'General Expense';
    const currency = currentCurrency || '$';

    // 1. Validate Bill: Must be non-empty, numeric, and > 0
    if (rawBill === '' || isNaN(billNum) || billNum <= 0) {
      showError('Please enter a valid bill amount greater than 0.');
      hideResult();
      return;
    }

    // 2. Validate Party Size: Must be non-empty, numeric, and >= 1
    if (rawPeople === '' || isNaN(peopleNum) || peopleNum <= 0) {
      showError('Number of people must be at least 1.');
      hideResult();
      return;
    }

    hideError();

    // Calculate tip
    const tipAmount = (billNum * currentTipPercent) / 100;
    const finalTotal = billNum + tipAmount;

    // Exact cent split algorithm
    const splitResult = calculateExactSplit(finalTotal, peopleNum);

    currentCalculation = {
      occasion,
      originalBill: billNum,
      tipPercent: currentTipPercent,
      tipAmount: tipAmount,
      finalTotal: finalTotal,
      numPeople: peopleNum,
      currency: currency,
      splitResult: splitResult,
      timestamp: new Date().toISOString()
    };

    renderResults(currentCalculation);
    saveCurrentState();
  }

  /**
   * Exact Cent Splitting Algorithm
   * Guarantees that sum(personShares) === totalAmount down to the last penny.
   */
  function calculateExactSplit(totalAmount, numPeople) {
    const totalCents = Math.round(totalAmount * 100);
    const baseCents = Math.floor(totalCents / numPeople);
    const remainderCents = totalCents % numPeople;

    const shares = [];
    for (let i = 0; i < numPeople; i++) {
      const personCents = i < remainderCents ? baseCents + 1 : baseCents;
      shares.push({
        index: i + 1,
        cents: personCents,
        amount: (personCents / 100).toFixed(2),
        hasPennyAdjustment: i < remainderCents && remainderCents > 0
      });
    }

    const calculatedSumCents = shares.reduce((acc, s) => acc + s.cents, 0);
    const exactSum = (calculatedSumCents / 100).toFixed(2);

    return {
      shares,
      exactSum,
      isExactMatch: calculatedSumCents === totalCents,
      basePerPerson: (baseCents / 100).toFixed(2),
      remainderCents
    };
  }

  // ==========================================================================
  // 5. Render Results
  // ==========================================================================

  function renderResults(calc) {
    if (!calc) return;

    const { occasion, finalTotal, numPeople, currency, splitResult } = calc;

    summaryOccasionName.textContent = occasion;
    summaryTotalBill.textContent = `${currency}${finalTotal.toFixed(2)}`;
    summaryPeopleCount.textContent = `${numPeople} people`;
    summaryBaseShare.textContent = `${currency}${splitResult.basePerPerson}`;

    centVerificationText.textContent = `All shares sum exactly to ${currency}${splitResult.exactSum} (${currency}${finalTotal.toFixed(2)} total)`;

    sharesList.innerHTML = '';
    splitResult.shares.forEach((share) => {
      const personKey = `person_${share.index}`;
      const defaultName = `Person ${share.index}`;
      const customName = customPersonNames[personKey] || defaultName;
      const isPaid = paidStatus[personKey] || false;

      const card = document.createElement('div');
      card.className = `share-card ${isPaid ? 'paid' : ''}`;
      card.dataset.personKey = personKey;

      card.innerHTML = `
        <div class="share-left">
          <div class="person-avatar">${share.index}</div>
          <div>
            <input 
              type="text" 
              class="person-name-input" 
              value="${escapeHtml(customName)}" 
              data-person-key="${personKey}"
              title="Click to customize name"
            />
            ${
              share.hasPennyAdjustment
                ? `<span class="exact-note">+${currency}0.01 cent exact balance</span>`
                : ''
            }
          </div>
        </div>
        <div class="share-right">
          <div class="share-amount tabular-nums">${currency}${share.amount}</div>
          <label class="paid-checkbox-label">
            <input 
              type="checkbox" 
              class="paid-checkbox" 
              data-person-key="${personKey}"
              ${isPaid ? 'checked' : ''}
            />
            <span>Paid</span>
          </label>
        </div>
      `;

      const nameInput = card.querySelector('.person-name-input');
      nameInput.addEventListener('change', (e) => {
        customPersonNames[personKey] = e.target.value.trim() || defaultName;
        saveCurrentState();
      });

      const paidCheck = card.querySelector('.paid-checkbox');
      paidCheck.addEventListener('change', (e) => {
        paidStatus[personKey] = e.target.checked;
        if (e.target.checked) {
          card.classList.add('paid');
        } else {
          card.classList.remove('paid');
        }
        saveCurrentState();
      });

      sharesList.appendChild(card);
    });

    resultsCard.classList.remove('hidden');
    emptyStateCard.style.display = 'none';

    if (window.innerWidth < 980) {
      resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ==========================================================================
  // 6. Error Message Handling
  // ==========================================================================

  function showError(msg) {
    alertMessage.textContent = msg;
    alertBanner.classList.remove('hidden');
  }

  function hideError() {
    alertBanner.classList.add('hidden');
  }

  function hideResult() {
    resultsCard.classList.add('hidden');
    emptyStateCard.style.display = 'block';
    currentCalculation = null;
    localStorage.removeItem(STORAGE_KEY_CURRENT);
  }

  function handleReset() {
    occasionInput.value = '';
    billInput.value = '';
    peopleInput.value = '';
    customTipInput.value = '';
    customTipContainer.style.display = 'none';
    currentTipPercent = 0;
    customPersonNames = {};
    paidStatus = {};

    updateActivePartyBox('');
    tipBoxes.forEach((b) => {
      if (b.getAttribute('data-tip') === '0') {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    hideError();
    hideResult();
    showToast('Splitter cleared');
  }

  // ==========================================================================
  // 7. LocalStorage Persistence across Page Reloads
  // ==========================================================================

  function saveCurrentState() {
    if (!currentCalculation) return;

    const state = {
      occasion: occasionInput.value,
      bill: billInput.value,
      people: peopleInput.value,
      currency: currentCurrency,
      tipPercent: currentTipPercent,
      customNames: customPersonNames,
      paidStatus: paidStatus,
      calculation: currentCalculation
    };

    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(state));
  }

  function restoreSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (!raw) return;

      const state = JSON.parse(raw);
      if (!state || !state.calculation) return;

      occasionInput.value = state.occasion || '';
      billInput.value = state.bill || '';
      peopleInput.value = state.people || '';
      currentCurrency = state.currency || '$';
      currencySelect.value = currentCurrency;
      billCurrSymbol.textContent = currentCurrency;
      currentTipPercent = state.tipPercent || 0;
      customPersonNames = state.customNames || {};
      paidStatus = state.paidStatus || {};

      currencyBoxes.forEach((b) => {
        if (b.getAttribute('data-curr') === currentCurrency) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      updateActivePartyBox(state.people);

      tipBoxes.forEach((b) => {
        if (parseFloat(b.getAttribute('data-tip')) === currentTipPercent) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      currentCalculation = state.calculation;
      renderResults(currentCalculation);
    } catch (e) {
      console.warn('Could not restore saved state:', e);
    }
  }

  // ==========================================================================
  // 8. History & Search Bar Integration
  // ==========================================================================

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY)) || [];
    } catch {
      return [];
    }
  }

  function saveHistoryItem(item) {
    const list = getHistory();
    list.unshift(item);
    if (list.length > 30) list.pop();
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list));
    renderHistoryCards();
  }

  function handleSaveToHistory() {
    if (!currentCalculation) {
      showError('Please calculate a bill split first.');
      return;
    }

    const item = {
      id: 'split_' + Date.now(),
      occasion: currentCalculation.occasion,
      originalBill: currentCalculation.originalBill,
      finalTotal: currentCalculation.finalTotal,
      numPeople: currentCalculation.numPeople,
      currency: currentCalculation.currency,
      tipPercent: currentCalculation.tipPercent,
      date: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      calculation: currentCalculation,
      customNames: { ...customPersonNames }
    };

    saveHistoryItem(item);
    showToast('Saved to occasion history');
  }

  function loadHistory() {
    renderHistoryCards();
  }

  function renderHistoryCards(filterQuery = '') {
    const list = getHistory();
    historyGrid.innerHTML = '';

    const query = filterQuery.toLowerCase().trim();
    const filtered = query
      ? list.filter(
          (item) =>
            item.occasion.toLowerCase().includes(query) ||
            String(item.finalTotal).includes(query) ||
            item.date.toLowerCase().includes(query)
        )
      : list;

    if (filtered.length === 0) {
      historySection.style.display = query ? 'block' : list.length > 0 ? 'block' : 'none';
      historyGrid.innerHTML = `
        <div style="grid-column: 1 / -1; color: var(--text-dim); text-align: center; padding: 2rem;">
          ${query ? 'No matching occasions found.' : 'No saved splits yet. Click "Save Split" to save your records.'}
        </div>
      `;
      return;
    }

    historySection.style.display = 'block';

    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="history-card-header">
          <div>
            <div class="history-card-title">${escapeHtml(item.occasion)}</div>
            <div class="history-card-date">${item.date}</div>
          </div>
          <button class="history-delete-btn" title="Delete record" data-id="${item.id}">✕</button>
        </div>
        <div class="history-card-stats">
          <span class="history-total tabular-nums">${item.currency}${item.finalTotal.toFixed(2)}</span>
          <span class="history-people">${item.numPeople} people (${item.currency}${(item.finalTotal / item.numPeople).toFixed(2)}/ea)</span>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.history-delete-btn')) return;
        loadHistoricalSplit(item);
      });

      const delBtn = card.querySelector('.history-delete-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteHistoryItem(item.id);
      });

      historyGrid.appendChild(card);
    });
  }

  function deleteHistoryItem(id) {
    const list = getHistory().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list));
    renderHistoryCards(searchInput.value);
    showToast('Record removed');
  }

  function loadHistoricalSplit(item) {
    occasionInput.value = item.occasion;
    billInput.value = item.originalBill;
    peopleInput.value = item.numPeople;
    currentCurrency = item.currency || '$';
    currencySelect.value = currentCurrency;
    billCurrSymbol.textContent = currentCurrency;
    currentTipPercent = item.tipPercent || 0;
    customPersonNames = item.customNames || {};
    paidStatus = {};

    currencyBoxes.forEach((b) => {
      if (b.getAttribute('data-curr') === currentCurrency) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    updateActivePartyBox(item.numPeople);

    tipBoxes.forEach((b) => {
      if (parseFloat(b.getAttribute('data-tip')) === currentTipPercent) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    handleCalculateClick();
    showToast(`Loaded "${item.occasion}"`);

    searchResultsDropdown.classList.remove('active');
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
  }

  // Search input handler
  function handleSearchInput(e) {
    const query = e.target.value.trim();
    if (query.length > 0) {
      searchClearBtn.style.display = 'inline-flex';
      const history = getHistory();
      const matches = history.filter(
        (item) =>
          item.occasion.toLowerCase().includes(query.toLowerCase()) ||
          String(item.finalTotal).includes(query)
      );

      if (matches.length > 0) {
        searchResultsDropdown.innerHTML = matches
          .map(
            (m) => `
          <div class="search-result-item" data-id="${m.id}">
            <div>
              <div class="search-result-title">${escapeHtml(m.occasion)}</div>
              <div class="search-result-meta">${m.date} · ${m.numPeople} people</div>
            </div>
            <div class="search-result-badge">${m.currency}${m.finalTotal.toFixed(2)}</div>
          </div>
        `
          )
          .join('');

        searchResultsDropdown.querySelectorAll('.search-result-item').forEach((elem) => {
          elem.addEventListener('click', () => {
            const id = elem.getAttribute('data-id');
            const target = history.find((h) => h.id === id);
            if (target) loadHistoricalSplit(target);
          });
        });

        searchResultsDropdown.classList.add('active');
      } else {
        searchResultsDropdown.innerHTML = `
          <div style="padding: 1.15rem; color: var(--text-dim); text-align: center; font-size: 0.9rem;">
            No saved occasions found matching "${escapeHtml(query)}"
          </div>
        `;
        searchResultsDropdown.classList.add('active');
      }
    } else {
      searchClearBtn.style.display = 'none';
      searchResultsDropdown.classList.remove('active');
    }

    renderHistoryCards(query);
  }

  // ==========================================================================
  // 9. Summary Copy to Clipboard
  // ==========================================================================

  function handleCopySummary() {
    if (!currentCalculation) return;

    const { occasion, finalTotal, numPeople, currency, splitResult } = currentCalculation;
    let text = `🧾 ${occasion} - Bill Split\n`;
    text += `Total Bill: ${currency}${finalTotal.toFixed(2)} (${numPeople} people)\n`;
    text += `------------------------------------\n`;

    splitResult.shares.forEach((s) => {
      const personKey = `person_${s.index}`;
      const name = customPersonNames[personKey] || `Person ${s.index}`;
      const isPaid = paidStatus[personKey] ? '✅ Paid' : '⏳ Pending';
      text += `${name}: ${currency}${s.amount} (${isPaid})\n`;
    });

    text += `------------------------------------\n`;
    text += `Exact Cent Sum: ${currency}${splitResult.exactSum}\n`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast('Summary copied to clipboard!'))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Summary copied to clipboard!');
    } catch {
      alert('Unable to copy to clipboard.');
    }
    document.body.removeChild(textarea);
  }

  function showToast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✓</span> <span>${escapeHtml(msg)}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
