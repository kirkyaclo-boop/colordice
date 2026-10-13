/**
 * G PERYA - Color Dice & Wheel Game Controller
 * Faithfully replicated from http://gperya.neocities.org/
 * Incorporating user requested hex colors:
 * 1: Red    (#FF0000)
 * 2: Purple (#800080)
 * 3: Yellow (#FFFF00)
 * 4: Green  (#008000)
 * 5: Blue   (#0000FF)
 * 6: Orange (#FFA500)
 */

// User-specified colors and hex mapping
const COLOR_SPECS = {
    red:    { name: 'Red',    hex: '#FF0000', number: 1, textColor: '#FFFFFF' },
    purple: { name: 'Purple', hex: '#800080', number: 2, textColor: '#FFFFFF' },
    yellow: { name: 'Yellow', hex: '#FFFF00', number: 3, textColor: '#000000' },
    green:  { name: 'Green',  hex: '#008000', number: 4, textColor: '#FFFFFF' },
    blue:   { name: 'Blue',   hex: '#0000FF', number: 5, textColor: '#FFFFFF' },
    orange: { name: 'Orange', hex: '#FFA500', number: 6, textColor: '#000000' }
};

const validColors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
const validLightDark = ['light', 'dark', 'gray'];

const WHEEL_SEGMENT_OUTCOMES = [
    { name: 'light', color: '#FFFFFF', content: 'LIGHT', textColor: '#000000' },
    { name: 'dark',  color: '#333333', content: 'DARK',  textColor: '#FFFFFF' },
    { name: 'light', color: '#FFFFFF', content: 'LIGHT', textColor: '#000000' },
    { name: 'dark',  color: '#333333', content: 'DARK',  textColor: '#FFFFFF' },
    { name: 'light', color: '#FFFFFF', content: 'LIGHT', textColor: '#000000' },
    { name: 'dark',  color: '#333333', content: 'DARK',  textColor: '#FFFFFF' },
    { name: 'gray',  color: '#A0A0A0', content: '3X',    textColor: '#E0E0E0' }
];

const NUM_SEGMENTS = WHEEL_SEGMENT_OUTCOMES.length;
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;

// State
let numDice = 3;
let excludedItems = [];
let showNumbers = false;
let isMuted = false;
let isRollingOrSpinning = false;

const modeValues = {
    color: 3,
    lightOrDark: 3
};

// Betting State
let bettingState = {
    purse: 1000,
    selectedChip: 10,
    bets: { red: 0, purple: 0, yellow: 0, green: 0, blue: 0, orange: 0 }
};

// Audio elements with local files & Web Audio API fallback
const diceRollSound = new Audio('sounds/roll-sound.mp3');
const tickSound = new Audio('sounds/tick-sound.wav');
const winSound = new Audio('sounds/wheel-win.wav');

function playDiceRollSound() {
    if (isMuted) return;
    diceRollSound.currentTime = 0;
    diceRollSound.play().catch(() => {
        if (window.soundFX) window.soundFX.playRollSequence(1200);
    });
}

function playTickSound() {
    if (isMuted) return;
    const tickClone = tickSound.cloneNode();
    tickClone.currentTime = 0;
    tickClone.play().catch(() => {
        if (window.soundFX) window.soundFX.playDiceClick(520, 0.03, 0.4);
    });
}

function playWinSound(matches = 1) {
    if (isMuted) return;
    winSound.currentTime = 0;
    winSound.play().catch(() => {
        if (window.soundFX) window.soundFX.playWin(matches);
    });
}

// Wheel Segment Setup
function setupWheelStyles() {
    const wheelElement = document.getElementById('lightDarkWheel');
    if (!wheelElement) return;

    let gradientString = 'conic-gradient(';
    let currentAngle = 0;

    wheelElement.querySelectorAll('.segment-label').forEach(label => label.remove());

    WHEEL_SEGMENT_OUTCOMES.forEach((segment, index) => {
        const startAngle = currentAngle;
        const endAngle = currentAngle + SEGMENT_ANGLE;
        const centerAngle = startAngle + (SEGMENT_ANGLE / 2);

        gradientString += `${segment.color} ${startAngle}deg ${endAngle}deg${index < NUM_SEGMENTS - 1 ? ',' : ''}`;

        const label = document.createElement('div');
        label.className = 'segment-label';
        label.style.transform = `rotate(${centerAngle}deg)`;

        const textSpan = document.createElement('span');
        textSpan.textContent = segment.content;
        textSpan.style.color = segment.textColor;

        label.appendChild(textSpan);
        wheelElement.appendChild(label);

        currentAngle = endAngle;
    });

    gradientString += ')';
    wheelElement.style.background = gradientString;
}

