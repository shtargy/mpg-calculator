const mpgInput = document.getElementById('mpg');
const tankInput = document.getElementById('tank');
const mpgSlider = document.getElementById('mpg-slider');
const tankSlider = document.getElementById('tank-slider');
const mpgLabel = document.getElementById('mpgLabel');
const tankLabel = document.getElementById('tankLabel');
const ctx = document.getElementById('rangeChart').getContext('2d');
const slopeDisplay = document.getElementById('slope');
const interceptDisplay = document.getElementById('intercept');
const wheels = document.querySelectorAll('.wheel');

let isElectricMode = false;
let chart;
let gifTimeout;
let chartUpdateTimeout;

function validateInput(value, min, max) {
  // If the value is empty or not a number, return as is
  if (value === '' || isNaN(value)) return value;
  
  const num = parseFloat(value);
  // Round to 1 decimal place to avoid floating point issues
  return Math.round(num * 10) / 10;
}

function calculateFuelRemaining(mpg, tank, miles) {
  const fuelUsed = miles / mpg;
  return Math.max(tank - fuelUsed, 0);
}

function updateEquation(mpg, tank) {
  const slope = -1 / mpg;
  const intercept = tank;
  slopeDisplay.textContent = slope.toFixed(3);
  interceptDisplay.textContent = intercept.toFixed(1);
}

function triggerCarAnimation() {
  wheels.forEach(wheel => {
    wheel.classList.add('spinning');
    setTimeout(() => wheel.classList.remove('spinning'), 1000);
  });
}

function showGif() {
  const gif = document.getElementById("cybertruckGif");
  if (!gif) return;
  
  gif.style.display = "block";
  gif.src = `cybertruckmiami.gif?t=${Date.now()}`;
}

function playGifOnce() {
  const gif = document.getElementById("cybertruckGif");
  if (!gif) return;

  // Clear existing timeout
  if (gifTimeout) {
    clearTimeout(gifTimeout);
    gifTimeout = null;
  }
  
  // Play animation
  gif.src = `cybertruckmiami.gif?t=${Date.now()}`;
  
  // Reset to static image after 5 seconds
  gifTimeout = setTimeout(() => {
    gif.src = "cybertruckmiami_still.png";
  }, 5000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function updateLabels() {
  const mpgText = isElectricMode ? 'Miles/Kilowatt Hour:' : 'MPG:';
  const tankText = isElectricMode ? 'Battery Capacity (Kilowatt Hours):' : 'Fuel Tank Volume (gallons):';
  mpgLabel.textContent = mpgText;
  tankLabel.textContent = tankText;
  
  // Update ranges and values based on mode
  if (isElectricMode) {
    // Electric mode ranges
    mpgInput.min = 0;
    mpgInput.max = 10;
    mpgInput.step = 0.1;
    mpgSlider.min = 0.5;
    mpgSlider.max = 10;
    mpgSlider.step = 0.1;
    tankInput.min = 0;
    tankInput.max = 150;
    tankInput.step = 0.1;
    tankSlider.min = 1;
    tankSlider.max = 150;
    tankSlider.step = 0.1;
    
    // Set default values for electric mode if switching to it
    mpgInput.value = 4;
    mpgSlider.value = 4;
    tankInput.value = 75;
    tankSlider.value = 75;
  } else {
    // Gas mode ranges
    mpgInput.min = 0;
    mpgInput.max = 100;
    mpgInput.step = 1;
    mpgSlider.min = 1;
    mpgSlider.max = 100;
    mpgSlider.step = 1;
    tankInput.min = 0;
    tankInput.max = 100;
    tankInput.step = 1;
    tankSlider.min = 1;
    tankSlider.max = 100;
    tankSlider.step = 1;
    
    // Set default values for gas mode if switching to it
    mpgInput.value = 30;
    mpgSlider.value = 30;
    tankInput.value = 15;
    tankSlider.value = 15;
  }
  
  updateChart();
}

// Update initial default values
mpgInput.value = 30;
mpgSlider.value = 30;
tankInput.value = 15;
tankSlider.value = 15;

function updateChart() {
  const mpgMax = isElectricMode ? 10 : 100;
  const mpgMin = isElectricMode ? 0.5 : 1;
  const tankMax = isElectricMode ? 150 : 100;
  
  // Get the current values
  let mpg = mpgInput.value === '' || isNaN(mpgInput.value) ? 0 : parseFloat(mpgInput.value);
  let tank = tankInput.value === '' || isNaN(tankInput.value) ? 0 : parseFloat(tankInput.value);
  
  // Use minimum values for calculations if inputs are too low
  const calcMpg = Math.max(mpg, isElectricMode ? 0.5 : 1);
  const calcTank = Math.max(tank, 1);

  const range = calcMpg * calcTank;
  const dataPoints = Math.min(range + 1, 500);
  const step = range / (dataPoints - 1);
  
  const labels = [];
  const data = [];

  for (let i = 0; i < dataPoints; i++) {
    const miles = i * step;
    labels.push(Math.round(miles));
    data.push(calculateFuelRemaining(calcMpg, calcTank, miles));
  }

  updateEquation(calcMpg, calcTank);
  triggerCarAnimation();

  const isDarkMode = document.body.classList.contains('dark-mode');
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const axisColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';

  const yAxisLabel = isElectricMode ? 'Battery Remaining (Kilowatt Hours)' : 'Fuel Remaining (gallons)';

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].label = yAxisLabel;
    chart.options.scales.x.grid.color = gridColor;
    chart.options.scales.y.grid.color = gridColor;
    chart.options.scales.x.ticks.color = axisColor;
    chart.options.scales.y.ticks.color = axisColor;
    chart.options.scales.x.title.color = axisColor;
    chart.options.scales.y.title.color = axisColor;
    chart.options.scales.y.title.text = yAxisLabel;
    chart.options.plugins.legend.labels.color = axisColor;
    chart.update('none');
  } else {
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(128, 0, 128, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 200, 0, 0.1)');

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: yAxisLabel,
          data: data,
          borderColor: 'rgba(128, 0, 128, 1)',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: axisColor,
              font: {
                size: 14
              }
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            titleColor: axisColor,
            bodyColor: axisColor,
            padding: 10,
            cornerRadius: 5
          }
        },
        scales: {
          x: { 
            title: { 
              display: true, 
              text: 'Miles Driven',
              color: axisColor
            },
            ticks: {
              maxTicksLimit: 10,
              color: axisColor
            },
            grid: {
              color: gridColor
            }
          },
          y: { 
            title: { 
              display: true, 
              text: yAxisLabel,
              color: axisColor
            },
            beginAtZero: true,
            ticks: {
              color: axisColor
            },
            grid: {
              color: gridColor
            }
          }
        }
      }
    });
  }
}

