document.getElementById('fetch-data').addEventListener('click', function() {
    const barcodes = document.getElementById('barcodes').value.split(' ').map(code => code.trim());
    const productPromises = barcodes.map(barcode => fetchProductData(barcode));

    Promise.all(productPromises).then(products => {
        const totalCalories = products.reduce((total, product) => total + calculateTotalValue(product.nutriments && product.nutriments.energy_value, product.nutriments && product.nutriments.energy_unit, product.quantity), 0);
        const totalSugars = products.reduce((total, product) => total + calculateTotalValue(product.nutriments && product.nutriments.sugars_value, product.nutriments && product.nutriments.sugars_unit, product.quantity), 0);
        const totalSalts = products.reduce((total, product) => total + calculateTotalValue(product.nutriments && product.nutriments.salt_value, product.nutriments && product.nutriments.salt_unit, product.quantity), 0);

        const totalQuantity = products.reduce((total, product) => total + parseFloat(product.quantity), 0);

        const dailyCalorieNeeds = 10000; // Annahme: Täglicher Kalorienbedarf
        const dailySugarNeeds = 50; // Annahme: Täglicher Zuckerbedarf
        const dailySaltNeeds = 5; // Annahme: Täglicher Salzbedarf
        const carbonFootprints = products.map(product => product.carbon_footprint);
    
        updateCarbonFootprintChart(carbonFootprints, totalQuantity);


        document.getElementById('hidden').innerHTML = '<h2>Tagesbedarf</h2>';
        document.getElementById('sel').innerHTML = '<h2>Ökologischer Fußabdruck</h2>';

        updateProgressBar('calories-progress', 'Kalorien', totalCalories, dailyCalorieNeeds, 'kj');
        updateProgressBar('sugar-progress', 'Zucker', totalSugars, dailySugarNeeds, 'g');
        updateProgressBar('salt-progress', 'Salz', totalSalts, dailySaltNeeds, 'g');

        updateChart('calories-chart', 'Kalorien (kj) pro 100g', totalCalories, totalQuantity);
        updateChart('sugar-chart', 'Zucker (g) pro 100g', totalSugars, totalQuantity);
        updateChart('salt-chart', 'Salz (g) pro 100g', totalSalts, totalQuantity);

        // Update background color based on Nutri-Score
        const nutriScores = products.map(product => product.nutriscore_grade);
        const highestNutriScore = getHighestNutriScore(nutriScores);
        document.body.style.background = getNutriScoreColor(highestNutriScore);

        // Update allergen and vegan information
        updateProductDetails(products);
        playSound(highestNutriScore);
    });
});

function fetchProductData(barcode) {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok for ${url}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('API response:', data); // Debugging: Log the API response

            const product = data.product || {};
            return {
                product_name: product.product_name || 'Unbekannt',
                nutriscore_grade: product.nutriscore_grade || 'Keine Angabe',
                nutriments: product.nutriments || {},
                quantity: product.quantity || '100',
                allergens: product.allergens_tags || [],
                ingredients: product.ingredients_text || '',
                vegan: product.labels_tags && product.labels_tags.includes('en:vegan') ? 'ja' : 'nein',
                carbon_footprint: product.carbon_footprint || 0
            };
        })
        .catch(error => {
            console.error('Error fetching product data:', error);
            // Handle errors or propagate them further as needed
            throw error;
        });
}