// Random selection with exclusion filter
function getRandomResult(mode) {
    let baseItems = mode === 'color' ? validColors : validLightDark;
    const filteredItems = baseItems.filter(item => !excludedItems.includes(item));
    return filteredItems.length > 0
        ? filteredItems[Math.floor(Math.random() * filteredItems.length)]
        : baseItems[Math.floor(Math.random() * baseItems.length)];
}

function getRandomSegment() {
    const possibleSegmentIndices = WHEEL_SEGMENT_OUTCOMES
        .map((segment, index) => ({ index, name: segment.name }))
        .filter(segment => !excludedItems.includes(segment.name));

    if (possibleSegmentIndices.length === 0) {
        return { index: 0, name: WHEEL_SEGMENT_OUTCOMES[0].name };
    }
    const randomIndex = Math.floor(Math.random() * possibleSegmentIndices.length);
    return possibleSegmentIndices[randomIndex];
}

// Color Dice Roll Execution (Faithful to gperya.neocities.org)
function rollDice() {
    if (isRollingOrSpinning) return;
    isRollingOrSpinning = true;

    // Handle bets if active
    const totalBet = Object.values(bettingState.bets).reduce((a, b) => a + b, 0);
    if (totalBet > 0) {
        if (bettingState.purse < totalBet) {
            alert('⚠️ Insufficient purse for bets! Click + ₱1K REFILL.');
            isRollingOrSpinning = false;
            return;
        }
        bettingState.purse -= totalBet;
        updatePurseUI();
    }

    playDiceRollSound();
    const resultDiv = document.getElementById('diceResultArea');
    resultDiv.innerHTML = '';

    const results = [];
    const blocks = [];

    for (let i = 0; i < numDice; i++) {
        const block = document.createElement('div');
        const finalColorKey = getRandomResult('color');
        results.push(finalColorKey);

        block.className = 'color-block rolling-dice';

        // The iconic G Perya white center dot
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.display = showNumbers ? 'none' : 'block';
        block.appendChild(dot);

        // Number indicator
        const numLabel = document.createElement('div');
        numLabel.className = 'block-face-num';
        numLabel.textContent = COLOR_SPECS[finalColorKey].number;
        numLabel.style.display = showNumbers ? 'block' : 'none';
        block.appendChild(numLabel);

        resultDiv.appendChild(block);
        blocks.push({ block, colorKey: finalColorKey, dot, numLabel });

        setTimeout(() => block.classList.remove('rolling-dice'), 1200);
        setTimeout(() => block.style.backgroundColor = '#eaf5ff', 1300);
        setTimeout(() => {
            const spec = COLOR_SPECS[finalColorKey];
            block.style.backgroundColor = spec.hex;
            dot.style.backgroundColor = '#FFFFFF';
            numLabel.style.color = spec.textColor;

            // If this is the last die to reveal
            if (i === numDice - 1) {
                isRollingOrSpinning = false;
                processBetsResult(results);
                addHistoryRecord('color', results);
            }
        }, 1500 + i * 80);
    }
}