// Debounce chart updates for better performance
const debouncedUpdateChart = debounce(updateChart, 100);

function syncInputs(source, target) {
  if (source.type === 'number') {
    // For number inputs, allow any input including empty string
    if (source.value === '') {
      debouncedUpdateChart();
      return;
    }
    
    // Only validate and update if we have a number
    if (!isNaN(source.value)) {
      const value = validateInput(source.value);
      // Only update slider if the value is within its range
      if (value >= target.min && value <= target.max) {
        target.value = value;
      }
      debouncedUpdateChart();
    }
  } else {
    // For slider inputs
    const value = validateInput(source.value, source.min, source.max);
    if (value !== '') {
      source.value = value;
      target.value = value;
      debouncedUpdateChart();
    }
  }
}

// Event Listeners
mpgInput.addEventListener('input', () => syncInputs(mpgInput, mpgSlider));
tankInput.addEventListener('input', () => syncInputs(tankInput, tankSlider));
mpgSlider.addEventListener('input', () => syncInputs(mpgSlider, mpgInput));
tankSlider.addEventListener('input', () => syncInputs(tankSlider, tankInput));

const inputElements = [mpgInput, mpgSlider, tankInput, tankSlider];
inputElements.forEach(element => {
  element.addEventListener("input", playGifOnce);
});

// Update the dark mode toggle button text
function updateDarkModeButtonText() {
  const button = document.getElementById('toggleDarkMode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  button.textContent = isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode';
}

document.getElementById('toggleDarkMode').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  updateChart(); // Refresh chart with new colors
  updateDarkModeButtonText(); // Update button text
});

// Initialize button text on page load
updateDarkModeButtonText();

// Update the car mode toggle button text
function updateCarModeButtonText() {
  const button = document.getElementById('toggleCarMode');
  button.textContent = isElectricMode ? 'Gas Car Mode' : 'Electric Car Mode';
}

document.getElementById('toggleCarMode').addEventListener('click', () => {
  isElectricMode = !isElectricMode;
  updateLabels();
  updateChart();
  updateCarModeButtonText();
  playGifOnce();
});

// Initialize labels and button text on page load
updateLabels();
updateCarModeButtonText();

// Cleanup function
window.addEventListener('beforeunload', () => {
  if (chart) {
    chart.destroy();
  }
  if (gifTimeout) {
    clearTimeout(gifTimeout);
  }
  if (chartUpdateTimeout) {
    clearTimeout(chartUpdateTimeout);
  }
});

// Initialize the chart
updateChart();