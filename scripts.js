document.getElementById('fetch-data').addEventListener('click', function() {
    const barcodes = document.getElementById('barcodes').value.split(' ').map(code => code.trim());
    const productPromises = barcodes.map(barcode => fetchProductData(barcode));

    Promise.all(productPromises).then(products => {
        const productNames = products.map(product => product.product_name || 'Unbekannt');
        const nutriScores = products.map(product => {
            switch (product.nutriscore_grade) {
                case 'a': return 1;
                case 'b': return 2;
                case 'c': return 3;
                case 'd': return 4;
                case 'e': return 5;
                default: return 0;
            }
        });
        const caloriesPer100g = products.map(product => calculatePer100g(product.nutriments && product.nutriments.energy_value, product.nutriments && product.nutriments.energy_unit));
        const sugarsPer100g = products.map(product => calculatePer100g(product.nutriments && product.nutriments.sugars_value, product.nutriments && product.nutriments.sugars_unit));
        const fatsPer100g = products.map(product => calculatePer100g(product.nutriments && product.nutriments.fat_value, product.nutriments && product.nutriments.fat_unit));
        const saltsPer100g = products.map(product => calculatePer100g(product.nutriments && product.nutriments.salt_value, product.nutriments && product.nutriments.salt_unit));

        createChart('chart2', 'Kalorien pro 100g', productNames, caloriesPer100g, 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)', 70);
        createChart('chart3', 'Zucker pro 100g', productNames, sugarsPer100g, 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)', 70);
        createChart('chart4', 'Fett pro 100g', productNames, fatsPer100g, 'rgba(153, 102, 255, 0.2)', 'rgba(153, 102, 255, 1)', 70);
        createChart('chart5', 'Salz pro 100g', productNames, saltsPer100g, 'rgba(255, 206, 86, 0.2)', 'rgba(255, 206, 86, 1)', 70);

        // Determine background color based on average Nutri-Score
        const averageNutriScore = calculateAverageNutriScore(nutriScores);
        changeBackgroundColor(averageNutriScore);

        displayProductDetails(products);
        updateProgressBars(caloriesPer100g, sugarsPer100g, fatsPer100g, saltsPer100g);
    });
});

function updateProgressBars(calories, sugars, fats, salts) {
    const totalCalories = calories.reduce((a, b) => a + b, 0);
    const totalSugars = sugars.reduce((a, b) => a + b, 0);
    const totalFats = fats.reduce((a, b) => a + b, 0);
    const totalSalts = salts.reduce((a, b) => a + b, 0);

    updateProgressBar('calories-progress', 'calories-text', totalCalories, 2000);
    updateProgressBar('sugar-progress', 'sugar-text', totalSugars, 50);
    updateProgressBar('fat-progress', 'fat-text', totalFats, 70);
    updateProgressBar('salt-progress', 'salt-text', totalSalts, 6);
}

function updateProgressBar(progressBarId, textId, value, maxValue) {
    const progressBar = document.getElementById(progressBarId);
    const text = document.getElementById(textId);
    const percentage = Math.min(100, (value / maxValue) * 100);

    progressBar.querySelector('span').innerText = `${textId.split('-')[0]}: ${value}/${maxValue}`;
    progressBar.querySelector('::before').style.width = percentage + '%';
}

function fetchProductData(barcode) {
    return fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
        .then(response => response.json())
        .then(data => {
            const product = data.product || {};
            return {
                product_name: product.product_name || 'Unbekannt',
                nutriscore_grade: product.nutriscore_grade || 'Keine Angabe',
                nutriments: product.nutriments || {},
                quantity: product.quantity || 100
            };
        });
}

function calculatePer100g(value, unit) {
    if (!value || !unit) return 0;

    // Convert the value to per 100g
    switch (unit.toLowerCase()) {
        case 'kj':
        case 'kcal':
            return parseFloat((value / 100).toFixed(2)); // Energy values are typically in kJ or kcal per 100g
        default:
            return parseFloat((value * 100 / 100).toFixed(2)); // Assume other nutrients are per 100g/ml
    }
}

function createChart(canvasId, label, labels, data, backgroundColor, borderColor, maxYValue) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: maxYValue
                }
            }
        }
    });
}

