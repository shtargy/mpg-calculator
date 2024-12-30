const mpgInput = document.getElementById('mpg');
const tankInput = document.getElementById('tank');
const mpgSlider = document.getElementById('mpg-slider');
const tankSlider = document.getElementById('tank-slider');
const ctx = document.getElementById('rangeChart').getContext('2d');
const slopeDisplay = document.getElementById('slope');
const interceptDisplay = document.getElementById('intercept');
const wheels = document.querySelectorAll('.wheel');

let chart;
let gifTimeout;
let chartUpdateTimeout;

function validateInput(value, min, max) {
  const num = parseFloat(value);
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
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

function updateChart() {
  const mpg = validateInput(mpgInput.value, 1, 100);
  const tank = validateInput(tankInput.value, 1, 30);
  
  // Update input values if they were invalid
  mpgInput.value = mpg;
  tankInput.value = tank;
  mpgSlider.value = mpg;
  tankSlider.value = tank;
  
  const range = mpg * tank;
  const dataPoints = Math.min(range + 1, 500);
  const step = range / (dataPoints - 1);
  
  const labels = [];
  const data = [];

  for (let i = 0; i < dataPoints; i++) {
    const miles = i * step;
    labels.push(Math.round(miles));
    data.push(calculateFuelRemaining(mpg, tank, miles));
  }

  updateEquation(mpg, tank);
  triggerCarAnimation();

  const isDarkMode = document.body.classList.contains('dark-mode');
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const axisColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.options.scales.x.grid.color = gridColor;
    chart.options.scales.y.grid.color = gridColor;
    chart.options.scales.x.ticks.color = axisColor;
    chart.options.scales.y.ticks.color = axisColor;
    chart.options.scales.x.title.color = axisColor;
    chart.options.scales.y.title.color = axisColor;
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
          label: 'Fuel Remaining (gallons)',
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
              text: 'Fuel Remaining (gallons)',
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
  const value = validateInput(source.value, 1, source.max);
  source.value = value;
  target.value = value;
  debouncedUpdateChart();
}

// Event Listeners
mpgInput.addEventListener('input', () => syncInputs(mpgInput, mpgSlider));
mpgSlider.addEventListener('input', () => syncInputs(mpgSlider, mpgInput));
tankInput.addEventListener('input', () => syncInputs(tankInput, tankSlider));
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