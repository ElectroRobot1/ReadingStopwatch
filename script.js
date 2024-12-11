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

function formatTime(time) {
  return (time / 1000).toFixed(2);
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
  localStorage.setItem('elapsedTime', elapsedTime); // Save elapsed time
  startButton.disabled = false;
  stopButton.disabled = true;
}

function resetStopwatch() {
  clearInterval(timerInterval);
  elapsedTime = 0;
  localStorage.setItem('elapsedTime', elapsedTime); // Reset elapsed time
  updateDisplay();
  startButton.disabled = false;
  stopButton.disabled = true;
  resetButton.disabled = true;
  saveButton.disabled = true;
}

function saveTime() {
  const timeString = formatTime(elapsedTime);
  savedTimes.push(timeString);
  localStorage.setItem('savedTimes', JSON.stringify(savedTimes)); // Save saved times
  updateSavedTimesList();
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
  savedTimes.forEach((time, index) => {
    const listItem = document.createElement('li');

    // Add time text
    const timeText = document.createElement('span');
    timeText.textContent = `${index + 1}. ${time} seconds`;
    listItem.appendChild(timeText);

    // Add delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-button';
    deleteButton.addEventListener('click', () => deleteSavedTime(index));
    listItem.appendChild(deleteButton);

    timesList.appendChild(listItem);
  });

  // Enable or disable the "Clear All" button based on saved times
  clearAllButton.disabled = savedTimes.length === 0;
}

// Initialize the display and saved times on page load
updateDisplay();
updateSavedTimesList();

// Attach event listeners
startButton.addEventListener('click', startStopwatch);
stopButton.addEventListener('click', stopStopwatch);
resetButton.addEventListener('click', resetStopwatch);
saveButton.addEventListener('click', saveTime);
clearAllButton.addEventListener('click', clearAllSavedTimes);
