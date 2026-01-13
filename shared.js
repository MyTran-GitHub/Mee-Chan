// Donor strategy data
        const donorStrategies = {
            random: {
                title: 'Random Statewide Donors (500 untreated pixels)',
                desc: 'Randomly sample 500 untreated conifer pixels statewide. No explicit constraint on ecological similarity; relies on large sample to approximate covariate distributions.',
                rmspeMedian: '0.45',
                rmspeIQR: '0.15–0.62',
                embedLabel: 'Random donors: dispersed in embedding space',
                color: '#9ca3af'
            },
            manual: {
                title: 'Manual Covariate Screen (284 untreated pixels)',
                desc: 'Select donors within ±200 m elevation, ±1°C average temperature, and ±15% canopy cover. Incorporates observable covariates but may miss latent ecological heterogeneity.',
                rmspeMedian: '0.36',
                rmspeIQR: '0.12–0.52',
                embedLabel: 'Manual donors: moderately clustered in embedding space',
                color: '#f59e0b'
            },
            embedding: {
                title: 'Embedding-Based K=50 (top nearest neighbors)',
                desc: 'Select the 50 nearest neighbors in satellite embedding space (PrithVi V2, 512-dim). Captures unobserved ecological structure including fuel configuration, microclimate, and disturbance legacies.',
                rmspeMedian: '0.23',
                rmspeIQR: '0.09–0.38',
                embedLabel: 'Embedding donors: tightly clustered in latent space',
                color: '#16a34a'
            }
        };

        function switchDonorStrategy(strategy) {
            const strategies = {
                'random': {
                    title: 'Random Statewide Donors (500 untreated pixels)',
                    desc: 'Randomly sample 500 untreated conifer pixels statewide. No explicit constraint on ecological similarity; relies on large sample to approximate covariate distributions.',
                    rmspe: '0.45',
                    iqr: '0.15–0.62',
                    randomDisplay: 'block',
                    manualDisplay: 'none',
                    embeddingDisplay: 'none',
                    embedLabel: 'Random donors: dispersed in embedding space'
                },
                'manual': {
                    title: 'Manual Covariate Screen (284 untreated pixels)',
                    desc: 'Filter statewide pixels using explicit covariate thresholds: slope < 15°, elevation 400–2000m, forest type in [DF, PP]. Tighter ecological similarity constraints.',
                    rmspe: '0.36',
                    iqr: '0.18–0.58',
                    randomDisplay: 'none',
                    manualDisplay: 'block',
                    embeddingDisplay: 'none',
                    embedLabel: 'Manual donors: moderately clustered in embedding space'
                },
                'embedding': {
                    title: 'Embedding-Based K=50 (50 nearest neighbors)',
                    desc: 'Select K=50 untreated pixels nearest to treated pixel in learned embedding space. Highest ecological and spectral similarity; trade-off between balance and sample size.',
                    rmspe: '0.23',
                    iqr: '0.10–0.41',
                    randomDisplay: 'none',
                    manualDisplay: 'none',
                    embeddingDisplay: 'block',
                    embedLabel: 'Embedding donors: tightly clustered in latent space'
                }
            };

            const strat = strategies[strategy];
            if (strat) {
                document.getElementById('strategy-title').textContent = strat.title;
                document.getElementById('strategy-desc').textContent = strat.desc;
                document.getElementById('rmspe-median').textContent = strat.rmspe;
                document.getElementById('rmspe-iqr').textContent = strat.iqr;
                document.getElementById('random-donors').style.display = strat.randomDisplay;
                document.getElementById('manual-donors').style.display = strat.manualDisplay;
                document.getElementById('embedding-donors').style.display = strat.embeddingDisplay;
                document.getElementById('embed-label').textContent = strat.embedLabel;
            }
        }

