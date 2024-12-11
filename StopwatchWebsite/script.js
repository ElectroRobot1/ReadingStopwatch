let startTime = null;
let elapsedTime = parseInt(localStorage.getItem('elapsedTime')) || 0;
let savedTimes = JSON.parse(localStorage.getItem('savedTimes')) || [];
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

function formatTime(time) {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const hours = Math.floor(time / (1000 * 60 * 60));
  return `${hours}:${minutes}:${seconds}`;
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

editButton.addEventListener('click', () => toggleTimeInputBox(editButton));
incrementButton.addEventListener('click', () => toggleTimeInputBox(incrementButton));
decrementButton.addEventListener('click', () => toggleTimeInputBox(decrementButton));
enterTimeButton.addEventListener('click', () => {
  const activeButton = document.querySelector('.control-box button.active');
  if (activeButton === editButton) applyTimeChange('edit');
  if (activeButton === incrementButton) applyTimeChange('increment');
  if (activeButton === decrementButton) applyTimeChange('decrement');
  hoursInput.value = '';
  minutesInput.value = '';
  secondsInput.value = '';
});

startButton.addEventListener('click', startStopwatch);
stopButton.addEventListener('click', stopStopwatch);
resetButton.addEventListener('click', resetStopwatch);