// Wheel Spin Execution (Faithful to gperya.neocities.org)
function spinWheel() {
    if (isRollingOrSpinning) return;
    isRollingOrSpinning = true;

    const wheel = document.getElementById('lightDarkWheel');
    const winnerText = document.getElementById('winnerText');

    winnerText.classList.remove('winner-text-visible', 'winner-text-box');
    winnerText.textContent = '';

    const totalSegments = WHEEL_SEGMENT_OUTCOMES.length;
    const segmentAngle = 360 / totalSegments;
    const pointerAngle = 90;

    const winningSegment = getRandomSegment();
    const winningIndex = winningSegment.index;

    const segmentCenterAngle = winningIndex * segmentAngle + segmentAngle / 2;
    const rotations = 360 * 4;
    const rotationOffset = (segmentCenterAngle - pointerAngle);
    const totalRotation = rotations + rotationOffset;

    const numSec = parseInt(document.getElementById('numDice').value) || 3;
    const duration = numSec * 950;

    let startTime = null;
    let lastTickIndex = -1;

    wheel.style.transition = 'none';
    void wheel.offsetWidth;
    wheel.style.transition = `transform ${duration / 1000}s cubic-bezier(0.1, 0.9, 0.2, 1.0)`;

    function animateWheel(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentRotation = eased * totalRotation;
        wheel.style.transform = `rotate(-${currentRotation}deg)`;

        const normalizedAngle = (currentRotation + pointerAngle) % 360;
        let currentIndex = Math.floor(normalizedAngle / segmentAngle) % totalSegments;

        if (currentIndex !== lastTickIndex && progress < 1) {
            lastTickIndex = currentIndex;
            playTickSound();
        }

        if (progress < 1) {
            requestAnimationFrame(animateWheel);
        } else {
            isRollingOrSpinning = false;
            let winnerTextContent = winningSegment.name.toUpperCase();
            if (winningSegment.name === 'gray') winnerTextContent = '3X GRAY!';

            winnerText.innerHTML = `<div class="winner-text-box">${winnerTextContent}</div>`;
            winnerText.classList.add('winner-text-visible');
            playWinSound(2);
            addHistoryRecord('wheel', [winningSegment.name]);
        }
    }

    requestAnimationFrame(animateWheel);
}

function resetWheel() {
    const wheel = document.getElementById('lightDarkWheel');
    const winnerText = document.getElementById('winnerText');
    if (!wheel || !winnerText) return;

    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';
    winnerText.classList.remove('winner-text-visible', 'winner-text-box');
    winnerText.innerHTML = '';
    void wheel.offsetWidth;
}

// Mode Toggle (Color Dice vs Wheel)
function toggleDisplayMode(mode) {
    const diceResultArea = document.getElementById('diceResultArea');
    const wheelWrapper = document.getElementById('wheelWrapper');
    const numDiceSelect = document.getElementById('numDice');
    const rollButton = document.getElementById('rollButton');
    const isColorMode = mode === 'color';

    numDice = modeValues[mode];
    updateNumDiceOptions();
    numDiceSelect.value = numDice;

    if (isColorMode) {
        diceResultArea.style.display = 'flex';
        wheelWrapper.style.display = 'none';
        rollButton.textContent = 'ROLL AGAIN !';
        rollDice();
    } else {
        diceResultArea.style.display = 'none';
        wheelWrapper.style.display = 'flex';
        rollButton.textContent = 'SPIN AGAIN!';
        resetWheel();
        spinWheel();
    }

    updateExclusionControls(mode);
    updateInfoContainer(isColorMode);
}

function updateNumDiceOptions() {
    const numDiceSelect = document.getElementById('numDice');
    const mode = document.getElementById('colorDice').value;
    const isColorMode = mode === 'color';

    numDiceSelect.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = isColorMode ? (i === 1 ? '1 Dice' : `${i} Dice`) : (i === 1 ? '1 Second' : `${i} Seconds`);
        numDiceSelect.appendChild(option);
    }
    numDiceSelect.value = numDice;
}

function updateInfoContainer(isColorMode) {
    const colorContainer = document.querySelector('.color-container');
    const colorInfo = document.getElementById('colorInfo');

    if (isColorMode) {
        colorInfo.innerHTML = `
            Possible colors are:
            <span style="color: #FF0000; font-weight: bold;">Red</span>,
            <span style="color: #FFA500; font-weight: bold;">Orange</span>,
            <span style="color: #FFFF00; font-weight: bold; text-shadow: 0 0 2px #000;">Yellow</span>,
            <span style="color: #008000; font-weight: bold;">Green</span>,
            <span style="color: #0000FF; font-weight: bold;">Blue</span>, and
            <span style="color: #800080; font-weight: bold;">Purple</span>.
        `;
        colorContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    } else {
        colorInfo.innerHTML = `
            Possible results are:
            <span style="color: #FFFFFF; font-weight: bold; text-shadow: 0 0 2px #000;">LIGHT</span>,
            <span style="color: #333333; font-weight: bold; text-shadow: 0 0 2px #FFF;">DARK</span>, and
            <span style="color: #A0A0A0; font-weight: bold; text-shadow: 0 0 2px #000;">3X GRAY</span>.
        `;
        colorContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    }
}

