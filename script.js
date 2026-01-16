let startTime = null;
let elapsedTime = parseInt(localStorage.getItem('elapsedTime')) || 0;
let savedTimesRaw = JSON.parse(localStorage.getItem('savedTimes')) || [];
// Migrate legacy string saved times into objects: {time, millis, page}
let savedTimes = savedTimesRaw.map(entry => {
  if (typeof entry === 'string') return { time: entry, millis: null, page: null };
  return entry;
});
let timerInterval = null;

const display = document.getElementById('display');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const resetButton = document.getElementById('reset');
const saveButton = document.getElementById('save');
const clearAllButton = document.getElementById('clear-all');
const timesList = document.getElementById('times-list');
const editButton = document.getElementById('edit');
const incrementButton = document.getElementById('increment');
const decrementButton = document.getElementById('decrement');
const timeInputBox = document.getElementById('time-input-box');
const enterTimeButton = document.getElementById('enter-time');
const hoursInput = document.getElementById('hours-input');
const minutesInput = document.getElementById('minutes-input');
const secondsInput = document.getElementById('seconds-input');
const savePageBox = document.getElementById('save-page-box');
const suggestedPageInput = document.getElementById('suggested-page-input');
const pageIncrement = document.getElementById('page-increment');
const pageDecrement = document.getElementById('page-decrement');
const confirmSavePageBtn = document.getElementById('confirm-save-page');
const cancelSavePageBtn = document.getElementById('cancel-save-page');
const themeToggle = document.getElementById('theme-toggle');

function formatTime(time) {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const hours = Math.floor(time / (1000 * 60 * 60));
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  display.textContent = formatTime(elapsedTime);
}

function startStopwatch() {
  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(() => {
    elapsedTime = Date.now() - startTime;
    updateDisplay();
  }, 10);
  startButton.disabled = true;
  stopButton.disabled = false;
  resetButton.disabled = false;
  saveButton.disabled = false;
}

function stopStopwatch() {
  clearInterval(timerInterval);
  localStorage.setItem('elapsedTime', elapsedTime);
  startButton.disabled = false;
  stopButton.disabled = true;
}

function resetStopwatch() {
  clearInterval(timerInterval);
  elapsedTime = 0;
  localStorage.setItem('elapsedTime', elapsedTime);
  updateDisplay();
  startButton.disabled = false;
  stopButton.disabled = true;
  resetButton.disabled = true;
  saveButton.disabled = true;
}

function toggleTimeInputBox(button) {
  const isActive = button.classList.contains('active');
  document.querySelectorAll('.control-box button').forEach(btn => btn.classList.remove('active'));
  if (!isActive) {
    button.classList.add('active');
    timeInputBox.classList.remove('hidden');
  } else {
    timeInputBox.classList.add('hidden');
  }
}

function applyTimeChange(mode) {
  const hours = parseInt(hoursInput.value) || 0;
  const minutes = parseInt(minutesInput.value) || 0;
  const seconds = parseInt(secondsInput.value) || 0;
  const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;

  if (mode === 'edit') elapsedTime = totalMilliseconds;
  else if (mode === 'increment') elapsedTime += totalMilliseconds;
  else if (mode === 'decrement') elapsedTime = Math.max(0, elapsedTime - totalMilliseconds);

  localStorage.setItem('elapsedTime', elapsedTime);
  updateDisplay();
  timeInputBox.classList.add('hidden');
}

function saveTime() {
  console.log('saveTime(): save button clicked, showing save page box');
  showSavePageBox();
}

function clearAllSavedTimes() {
  savedTimes = [];
  localStorage.setItem('savedTimes', JSON.stringify(savedTimes));
  updateSavedTimesList();
}

function deleteSavedTime(index) {
  savedTimes.splice(index, 1);
  localStorage.setItem('savedTimes', JSON.stringify(savedTimes));
  updateSavedTimesList();
}

function updateSavedTimesList() {
  timesList.innerHTML = '';
  savedTimes.forEach((entry, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'saved-time-item';

    const timeText = document.createElement('span');
    const displayTime = entry.time || formatTime(entry.millis || 0);
    const pageText = (entry.page !== null && entry.page !== undefined) ? ` — Page ${entry.page}` : '';
    timeText.textContent = `${index + 1}. ${displayTime}${pageText}`;
    listItem.appendChild(timeText);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-button';
    deleteButton.addEventListener('click', () => deleteSavedTime(index));
    listItem.appendChild(deleteButton);

    timesList.appendChild(listItem);
  });

  clearAllButton.disabled = savedTimes.length === 0;
}

function computeAveragePPM() {
  const entries = savedTimes
    .filter(e => e.millis !== null && e.millis !== undefined && e.page !== null && e.page !== undefined)
    .slice()
    .sort((a,b) => a.millis - b.millis);
  if (entries.length < 2) return 0;
  // Compute per-pair pages/minute and average them for more robust rate
  let rates = [];
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i-1];
    const curr = entries[i];
    const deltaPages = curr.page - prev.page;
    const deltaMinutes = (curr.millis - prev.millis) / 60000;
    if (deltaMinutes > 0) rates.push(deltaPages / deltaMinutes);
  }
  if (rates.length === 0) return 0;
  const sum = rates.reduce((s,v) => s+v, 0);
  const avg = sum / rates.length;
  console.log('computeAveragePPM(): rates=', rates, 'avgPPM=', avg);
  return avg;
}

