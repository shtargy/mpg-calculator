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
let gradientOffset = 0;

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

function getNiceAxisEnd(range) {
  // Target 5 divisions (6 ticks including 0)
  const targetDivisions = 5;
  
  // Find a nice interval that divides the range into roughly 5 parts
  const roughInterval = range / targetDivisions;
  
  // Round to a nice number (50, 100, 200, 500, etc.)
  let niceInterval;
  if (roughInterval <= 50) niceInterval = 50;
  else if (roughInterval <= 100) niceInterval = 100;
  else if (roughInterval <= 200) niceInterval = 200;
  else if (roughInterval <= 500) niceInterval = 500;
  else niceInterval = 1000;
  
  // Round up the range to the next nice interval
  const baseEnd = Math.ceil(range / niceInterval) * niceInterval;
  
  // Add padding (10% of the interval) to ensure the last tick is visible
  return baseEnd + (niceInterval * 0.1);
}

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
  const niceEndValue = getNiceAxisEnd(range);
  const stepSize = niceEndValue / 5;  // 5 divisions = 6 points including 0
  
  // Generate data points for the line
  const dataPoints = Math.min(niceEndValue + 1, 500);
  const step = niceEndValue / (dataPoints - 1);
  
  const labels = [];
  const data = [];

  for (let i = 0; i < dataPoints; i++) {
    const miles = i * step;
    // Only add labels at the step points
    labels.push('');  // Empty label for most points
    data.push(calculateFuelRemaining(calcMpg, calcTank, miles));
  }

  updateEquation(calcMpg, calcTank);
  triggerCarAnimation();

  const isDarkMode = document.body.classList.contains('dark-mode');
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)';
  const axisColor = isDarkMode ? '#ffffff' : '#000000';
  const lineColor = isDarkMode ? '#ff00ff' : 'purple';

  const yAxisLabel = isElectricMode ? 'Battery Remaining (Kilowatt Hours)' : 'Fuel Remaining (gallons)';

  const chartOptions = {
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
            size: 14,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: axisColor,
        bodyColor: axisColor,
        padding: 10,
        cornerRadius: 5,
        titleFont: {
          weight: 'bold'
        }
      }
    },
    scales: {
      x: { 
        grid: {
          color: gridColor,
          drawBorder: true,
          borderColor: axisColor,
          drawOnChartArea: true,
          drawTicks: true,
          lineWidth: isDarkMode ? 1.5 : 0.5
        },
        border: {
          display: true,
          color: axisColor,
          width: 2
        },
        ticks: {
          color: axisColor,
          font: {
            size: 12,
            weight: isDarkMode ? 'bold' : 'normal'
          }
        },
        title: { 
          display: true, 
          text: 'Miles Driven',
          color: axisColor,
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        min: 0,
        max: niceEndValue
      },
      y: {
        grid: {
          color: gridColor,
          drawBorder: true,
          borderColor: axisColor,
          drawOnChartArea: true,
          drawTicks: true,
          lineWidth: isDarkMode ? 1.5 : 0.5
        },
        border: {
          display: true,
          color: axisColor,
          width: 2
        },
        ticks: {
          color: axisColor,
          font: {
            size: 12,
            weight: isDarkMode ? 'bold' : 'normal'
          }
        },
        title: {
          display: true,
          text: yAxisLabel,
          color: axisColor,
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        min: 0,
        max: Math.ceil(calcTank)
      }
    }
  };

  // Filter out negative Y values
  const filteredData = Array.from({ length: dataPoints }, (_, i) => {
    const x = i * step;
    const y = calcTank - (x / calcMpg);
    return y >= 0 ? { x, y } : null;
  }).filter(point => point !== null);

  // Remove the animated gradient class from the canvas
  ctx.canvas.classList.remove('animated-gradient');

  // Create a gradient for the dataset fill
  const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  if (isDarkMode) {
    gradient.addColorStop(0, 'rgba(255, 0, 255, 0.2)');
    gradient.addColorStop(0.5, 'rgba(153, 51, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(128, 0, 128, 0.2)');
  } else {
    gradient.addColorStop(0, 'rgba(128, 0, 128, 0.1)');
    gradient.addColorStop(0.5, 'rgba(153, 51, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 0, 255, 0.1)');
  }

  // Update chart data
  if (chart) {
    chart.data.datasets[0].data = filteredData;
    chart.data.datasets[0].borderColor = lineColor;
    chart.data.datasets[0].backgroundColor = gradient;
    chart.data.datasets[0].label = isElectricMode ? 'Battery Remaining' : 'Fuel Remaining';
    chart.options = {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        x: {
          ...chartOptions.scales.x,
          type: 'linear',
          position: 'bottom',
          ticks: {
            ...chartOptions.scales.x.ticks,
            stepSize: stepSize,
            callback: function(value) {
              return Math.round(value);
            }
          }
        }
      }
    };
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: isElectricMode ? 'Battery Remaining' : 'Fuel Remaining',
          data: filteredData,
          borderColor: lineColor,
          borderWidth: isDarkMode ? 3 : 2,
          fill: 'origin',
          backgroundColor: gradient,
          tension: 0.1
        }]
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          x: {
            ...chartOptions.scales.x,
            type: 'linear',
            position: 'bottom',
            ticks: {
              ...chartOptions.scales.x.ticks,
              stepSize: stepSize,
              callback: function(value) {
                return Math.round(value);
              }
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

  // Recreate chart to apply new grid color
  if (chart) {
    chart.destroy();
    chart = null;
    updateChart();
  }
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
  
  // Play appropriate animation based on mode
  if (isElectricMode) {
    playLightningAnimation();
  } else {
    playFireAnimation();
  }
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

// Add these functions near the top with other animation-related functions
function playLightningAnimation() {
  const bolts = document.querySelectorAll('.bolt');
  bolts.forEach(bolt => {
    bolt.parentElement.style.display = 'block';
    bolt.classList.remove('animate');
    void bolt.offsetWidth; // Force reflow
    bolt.classList.add('animate');
  });
  
  // Hide the lightning after animation (increased to 1600ms to match new duration)
  setTimeout(() => {
    bolts.forEach(bolt => {
      bolt.parentElement.style.display = 'none';
    });
  }, 1600);
}

function playFireAnimation() {
  const flames = document.querySelectorAll('.fire-effect');
  flames.forEach(flame => {
    flame.style.display = 'block';
    const mainFlame = flame.querySelector('.flame-main');
    const innerFlame = flame.querySelector('.flame-inner');
    
    mainFlame.classList.remove('animate');
    innerFlame.classList.remove('animate');
    void mainFlame.offsetWidth; // Force reflow
    void innerFlame.offsetWidth;
    mainFlame.classList.add('animate');
    innerFlame.classList.add('animate');
  });
  
  // Hide the fire after animation (increased to 1600ms to match new duration)
  setTimeout(() => {
    flames.forEach(flame => {
      flame.style.display = 'none';
    });
  }, 1600);
}

// Update the input handlers to play animations
function handleInput() {
  if (isElectricMode) {
    playLightningAnimation();
  } else {
    playFireAnimation();
  }
  playGifOnce();
}

// Define inputElements and set up event listeners for animations
const inputElements = [mpgInput, mpgSlider, tankInput, tankSlider];

// Remove existing event listeners and add new ones
inputElements.forEach(element => {
  const existingListener = element.getAttribute('data-has-animation');
  if (existingListener === 'true') {
    element.removeEventListener('input', handleInput);
  }
  element.addEventListener('input', handleInput);
  element.setAttribute('data-has-animation', 'true');
});

// Initialize by hiding all effects
document.addEventListener('DOMContentLoaded', () => {
  const effects = document.querySelectorAll('.lightning-effect, .fire-effect');
  effects.forEach(effect => {
    effect.style.display = 'none';
  });
});

function animateGradient() {
  gradientOffset += 0.005; // Slower increment for smoother animation
  if (gradientOffset > 2 * Math.PI) gradientOffset = 0;

  const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  gradient.addColorStop(0, `rgba(128, 0, 128, ${0.1 + 0.05 * (1 + Math.cos(gradientOffset))})`);
  gradient.addColorStop(0.5, `rgba(153, 51, 255, ${0.1 + 0.05 * (1 + Math.cos(gradientOffset + Math.PI / 2))})`);
  gradient.addColorStop(1, `rgba(255, 0, 255, ${0.1 + 0.05 * (1 + Math.cos(gradientOffset + Math.PI))})`);

  if (chart) {
    chart.data.datasets[0].backgroundColor = gradient;
    chart.update('none'); // Update without animation for smooth effect
  }

  requestAnimationFrame(animateGradient);
}

// Start the gradient animation
animateGradient();