// Background Floating Circles Animation (referenced in original gperya.neocities.org)
function createFloatingCircles() {
    const container = document.getElementById('floating-circles-container');
    if (!container) return;

    const circle = document.createElement('div');
    circle.className = 'floating-circle';

    const size = Math.floor(Math.random() * 60) + 20; // 20px - 80px
    const left = Math.floor(Math.random() * 98);
    const duration = (Math.random() * 6 + 6).toFixed(1); // 6s - 12s

    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    circle.style.left = `${left}vw`;
    circle.style.animationDuration = `${duration}s`;

    container.appendChild(circle);
    setTimeout(() => circle.remove(), duration * 1000);
}

// Betting System Logic
function processBetsResult(results) {
    const counts = {};
    results.forEach(c => counts[c] = (counts[c] || 0) + 1);

    let totalWon = 0;
    Object.keys(bettingState.bets).forEach(color => {
        const bet = bettingState.bets[color];
        const match = counts[color] || 0;
        if (bet > 0 && match > 0) {
            // Peryahan payout: Bet + (Bet * Matches)
            const win = bet + (bet * match);
            totalWon += win;
        }
    });

    if (totalWon > 0) {
        bettingState.purse += totalWon;
        updatePurseUI();
        playWinSound(Math.max(...Object.values(counts)));
    }
}

function updatePurseUI() {
    const el = document.getElementById('purseAmount');
    if (el) el.textContent = `₱${bettingState.purse.toLocaleString()}`;
}

function updateBetSlotUI(color) {
    const el = document.getElementById(`bet-amt-${color}`);
    if (el) el.textContent = `₱${bettingState.bets[color].toLocaleString()}`;
}

// Exclusion Controls Setup (original gperya easter egg)
function toggleExcludedItem(item, isChecked) {
    const index = excludedItems.indexOf(item);
    if (!isChecked && index === -1) {
        excludedItems.push(item);
    } else if (isChecked && index !== -1) {
        excludedItems.splice(index, 1);
    }
}

function updateExclusionControls(mode) {
    const excludeContainer = document.getElementById('excludeContainer');
    if (!excludeContainer) return;
    let items = mode === 'color' ? validColors : validLightDark;
    excludedItems = excludedItems.filter(item => items.includes(item));

    const content = items.map(item => {
        const checkedAttr = !excludedItems.includes(item) ? 'checked' : '';
        const inputId = `chk_${item}`;
        return `
            <label>
                <input id="${inputId}" data-item="${item}" type="checkbox" ${checkedAttr}
                    onchange="toggleExcludedItem('${item}', this.checked)">
                <span>${item}</span>
            </label>
        `;
    }).join('');
    excludeContainer.innerHTML = content;
}

// ==========================================================================
// HISTORY STATE & MANAGEMENT
// ==========================================================================
let historyRecords = [];
let rollCounter = 0;