function showSavePageBox() {
  console.log('showSavePageBox(): called; savedTimes length=', savedTimes.length);
  // Determine suggested page based on last saved page and average pages per minute
  const entries = savedTimes.filter(e => e.millis !== null && e.page !== null && e.millis !== undefined && e.page !== undefined);
  let suggested = 1;
  if (entries.length === 0) {
    suggested = 1;
  } else {
    const sorted = entries.slice().sort((a,b) => a.millis - b.millis);
    const last = sorted[sorted.length - 1];
    const avgPPM = computeAveragePPM();
    const minutesSinceLast = Math.max(0, (elapsedTime - last.millis) / 60000);
    if (avgPPM && avgPPM > 0) {
      suggested = Math.max(0, Math.round(last.page + avgPPM * minutesSinceLast));
    } else {
      // No reliable average: keep same page as last
      suggested = last.page;
    }
  }

  // If popup elements aren't present, fall back to directly saving
  if (!savePageBox || !suggestedPageInput) {
    console.log('showSavePageBox(): popup elements missing, falling back to direct save');
    const entry = { time: formatTime(elapsedTime), millis: elapsedTime, page: null };
    savedTimes.push(entry);
    localStorage.setItem('savedTimes', JSON.stringify(savedTimes));
    updateSavedTimesList();
    return;
  }

  suggestedPageInput.value = suggested;
  savePageBox.classList.remove('hidden');
  savePageBox.classList.add('save-page-visible');
  console.log('showSavePageBox(): popup shown; suggested=', suggested, 'savePageBox classList=', Array.from(savePageBox.classList));
  try {
    suggestedPageInput.focus();
    suggestedPageInput.select();
  } catch (e) {
    console.log('showSavePageBox(): focus failed', e);
  }
  try { document.body.style.overflow = 'hidden'; } catch(e) {}
}

function hideSavePageBox() {
  savePageBox.classList.add('hidden');
  savePageBox.classList.remove('save-page-visible');
  try { document.body.style.overflow = ''; } catch(e) {}
}

pageIncrement && pageIncrement.addEventListener('click', () => {
  suggestedPageInput.value = (parseInt(suggestedPageInput.value) || 0) + 1;
});
pageDecrement && pageDecrement.addEventListener('click', () => {
  suggestedPageInput.value = Math.max(0, (parseInt(suggestedPageInput.value) || 0) - 1);
});

if (confirmSavePageBtn) {
  confirmSavePageBtn.addEventListener('click', () => {
    console.log('confirmSavePageBtn: clicked, saving entry');
    const pageNum = Math.max(0, parseInt(suggestedPageInput.value) || 0);
    const entry = { time: formatTime(elapsedTime), millis: elapsedTime, page: pageNum };
    savedTimes.push(entry);
    localStorage.setItem('savedTimes', JSON.stringify(savedTimes));
    updateSavedTimesList();
    hideSavePageBox();
  });
}

if (cancelSavePageBtn) {
  cancelSavePageBtn.addEventListener('click', () => {
    hideSavePageBox();
  });
}

startButton.addEventListener('click', startStopwatch);
stopButton.addEventListener('click', stopStopwatch);
resetButton.addEventListener('click', resetStopwatch);
saveButton.addEventListener('click', saveTime);
clearAllButton.addEventListener('click', clearAllSavedTimes);

editButton && editButton.addEventListener('click', () => toggleTimeInputBox(editButton));
incrementButton && incrementButton.addEventListener('click', () => toggleTimeInputBox(incrementButton));
decrementButton && decrementButton.addEventListener('click', () => toggleTimeInputBox(decrementButton));
enterTimeButton && enterTimeButton.addEventListener('click', () => {
  const activeButton = document.querySelector('.control-box button.active');
  if (activeButton === editButton) applyTimeChange('edit');
  if (activeButton === incrementButton) applyTimeChange('increment');
  if (activeButton === decrementButton) applyTimeChange('decrement');
  hoursInput.value = '';
  minutesInput.value = '';
  secondsInput.value = '';
});

function applyTheme(theme) {
  try {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeToggle) {
      // themeToggle is a checkbox input; checked = dark
      try { themeToggle.checked = theme === 'dark'; } catch (e) {}
    }
  } catch (e) { console.log('applyTheme error', e); }
}

function initTheme() {
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored) {
    applyTheme(stored);
  } else {
    // Use OS theme as default
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  // Listen for OS theme changes, but only apply them if the user hasn't set an explicit preference
  if (window.matchMedia) {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    if (mql.addEventListener) mql.addEventListener('change', handler);
    else if (mql.addListener) mql.addListener(handler);
  }
}

if (themeToggle) {
  // The theme toggle is now a checkbox input (slider). Checked = dark theme.
  themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'dark' : 'light';
    // Store explicit choice and apply
    try { localStorage.setItem('theme', newTheme); } catch (e) {}
    applyTheme(newTheme);
  });
}

// Initialize UI
initTheme();
updateDisplay();
updateSavedTimesList();
