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
                    suggestedMax: maxYValue // Set the maximum value for y-axis
                }
            }
        }
    });
}

function displayProductDetails(products) {
    const productDetailsContainer = document.getElementById('product-details');
    productDetailsContainer.innerHTML = ''; // Clear previous details

    products.forEach(product => {
        const productInfo = document.createElement('div');
        productInfo.className = 'product-info';
        
        const productName = product.product_name;
        const caloriesPer100g = calculatePer100g(product.nutriments && product.nutriments.energy_value, product.nutriments && product.nutriments.energy_unit);
        const fatPer100g = calculatePer100g(product.nutriments && product.nutriments.fat_value, product.nutriments && product.nutriments.fat_unit);
        const sugarsPer100g = calculatePer100g(product.nutriments && product.nutriments.sugars_value, product.nutriments && product.nutriments.sugars_unit);
        const saltPer100g = calculatePer100g(product.nutriments && product.nutriments.salt_value, product.nutriments && product.nutriments.salt_unit);
        const nutriScore = product.nutriscore_grade ? product.nutriscore_grade.toUpperCase() : 'Keine Angabe';

        productInfo.innerHTML = `
            <h2>${productName}</h2>
            <p><strong>Kalorien pro 100g:</strong> ${caloriesPer100g} kcal</p>
            <p><strong>Fett pro 100g:</strong> ${fatPer100g} g</p>
            <p><strong>Zucker pro 100g:</strong> ${sugarsPer100g} g</p>
            <p><strong>Salz pro 100g:</strong> ${saltPer100g} g</p>
            <p><strong>Nutri-Score:</strong> ${nutriScore}</p>
            <p><strong>Gesundheitsbewertung:</strong> ${evaluateHealthiness(nutriScore, caloriesPer100g, fatPer100g, sugarsPer100g, saltPer100g)}</p>
        `;

        productDetailsContainer.appendChild(productInfo);
    });
}

function evaluateHealthiness(nutriScore, calories, fat, sugars, salt) {
    // Eine einfache Bewertungslogik basierend auf Nutri-Score und Nährwertangaben pro 100g
    if (nutriScore === 'A') {
        return 'Sehr gesund';
    } else if (nutriScore === 'B') {
        return 'Gesund';
    } else if (nutriScore === 'C') {
        return 'Mäßig gesund';
    } else if (nutriScore === 'D') {
        return 'Ungesund';
    } else if (nutriScore === 'E') {
        return 'Sehr ungesund';
    } else {
        return 'Unbekannt';
    }
}

function calculateAverageNutriScore(nutriScores) {
    if (nutriScores.length === 0) return 0;

    const sum = nutriScores.reduce((acc, score) => acc + score, 0);
    return sum / nutriScores.length;
}

function changeBackgroundColor(averageNutriScore) {
    const body = document.body;

    // Change background color based on average Nutri-Score
    if (averageNutriScore >= 1 && averageNutriScore <= 2) {
        body.style.backgroundColor = '#98FB98'; // Light green for very healthy
    } else if (averageNutriScore >= 3 && averageNutriScore <= 3.5) {
        body.style.backgroundColor = '#FFD700'; // Gold for moderately healthy
    } else if (averageNutriScore >= 4 && averageNutriScore <= 5) {
        body.style.backgroundColor = '#FF6347'; // Tomato for unhealthy
    } else {
        body.style.backgroundColor = '#F0F0F0'; // Default background color
    }
}