// AWD Threshold images and data
        const awdThresholds = [
            {idx: 0, value: 25, src: "assets/awd-thresh-25.png", label: "-25 mm", suitableArea: 18, dekads: 22},
            {idx: 1, value: 50, src: "assets/awd-thresh-50.png", label: "-50 mm", suitableArea: 32, dekads: 48},
            {idx: 2, value: 70, src: "assets/awd-thresh-70.png", label: "-70 mm", suitableArea: 42, dekads: 60},
            {idx: 3, value: 90, src: "assets/awd-thresh-90.png", label: "-90 mm", suitableArea: 52, dekads: 68},
            {idx: 4, value: 110, src: "assets/awd-thresh-110.png", label: "-110 mm", suitableArea: 62, dekads: 75},
            {idx: 5, value: 130, src: "assets/awd-thresh-130.png", label: "-130 mm", suitableArea: 66, dekads: 80},
            {idx: 6, value: 150, src: "assets/awd-thresh-150.png", label: "-150 mm", suitableArea: 69, dekads: 85}
        ];

        function updateDeficitThreshold(value) {
            const idx = parseInt(value);
            const threshold = awdThresholds[idx];
            
            // Update label and image
            document.getElementById('deficit-threshold-value').textContent = threshold.label;
            document.getElementById('awd-threshold-label').textContent = threshold.label + ' Threshold';
            document.getElementById('awd-threshold-image').src = threshold.src;
            
            // Update statistics
            document.getElementById('suitable-area-pct').textContent = threshold.suitableArea + '%';
            document.getElementById('deficit-dekads').textContent = threshold.dekads + '%';
            
            updateMapDisplay();
        }

        // Map Layer Toggle
        let currentMapLayer = 'water-balance';
        
        function setMapLayer(layer) {
            currentMapLayer = layer;
        }

        function updateMapDisplay() {
            const layerLabels = {
                'water-balance': 'Water Balance Suitability (threshold-based)',
                'biophysical': 'Biophysical Constraints Layer',
                'composite': 'Composite AWD Suitability Map (Actual Result)'
            };

            const layerDescriptions = {
                'water-balance': 'Shows areas with sufficient precipitation deficit to allow safe drying. Red = persistent surplus; Yellow = occasional deficit; Green = frequent deficit. Note: This layer overestimates suitability—ignores slope, drainage, pH constraints.',
                'biophysical': 'Shows physical capacity of land to support AWD. Green = flat clay-rich soils with good drainage; Yellow = mixed conditions; Red = steep slopes, poor drainage, or extreme pH. Biophysical constraints override water balance.',
                'composite': 'Integration of water balance AND biophysical constraints. Only areas that are BOTH water-deficit AND biophysically favorable are suitable. This is the realistic, deployable map.'
            };

            document.getElementById('map-layer-label').textContent = layerLabels[currentMapLayer];
            document.getElementById('map-layer-description').textContent = layerDescriptions[currentMapLayer];

            // Update gradient based on layer
            const mapElement = document.getElementById('awd-map-canvas');
            if (mapElement) {
                const gradients = {
                    'water-balance': 'linear-gradient(135deg, #ef4444 0%, #fbbf24 33%, #86efac 100%)',
                    'biophysical': 'linear-gradient(135deg, #dc2626 0%, #fbbf24 50%, #22c55e 100%)',
                    'composite': 'linear-gradient(135deg, #991b1b 0%, #ea580c 25%, #eab308 50%, #84cc16 75%, #16a34a 100%)'
                };
                mapElement.style.background = gradients[currentMapLayer];
            }
        }

        // Donor Strategy Switching (mirrors tab behavior)
        function switchDonorStrategy(strategy) {
            const strategies = {
                'random': {
                    title: 'Random Statewide Donors (500 untreated pixels)',
                    desc: 'Randomly sample 500 untreated conifer pixels statewide. No explicit constraint on ecological similarity; relies on large sample to approximate covariate distributions.',
                    rmspe: '0.45',
                    iqr: '0.15–0.62',
                    randomDisplay: 'block',
                    manualDisplay: 'none',
                    embeddingDisplay: 'none',
                    embedLabel: 'Random donors: dispersed in embedding space'
                },
                'manual': {
                    title: 'Manual Covariate Screen (284 untreated pixels)',
                    desc: 'Filter statewide pixels using explicit covariate thresholds: slope < 15°, elevation 400–2000m, forest type in [DF, PP]. Tighter ecological similarity constraints.',
                    rmspe: '0.36',
                    iqr: '0.18–0.58',
                    randomDisplay: 'none',
                    manualDisplay: 'block',
                    embeddingDisplay: 'none',
                    embedLabel: 'Manual donors: moderately clustered in embedding space'
                },
                'embedding': {
                    title: 'Embedding-Based K=50 (50 nearest neighbors)',
                    desc: 'Select K=50 untreated pixels nearest to treated pixel in learned embedding space. Highest ecological and spectral similarity; trade-off between balance and sample size.',
                    rmspe: '0.23',
                    iqr: '0.10–0.41',
                    randomDisplay: 'none',
                    manualDisplay: 'none',
                    embeddingDisplay: 'block',
                    embedLabel: 'Embedding donors: tightly clustered in latent space'
                }
            };

            const strat = strategies[strategy];
            if (!strat) return;
            const titleEl = document.getElementById('strategy-title');
            const descEl = document.getElementById('strategy-desc');
            const rmspeEl = document.getElementById('rmspe-median');
            const iqrEl = document.getElementById('rmspe-iqr');
            const randomGroup = document.getElementById('random-donors');
            const manualGroup = document.getElementById('manual-donors');
            const embeddingGroup = document.getElementById('embedding-donors');
            const embedLabelEl = document.getElementById('embed-label');

            if (titleEl) titleEl.textContent = strat.title;
            if (descEl) descEl.textContent = strat.desc;
            if (rmspeEl) rmspeEl.textContent = strat.rmspe;
            if (iqrEl) iqrEl.textContent = strat.iqr;
            if (randomGroup) randomGroup.style.display = strat.randomDisplay;
            if (manualGroup) manualGroup.style.display = strat.manualDisplay;
            if (embeddingGroup) embeddingGroup.style.display = strat.embeddingDisplay;
            if (embedLabelEl) embedLabelEl.textContent = strat.embedLabel;
        }

        // Tab Switching
        function switchTab(tabId, buttonElement) {
            // Hide all tabs
            const tabs = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => {
                tab.classList.remove('active');
                tab.style.display = 'none';
            });

            // Remove active class from all buttons
            const buttons = document.querySelectorAll('.tab-btn');
            buttons.forEach(btn => {
                btn.classList.remove('active');
            });

            // Show selected tab and mark button active
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) {
                selectedTab.classList.add('active');
                selectedTab.style.display = 'block';
            }
            if (buttonElement) {
                buttonElement.classList.add('active');
            }
        }

        const argentinaBayesData = {
            x: [0.1, 0.3, 0.5, 0.8, 1.2, 1.5, 2.1, 2.8, 3.5, 4.2, 5.1, 6.3, 7.2, 8.7],
            y: [0.02, 0.05, 0.08, 0.12, 0.18, 0.22, 0.28, 0.35, 0.41, 0.48, 0.55, 0.62, 0.71, 0.82]
        };

        const argentinaBayesLines = {
            prior: [
                { color: '#64748b', width: 3, dash: [], func: (x) => 0.135 + 0.6 * x * 0.12 }
            ],
            posterior: [
                { color: '#3b82f6', width: 4, dash: [], func: (x) => 0.135 + 0.145 * x - 0.02 * x * x + 0.002 * x * x * x },
                { color: '#10b981', width: 3, dash: [], func: (x) => 0.135 + 0.14 * x - 0.015 * x * x },
                { color: '#f59e0b', width: 2, dash: [6, 6], func: (x) => 0.135 + 0.13 * x }
            ]
        };

        function drawArgentinaBayesPlot(canvas, viewKey) {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const bounds = canvas.getBoundingClientRect();
            canvas.width = bounds.width;
            canvas.height = 420;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // grid
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 10; i++) {
                const x = (i / 10) * canvas.width;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();

                const y = (i / 10) * canvas.height;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // data points
            argentinaBayesData.x.forEach((xVal, i) => {
                const px = (xVal / 9) * canvas.width * 0.8 + canvas.width * 0.1;
                const py = canvas.height - (argentinaBayesData.y[i] * canvas.height * 0.7 + canvas.height * 0.15);
                ctx.fillStyle = xVal > 7 ? '#fbbf24' : '#ef4444';
                ctx.beginPath();
                ctx.arc(px, py, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });

            // model lines
            const lines = argentinaBayesLines[viewKey] || [];
            lines.forEach((line) => {
                ctx.strokeStyle = line.color;
                ctx.lineWidth = line.width;
                ctx.setLineDash(line.dash || []);
                ctx.beginPath();
                for (let x = 0; x <= 9; x += 0.1) {
                    const y = line.func(x);
                    const px = (x / 9) * canvas.width * 0.8 + canvas.width * 0.1;
                    const py = canvas.height - (y * canvas.height * 0.7 + canvas.height * 0.15);
                    if (x === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                ctx.stroke();
                ctx.setLineDash([]);
            });

            // axes
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(canvas.width * 0.1, canvas.height * 0.85);
            ctx.lineTo(canvas.width * 0.9, canvas.height * 0.85);
            ctx.lineTo(canvas.width * 0.9, canvas.height * 0.15);
            ctx.stroke();

            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Total Revenue (Trillions ARS)', canvas.width * 0.5, canvas.height * 0.94);
            ctx.save();
            ctx.translate(canvas.width * 0.95, canvas.height * 0.5);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('Wage Expenditure (Trillions ARS)', 0, 0);
            ctx.restore();
        }

        function initArgentinaBayes() {
            const card = document.getElementById('argentina-bayes-card');
            if (!card) return;

            const buttons = card.querySelectorAll('.bayes-tab-btn');
            const tabs = card.querySelectorAll('.bayes-tab-content');
            const canvas = card.querySelector('#bayes-plot');
            let currentView = 'bayes-prior';

            const setView = (targetId) => {
                currentView = targetId;
                buttons.forEach((btn) => btn.classList.toggle('active', btn.dataset.target === targetId));
                tabs.forEach((tab) => {
                    const isActive = tab.id === targetId;
                    tab.hidden = !isActive;
                    tab.style.display = isActive ? 'block' : 'none';
                });
                const viewKey = targetId === 'bayes-posterior' ? 'posterior' : 'prior';
                drawArgentinaBayesPlot(canvas, viewKey);
            };

            buttons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    const targetId = btn.dataset.target;
                    if (targetId) {
                        setView(targetId);
                    }
                });
            });

            window.addEventListener('resize', () => {
                const viewKey = currentView === 'bayes-posterior' ? 'posterior' : 'prior';
                drawArgentinaBayesPlot(canvas, viewKey);
            });

            setView(currentView);
        }

        // Initialize tab display and donor strategy switching
        document.addEventListener('DOMContentLoaded', function() {
            const tabButtons = document.querySelectorAll('.tab-container .tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');

            const activateTab = (targetId) => {
                tabButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.target === targetId);
                });

                tabContents.forEach(tab => {
                    const isTarget = tab.id === targetId;
                    tab.classList.toggle('active', isTarget);
                    tab.style.display = isTarget ? 'block' : 'none';
                });
            };

            tabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.dataset.target;
                    if (targetId) {
                        activateTab(targetId);
                    }
                });
            });

            if (tabButtons.length > 0) {
                const defaultTarget = tabButtons[0].dataset.target;
                activateTab(defaultTarget);
            }

            // Donor strategy buttons
            const strategyButtons = document.querySelectorAll('.donor-strategy-container .toggle-btn');
            strategyButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const strategy = btn.dataset.strategy;
                    if (strategy) {
                        // Update active button styling
                        strategyButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        // Call the strategy switch function
                        switchDonorStrategy(strategy);
                    }
                });
            });

            initArgentinaBayes();
        });

        // AWD Water Deficit Threshold Slider
        function updateDeficitThreshold(value) {
            const thresholds = [0, -10, -30, -50, -75, -100, -150];
            const suitableAreas = [8, 15, 22, 32, 42, 48, 62];
            const deficitDekads = [12, 22, 32, 48, 62, 72, 90];
            const mapImages = [
                'assets/awd-thresh-0.png',
                'assets/awd-thresh-10.png',
                'assets/awd-thresh-30.png',
                'assets/awd-thresh-50.png',
                'assets/awd-thresh-75.png',
                'assets/awd-thresh-100.png',
                'assets/awd-thresh-150.png'
            ];
            const labels = [
                '0 mm Threshold',
                '−10 mm Threshold',
                '−30 mm Threshold',
                '−50 mm Threshold',
                '−75 mm Threshold',
                '−100 mm Threshold',
                '−150 mm Threshold'
            ];

            const threshold = thresholds[value];
            const suitableArea = suitableAreas[value];
            const dekads = deficitDekads[value];
            const mapImage = mapImages[value];
            const label = labels[value];

            // Update display values
            document.getElementById('deficit-threshold-value').textContent = threshold;
            document.getElementById('suitable-area-pct').textContent = suitableArea;
            document.getElementById('deficit-dekads').textContent = dekads;

            // Update image and label
            const img = document.getElementById('awd-threshold-image');
            const labelSpan = document.getElementById('awd-threshold-label');
            
            if (img) {
                img.src = mapImage;
                img.alt = label;
            }
            if (labelSpan) {
                labelSpan.textContent = label;
            }
        }

        // Node selection for institutional analysis
        function selectNode(nodeId) {
            const nodes = document.querySelectorAll('.node');
            nodes.forEach(node => {
                node.classList.remove('selected');
            });
            const selectedNode = document.getElementById(nodeId);
            if (selectedNode) {
                selectedNode.classList.add('selected');
            }
        }

        function toggleScenario(scenario) {
            const descriptions = {
                'vietnam': 'Vietnam baseline: AWD adoption in Mekong delta with established farmer networks and IRRI extension infrastructure. 45% of paddies biophysically suitable; contiguous geography enables unified extension campaigns.',
                'japan': 'Japan transfer scenario: AWD implementation challenge with fragmented geography, steeper slopes, and lower baseline extension capacity. 18% of paddies biophysically suitable; spatial clustering 3.8× weaker than Vietnam. Institutional feasibility varies by region.'
            };
            
            document.getElementById('scenario-description').textContent = descriptions[scenario];
        }
// Bayesian Model Comparison Tab Switching
function switchBayesTab(targetId, clickedButton) {
    // Hide all tab contents
    const allContents = document.querySelectorAll('.bayes-tab-content');
    allContents.forEach(content => {
        content.setAttribute('hidden', '');
    });

    // Remove active class from all buttons
    const allButtons = document.querySelectorAll('.bayes-tab-btn');
    allButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Show the selected tab content
    const selectedContent = document.getElementById(targetId);
    if (selectedContent) {
        selectedContent.removeAttribute('hidden');
    }

    // Add active class to the clicked button
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}

// Initialize Bayesian tabs on page load
document.addEventListener('DOMContentLoaded', function() {
    const bayesBtns = document.querySelectorAll('.bayes-tab-btn');
    bayesBtns.forEach((btn, index) => {
        btn.addEventListener('click', function(e) {
            switchBayesTab(this.getAttribute('data-target'), this);
        });
        
        // Set first tab as active by default
        if (index === 0) {
            btn.classList.add('active');
        }
    });
});
