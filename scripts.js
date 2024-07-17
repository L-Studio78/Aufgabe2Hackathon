document.getElementById('fetch-data').addEventListener('click', function() {
    const barcodes = document.getElementById('barcodes').value.split(' ').map(code => code.trim());
    const productPromises = barcodes.map(barcode => fetchProductData(barcode));

    Promise.all(productPromises).then(products => {

        const totalCalories = products.reduce((total, product) => total + calculateTotalValue(product.nutriments && product.nutriments.energy_value, product.nutriments && product.nutriments.energy_unit, product.quantity), 0);
        const totalSugars = products.reduce((total, product) => total + calculateTotalValue(product.nutriments && product.nutriments.sugars_value, product.nutriments && product.nutriments.sugars_unit, product.quantity), 0);
        const totalSalts = products.reduce((total, product) => total + calculateTotalValue(product.nutriments && product.nutriments.salt_value, product.nutriments && product.nutriments.salt_unit, product.quantity), 0);

        const totalQuantity = products.reduce((total, product) => total + parseFloat(product.quantity), 0);

        const dailyCalorieNeeds = 2000; // Annahme: Täglicher Kalorienbedarf
        const dailySugarNeeds = 50; // Annahme: Täglicher Zuckerbedarf
        const dailySaltNeeds = 5; // Annahme: Täglicher Salzbedarf

        document.getElementById('hidden').innerHTML = '<h2>Tagesbedarf</h2>';

        updateProgressBar('calories-progress', 'Kalorien', totalCalories, dailyCalorieNeeds, 'kcal');
        updateProgressBar('sugar-progress', 'Zucker', totalSugars, dailySugarNeeds, 'g');
        updateProgressBar('salt-progress', 'Salz', totalSalts, dailySaltNeeds, 'g');

        updateChart('calories-chart', 'Kalorien (kcal) pro 100g', totalCalories, totalQuantity);
        updateChart('sugar-chart', 'Zucker (g) pro 100g', totalSugars, totalQuantity);
        updateChart('salt-chart', 'Salz (g) pro 100g', totalSalts, totalQuantity);

        // Update background color based on Nutri-Score
        const nutriScores = products.map(product => product.nutriscore_grade);
        const highestNutriScore = getHighestNutriScore(nutriScores);
        document.body.style.backgroundColor = getNutriScoreColor(highestNutriScore);
    });
});

function fetchProductData(barcode) {
    return fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
        .then(response => response.json())
        .then(data => {
            const product = data.product || {};
            return {
                product_name: product.product_name || 'Unbekannt',
                nutriscore_grade: product.nutriscore_grade || 'Keine Angabe',
                nutriments: product.nutriments || {},
                quantity: product.quantity || '100'
            };
        });
}

function calculateTotalValue(value, unit, quantity) {
    if (!value || !unit || !quantity) return 0;

    const valuePer100g = parseFloat(value);
    const totalQuantity = parseFloat(quantity);
    return (valuePer100g * totalQuantity) / 100;
}

function updateProgressBar(progressBarId, label, value, dailyNeeds, unit) {
    const progressBar = new ProgressBar.Circle(`#${progressBarId}`, {
        strokeWidth: 6,
        easing: 'easeInOut',
        duration: 1400,
        color: '#4CAF50', // Grün
        trailColor: '#eee',
        trailWidth: 1,
        svgStyle: null
    });

    const percentage = Math.min(100, (value / dailyNeeds) * 100);
    progressBar.animate(percentage / 100);

    const formattedValue = `${value.toFixed(2)} ${unit}`;
    progressBar.setText(formattedValue);
}

function updateChart(chartId, label, value, totalQuantity) {
    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [label],
            datasets: [{
                label: label,
                data: [(value / totalQuantity * 100).toFixed(2)],
                backgroundColor: ['rgba(75, 192, 192, 0.2)'],
                borderColor: ['rgba(75, 192, 192, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function getHighestNutriScore(nutriScores) {
    const scoreOrder = ['a', 'b', 'c', 'd', 'e'];
    let highestScore = 'e';

    for (const score of nutriScores) {
        if (scoreOrder.indexOf(score) < scoreOrder.indexOf(highestScore)) {
            highestScore = score;
        }
    }

    return highestScore;
}

function getNutriScoreColor(score) {
    switch (score) {
        case 'a':
            return '#4CAF50'; // Green
        case 'b':
            return '#8BC34A'; // Light Green
        case 'c':
            return '#FFEB3B'; // Yellow
        case 'd':
            return '#FF9800'; // Orange
        case 'e':
            return '#F44336'; // Red
        default:
            return '#ffffff'; // White
    }
}

let currentSlideIndex = 0;
displayProjects();

function displayProjects() {
    const projects = [
        {
            name: "Projekt 1",
            description: "Beschreibung des ersten Projekts",
            barcode: "123456789",
            imageUrl: "image1.jpg"
        },
        {
            name: "Projekt 2",
            description: "Beschreibung des zweiten Projekts",
            barcode: "987654321",
            imageUrl: "image2.jpg"
        },
        {
            name: "Projekt 3",
            description: "Beschreibung des dritten Projekts",
            barcode: "567891234",
            imageUrl: "image3.jpg"
        }
    ];

    const projectSelectionContainer = document.getElementById('project-selection');
    projectSelectionContainer.innerHTML = '';

    projects.forEach(project => {
        const projectDiv = document.createElement('div');
        projectDiv.classList.add('project');
        projectDiv.innerHTML = `
            <img src="${project.imageUrl}" alt="${project.name}">
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <button onclick="fetchProductData('${project.barcode}')">Daten abrufen</button>
        `;

        projectSelectionContainer.appendChild(projectDiv);
    });

    showSlide(currentSlideIndex);
}

function changeSlide(step) {
    currentSlideIndex += step;

    const slides = document.getElementsByClassName('project');
    if (currentSlideIndex >= slides.length) {
        currentSlideIndex = 0;
    } else if (currentSlideIndex < 0) {
        currentSlideIndex = slides.length - 1;
    }

    showSlide(currentSlideIndex);
}

function showSlide(index) {
    const slides = document.getElementsByClassName('project');
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.transform = `translateX(-${index * 100}%)`;
    }
}