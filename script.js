const mpgInput = document.getElementById('mpg');
const tankInput = document.getElementById('tank');
const mpgSlider = document.getElementById('mpg-slider');
const tankSlider = document.getElementById('tank-slider');
const ctx = document.getElementById('rangeChart').getContext('2d');
const slopeDisplay = document.getElementById('slope');
const interceptDisplay = document.getElementById('intercept');
const car = document.querySelector('.car'); // Updated selector to target the .car div

let chart;

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
  car.classList.add('spinning');
  setTimeout(() => {
    car.classList.remove('spinning');
  }, 1000); // Duration matches the animation duration
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

updateChart();