function addHistoryRecord(mode, outcomes) {
    rollCounter++;
    const record = {
        id: Date.now(),
        rollNum: rollCounter,
        mode: mode,
        outcomes: [...outcomes],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    historyRecords.unshift(record);
    if (historyRecords.length > 30) historyRecords.pop();
    saveHistory();
    renderHistory();
}

function saveHistory() {
    try {
        localStorage.setItem('gperya_history', JSON.stringify(historyRecords));
        localStorage.setItem('gperya_roll_counter', rollCounter.toString());
    } catch (e) {}
}

function loadSavedHistory() {
    try {
        const saved = localStorage.getItem('gperya_history');
        const savedCount = localStorage.getItem('gperya_roll_counter');
        if (saved) {
            historyRecords = JSON.parse(saved);
        }
        if (savedCount) {
            rollCounter = parseInt(savedCount, 10) || 0;
        }
    } catch (e) {}
}

function clearHistory() {
    historyRecords = [];
    rollCounter = 0;
    saveHistory();
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    const countTag = document.getElementById('historyCount');
    if (!list) return;

    if (countTag) countTag.textContent = historyRecords.length;

    if (historyRecords.length === 0) {
        list.innerHTML = `<div class="history-empty-text">No rolls yet! Click ROLL AGAIN to play.</div>`;
        return;
    }

    list.innerHTML = historyRecords.map((item, idx) => {
        let outcomeHtml = '';
        if (item.mode === 'color') {
            const diceHtml = item.outcomes.map(colorKey => {
                const spec = COLOR_SPECS[colorKey] || { hex: '#ccc', number: '?', textColor: '#fff' };
                return `
                    <div class="history-mini-die" style="background-color: ${spec.hex}" title="${spec.name}">
                        ${showNumbers 
                            ? `<span class="history-mini-num" style="color: ${spec.textColor}">${spec.number}</span>`
                            : `<span class="history-mini-dot"></span>`}
                    </div>
                `;
            }).join('');
            outcomeHtml = `<div class="history-dice-group">${diceHtml}</div>`;
        } else {
            const seg = item.outcomes[0] || 'light';
            let bg = '#FFFFFF';
            let text = '#000000';
            let label = seg.toUpperCase();
            if (seg === 'dark') { bg = '#333333'; text = '#FFFFFF'; }
            else if (seg === 'gray') { bg = '#A0A0A0'; text = '#FFFFFF'; label = '3X GRAY'; }

            outcomeHtml = `
                <div class="history-wheel-badge" style="background-color: ${bg}; color: ${text}">
                    ${label}
                </div>
            `;
        }

        return `
            <div class="history-card ${idx === 0 ? 'latest' : ''}">
                <div class="history-card-header">
                    <span>#${item.rollNum}</span>
                    ${idx === 0 ? `<span class="history-latest-pill">NEW</span>` : `<span>${item.mode.toUpperCase()}</span>`}
                </div>
                ${outcomeHtml}
                <div class="history-time">${item.time}</div>
            </div>
        `;
    }).join('');
}

function clearHistory() {
    historyRecords = [];
    rollCounter = 0;
    saveHistory();
    renderHistory();
}

// ==========================================================================
// HOTKEY COLOR AVOIDANCE (F1 - F6)
// ==========================================================================
const F_KEY_MAP = {
    'f1': 'red',
    'f2': 'purple',
    'f3': 'yellow',
    'f4': 'green',
    'f5': 'blue',
    'f6': 'orange'
};

function setAvoidColor(colorKey, fLabel) {
    if (excludedItems.includes(colorKey)) {
        // Toggle off if already avoided
        excludedItems = excludedItems.filter(c => c !== colorKey);
        playTickSound();
    } else {
        // Avoid this color
        excludedItems = [colorKey];
        playTickSound();
    }
    updateAvoidUI(fLabel);
}

function clearAllAvoid() {
    excludedItems = [];
    playTickSound();
    updateAvoidUI();
}

function updateAvoidUI(fLabel) {
    const pill = document.getElementById('avoidStatusPill');
    const text = document.getElementById('avoidStatusText');

    // Update active state on clickable pills
    document.querySelectorAll('.hotkey-pill').forEach(btn => {
        const k = btn.dataset.key;
        const color = F_KEY_MAP[k];
        btn.classList.toggle('active', excludedItems.includes(color));
    });

    if (!pill || !text) return;

    if (excludedItems.length === 0) {
        pill.style.display = 'none';
    } else {
        const activeColor = excludedItems[0];
        const spec = COLOR_SPECS[activeColor];
        const label = fLabel || ('F' + (spec ? spec.number : ''));

        text.textContent = `🚫 AVOIDING: ${spec ? spec.name.toUpperCase() : activeColor.toUpperCase()} (${label})`;
        pill.style.display = 'inline-flex';

        if (spec) {
            pill.style.backgroundColor = spec.hex;
            pill.style.color = spec.textColor;
            pill.style.borderColor = '#ffffff';
        }
    }
}

// Setup Event Listeners
function setupEvents() {
    const rollButton = document.getElementById('rollButton');
    rollButton.addEventListener('click', function () {
        const mode = document.getElementById('colorDice').value;
        const btn = this;
        btn.classList.remove('pressed');
        void btn.offsetWidth;
        btn.classList.add('pressed');

        if (mode === 'color') {
            rollDice();
        } else {
            spinWheel();
        }
    });

    document.getElementById('numDice').addEventListener('change', function () {
        const mode = document.getElementById('colorDice').value;
        modeValues[mode] = parseInt(this.value);
        numDice = modeValues[mode];
        if (mode === 'color') rollDice();
        else spinWheel();
    });

    document.getElementById('colorDice').addEventListener('change', function () {
        toggleDisplayMode(this.value);
    });

    // Sound toggle
    const btnSound = document.getElementById('btnSoundToggle');
    if (btnSound) {
        btnSound.addEventListener('click', () => {
            isMuted = !isMuted;
            btnSound.textContent = isMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
            btnSound.style.opacity = isMuted ? '0.6' : '1';
        });
    }

    // Toggle betting board section
    const btnBet = document.getElementById('btnToggleBetting');
    const betSection = document.getElementById('bettingSection');
    if (btnBet && betSection) {
        btnBet.addEventListener('click', () => {
            betSection.classList.toggle('betting-section-visible');
            btnBet.classList.toggle('active');
        });
    }

    // Toggle dots vs numbers on dice
    const btnDots = document.getElementById('btnToggleDots');
    if (btnDots) {
        btnDots.addEventListener('click', () => {
            showNumbers = !showNumbers;
            btnDots.classList.toggle('active', showNumbers);
            document.querySelectorAll('.dot').forEach(d => d.style.display = showNumbers ? 'none' : 'block');
            document.querySelectorAll('.block-face-num').forEach(n => n.style.display = showNumbers ? 'block' : 'none');
            renderHistory();
        });
    }

    // Chip selection
    document.querySelectorAll('.chip-perya').forEach(c => {
        c.addEventListener('click', (e) => {
            document.querySelectorAll('.chip-perya').forEach(x => x.classList.remove('active'));
            e.currentTarget.classList.add('active');
            bettingState.selectedChip = parseInt(e.currentTarget.dataset.val, 10);
        });
    });

    // Betting slot click
    document.querySelectorAll('.bet-color-slot').forEach(slot => {
        slot.addEventListener('click', (e) => {
            const color = e.currentTarget.dataset.color;
            const newTotal = Object.values(bettingState.bets).reduce((a, b) => a + b, 0) + bettingState.selectedChip;
            if (newTotal > bettingState.purse) {
                alert('⚠️ Not enough purse for this bet!');
                return;
            }
            bettingState.bets[color] += bettingState.selectedChip;
            updateBetSlotUI(color);
        });
    });

    // Clear bets
    document.getElementById('btnClearBets')?.addEventListener('click', () => {
        Object.keys(bettingState.bets).forEach(c => {
            bettingState.bets[c] = 0;
            updateBetSlotUI(c);
        });
    });

    // Refill purse
    document.getElementById('btnRefillPurse')?.addEventListener('click', () => {
        bettingState.purse += 1000;
        updatePurseUI();
    });

    // Clear history
    document.getElementById('btnClearHistory')?.addEventListener('click', clearHistory);

    // Reset avoid button
    document.getElementById('btnResetAvoid')?.addEventListener('click', clearAllAvoid);

    // Clickable hotkey pills
    document.querySelectorAll('.hotkey-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const k = e.currentTarget.dataset.key;
            if (F_KEY_MAP[k]) {
                setAvoidColor(F_KEY_MAP[k], k.toUpperCase());
            }
        });
    });

    // Keyboard Shortcuts (F1 - F6 to avoid color, Spacebar to roll/spin)
    document.addEventListener('keydown', function (e) {
        const active = document.activeElement;
        const tag = active ? active.tagName : null;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (active && active.isContentEditable)) return;

        const key = e.key.toLowerCase();

        // Hotkeys F1 - F6 to avoid color before rolling
        if (F_KEY_MAP[key]) {
            e.preventDefault(); // Prevent Windows defaults (F1 Help, F3 Find, F5 Refresh, F6 Focus)
            const targetColor = F_KEY_MAP[key];
            setAvoidColor(targetColor, key.toUpperCase());
            return;
        }

        if (key === 'escape' || key === 'z') {
            clearAllAvoid();
            return;
        }

        if (key === ' ') {
            e.preventDefault();
            document.getElementById('rollButton').click();
        }
    });
}

// Window load init
window.onload = () => {
    loadSavedHistory();
    setupWheelStyles();
    setupEvents();
    toggleDisplayMode('color');

    // Floating bokeh bubbles in background
    setInterval(createFloatingCircles, 800);
};