function changeBackgroundColor(nutriScore) {
    const body = document.body;
    let color = '';

    switch (nutriScore) {
        case 1:
            color = '#4CAF50';
            break;
        case 2:
            color = '#8BC34A';
            break;
        case 3:
            color = '#FFC107';
            break;
        case 4:
            color = '#FF9800';
            break;
        case 5:
            color = '#F44336';
            break;
        default:
            color = '#FFFFFF';
            break;
    }

    body.style.backgroundColor = color;
}

function calculateAverageNutriScore(nutriScores) {
    const sum = nutriScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / nutriScores.length);
}

document.addEventListener('DOMContentLoaded', function() {
    displayProjectSelection();
    setInterval(() => {
        changeSlide(1); // Wechselt zur nächsten Folie
    }, 3000); // Wechselt alle 3 Sekunden
});

let currentSlideIndex = 0;

function displayProjectSelection() {
    const projects = [
        {
            name: "Projekt 1",
            description: "Beschreibung des Projekts 1",
            barcode: "1234567890123",
            imageUrl: "path/to/image1.jpg" // Pfad zum Bild des Projekts
        },
        {
            name: "Projekt 2",
            description: "Beschreibung des Projekts 2",
            barcode: "2345678901234",
            imageUrl: "path/to/image2.jpg"
        },
        {
            name: "Projekt 3",
            description: "Beschreibung des Projekts 3",
            barcode: "3456789012345",
            imageUrl: "path/to/image3.jpg"
        }
    ];

    const projectSelectionContainer = document.getElementById('project-selection');
    projectSelectionContainer.innerHTML = ''; // Clear previous content

    projects.forEach((project, index) => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project';

        projectDiv.innerHTML = `
            <img src="${project.imageUrl}" alt="${project.name}">
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <button onclick="fetchProjectData('${project.barcode}')">Daten abrufen</button>
        `;

        projectSelectionContainer.appendChild(projectDiv);
    });

    showSlide(currentSlideIndex);
}

function showSlide(index) {
    const slides = document.getElementsByClassName('project');
    if (index >= slides.length) { currentSlideIndex = 0; }
    if (index < 0) { currentSlideIndex = slides.length - 1; }
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.transform = `translateX(${(-currentSlideIndex * 100)}%)`;
    }
}

function changeSlide(direction) {
    currentSlideIndex += direction;
    showSlide(currentSlideIndex);
}

function fetchProjectData(barcode) {
    // Funktion zum Abrufen von Projektdaten basierend auf dem Barcode
    fetchProductData(barcode).then(product => {
        const productNames = [product.product_name || 'Unbekannt'];
        const nutriScores = [getNutriScoreValue(product.nutriscore_grade)];
        const caloriesPer100g = [calculatePer100g(product.nutriments && product.nutriments.energy_value, product.nutriments && product.nutriments.energy_unit)];
        const sugarsPer100g = [calculatePer100g(product.nutriments && product.nutriments.sugars_value, product.nutriments && product.nutriments.sugars_unit)];
        const fatsPer100g = [calculatePer100g(product.nutriments && product.nutriments.fat_value, product.nutriments && product.nutriments.fat_unit)];
        const saltsPer100g = [calculatePer100g(product.nutriments && product.nutriments.salt_value, product.nutriments && product.nutriments.salt_unit)];

        createChart('chart2', 'Kalorien pro 100g', productNames, caloriesPer100g, 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)', 70);
        createChart('chart3', 'Zucker pro 100g', productNames, sugarsPer100g, 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)', 70);
        createChart('chart4', 'Fett pro 100g', productNames, fatsPer100g, 'rgba(153, 102, 255, 0.2)', 'rgba(153, 102, 255, 1)', 70);
        createChart('chart5', 'Salz pro 100g', productNames, saltsPer100g, 'rgba(255, 206, 86, 0.2)', 'rgba(255, 206, 86, 1)', 70);

        displayProductDetails([product]);
    });
}

function getNutriScoreValue(nutriScore) {
    switch (nutriScore) {
        case 'a': return 1;
        case 'b': return 2;
        case 'c': return 3;
        case 'd': return 4;
        case 'e': return 5;
        default: return 0;
    }
}