function updateCarbonFootprintChart(carbonFootprints, totalQuantity) {
    const ctx = document.getElementById('carbon-footprint-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Carbon Footprint (kg CO2eq) pro 100g'],
            datasets: [{
                label: 'Carbon Footprint (kg CO2eq) pro 100g',
                data: [calculateCarbonFootprintPercentage(carbonFootprints, totalQuantity)],
                backgroundColor: ['rgba(255, 99, 132, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)'],
                borderWidth: 1,
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

function calculateCarbonFootprintPercentage(carbonFootprints, totalQuantity) {
    if (!carbonFootprints || !totalQuantity) return 0;

    const totalCarbonFootprint = carbonFootprints.reduce((total, footprint) => total + parseFloat(footprint), 0);
    return (totalCarbonFootprint / totalQuantity) * 100;
}

function calculateTotalValue(value, unit, quantity) {
    if (!value || !unit || !quantity) return 0;

    const valuePer100g = parseFloat(value);
    const totalQuantity = parseFloat(quantity);
    return (valuePer100g * totalQuantity) / 100;
}

function updateProgressBar(progressBarId, label, value, dailyNeeds, unit) {
    if (!value || !dailyNeeds) return;

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
    if (!value || !totalQuantity) return;

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
            return 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)'; // Green to Light Green
        case 'b':
            return 'linear-gradient(90deg, #8BC34A 0%, #FFEB3B 100%)'; // Light Green to Yellow
        case 'c':
            return 'linear-gradient(90deg, #FFEB3B 0%, #FF9800 100%)'; // Yellow to Orange
        case 'd':
            return 'linear-gradient(90deg, #FF9800 0%, #F44336 100%)'; // Orange to Red
        case 'e':
            return 'linear-gradient(90deg, #F44336 0%, #F44336 100%)'; // Red (single color)
        default:
            return 'linear-gradient(90deg, #F44336 0%, #F44336 100%)'; // White (or another default color)
    }
}


function updateProductDetails(products) {
    const productDetailsContainer = document.getElementById('product-details');
    productDetailsContainer.innerHTML = '';

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-details');

        const allergenInfo = getAllergenInfo(product.allergens, product.ingredients);
        const veganInfo = product.vegan === 'ja' ? '🌱 Vegan' : '❌ Nicht vegan';

        productDiv.innerHTML = `
            <div class="hidden">
                <h2>Unverträglichkeit<h2/>
            </div>
            <div class="allergen-info">
                <div class="icon-container" style="border: 2px solid ${allergenInfo.includes('Gluten') ? 'red' : 'green'};">
                    <span style="font-size: 40px;">🌾</span>
                    <span>Gluten</span>
                </div>
                <div class="icon-container" style="border: 2px solid ${allergenInfo.includes('Milch') ? 'red' : 'green'};">
                    <span style="font-size: 40px;">🥛</span>
                    <span>Milch</span>
                </div>
                <div class="icon-container" style="border: 2px solid ${allergenInfo.includes('Eier') ? 'red' : 'green'};">
                    <span style="font-size: 40px;">🥚</span>
                    <span>Eier</span>
                </div>
                <div class="icon-container" style="border: 2px solid ${allergenInfo.includes('Nüsse') ? 'red' : 'green'};">
                    <span style="font-size: 40px;">🥜</span>
                    <span>Nüsse</span>
                </div>
                <div class="icon-container" style="border: 2px solid ${allergenInfo.includes('Soja') ? 'red' : 'green'};">
                    <span style="font-size: 40px;">🌱</span>
                    <span>Soja</span>
                </div>
                <div class="icon-container" style="border: 2px solid ${allergenInfo.includes('Fisch') ? 'red' : 'green'};">
                    <span style="font-size: 40px;">🐟</span>
                    <span>Fisch</span>
                </div>
            </div>

            <br><br><br>

            <div class="allergen-info">
                <span>${veganInfo}</span>
            </div>
        `;

        productDetailsContainer.appendChild(productDiv);
    });
}

function getAllergenInfo(allergens, ingredients) {
    const allergenMap = {
        gluten: '🌾 Gluten',
        milk: '🥛 Milch',
        eggs: '🥚 Eier',
        nuts: '🥜 Nüsse',
        soy: '🌱 Soja',
        fish: '🐟 Fisch'
    };

    let allergenInfo = '';

    Object.keys(allergenMap).forEach(key => {
        if (allergens.includes(`en:${key}`) || ingredients.toLowerCase().includes(key)) {
            allergenInfo += `${allergenMap[key]}, `;
        }
    });

    return allergenInfo.length > 0 ? allergenInfo.slice(0, -2) : 'Keine bekannten Allergene';
}

let currentSlideIndex = 0;
displayProjects();

function displayProjects() {
    const projects = [
        {
            name: "Projekt 1",
            description: "Beschreibung des ersten Projekts",
            barcode: "5059697734953",
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

function playSound(nutriScore) {
    let soundFile;

    switch (nutriScore) {
        case 'a':
            soundFile = 'Sounds/good.mp3';
            break;
        case 'b':
            soundFile = 'Sounds/Okay.mp3';
            break;
        case 'c':
            soundFile = 'Sounds/Okay.mp3';
            break;
        case 'd':
            soundFile = 'Sounds/Bad.mp3';
            break;
        case 'e':
            soundFile = 'Sounds/Bad.mp3';
            break;
        default:
            return;
    }

    const audio = new Audio(soundFile);
    audio.play();
}