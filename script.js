const mpgInput = document.getElementById('mpg');
const tankInput = document.getElementById('tank');
const mpgSlider = document.getElementById('mpg-slider');
const tankSlider = document.getElementById('tank-slider');
const ctx = document.getElementById('rangeChart').getContext('2d');
const slopeDisplay = document.getElementById('slope');
const interceptDisplay = document.getElementById('intercept');
const wheels = document.querySelectorAll('.wheel'); // Select all wheels

let chart;
let gifTimeout; // Variable to store the timeout ID

function calculateFuelRemaining(mpg, tank, miles) {
  return tank - (miles / mpg);
}

function updateEquation(mpg, tank) {
  const slope = -1 / mpg;
  const intercept = tank;
  slopeDisplay.textContent = slope.toFixed(2);
  interceptDisplay.textContent = intercept;
}

function triggerCarAnimation() {
  wheels.forEach(wheel => {
    wheel.classList.add('spinning');
    setTimeout(() => {
      wheel.classList.remove('spinning');
    }, 1000); // Duration matches the CSS animation duration
  });
}

function showGif() {
  const gif = document.getElementById("cybertruckGif");
  gif.style.display = "block"; 
  // Reload the GIF each time to restart animation if desired:
  gif.src = "cybertruckmiami.gif?t=" + new Date().getTime();
}

function playGifOnce() {
  const gif = document.getElementById("cybertruckGif");
  // Switch to the GIF, forcing a reload
  gif.src = "cybertruckmiami.gif?t=" + Date.now();
  
  // Clear any existing timeout to prevent multiple timers
  if (gifTimeout) {
    clearTimeout(gifTimeout);
  }
  
  // After 5 seconds, revert to static image
  gifTimeout = setTimeout(() => {
    gif.src = "cybertruckmiami_still.png";
    gifTimeout = null;
  }, 5000);
}

function updateChart() {
  const mpg = parseFloat(mpgInput.value);
  const tank = parseFloat(tankInput.value);
  const range = mpg * tank;
  const labels = [];
  const data = [];

  for (let miles = 0; miles <= range; miles += 1) {
    labels.push(miles);
    data.push(calculateFuelRemaining(mpg, tank, miles));
  }

  updateEquation(mpg, tank);
  triggerCarAnimation();

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Fuel Remaining (gallons)',
          data: data,
          borderColor: 'rgba(75, 192, 192, 1)',
          fill: false,
        }]
      },
      options: {
        responsive: false,           // Disable responsive resizing
        maintainAspectRatio: false,  // Let width/height attributes control size
        scales: {
          x: { title: { display: true, text: 'Miles Driven' } },
          y: { title: { display: true, text: 'Fuel Remaining (gallons)' }, beginAtZero: true }
        }
      }
    });
  }
}

function syncInputs(source, target) {
  target.value = source.value;
  updateChart();
}

mpgInput.addEventListener('input', () => syncInputs(mpgInput, mpgSlider));
mpgSlider.addEventListener('input', () => syncInputs(mpgSlider, mpgInput));
tankInput.addEventListener('input', () => syncInputs(tankInput, tankSlider));
tankSlider.addEventListener('input', () => syncInputs(tankSlider, tankInput));

mpgInput.addEventListener("input", showGif);
mpgSlider.addEventListener("input", showGif);
tankInput.addEventListener("input", showGif);
tankSlider.addEventListener("input", showGif);

["mpg","mpg-slider","tank","tank-slider"].forEach(id => {
  document.getElementById(id).addEventListener("input", playGifOnce);
});

updateChart();