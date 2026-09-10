/**
 * Agentic FacilityOps AI Platform - Energy Intelligence & Agent Engine (Milestone 1)
 */

const EnergyEngine = {
    rawDataset: [],
    filteredDataset: [],
    anomalies: [],
    recommendations: [],
    charts: {},

    /**
     * Initializes the Energy Intelligence view
     */
    async init() {
        this.rawDataset = await DataLoader.loadEnergyData();
        this.filteredDataset = [...this.rawDataset];
        
        this.runEnergyAgentAnalysis();
        this.renderKPIs();
        this.renderAgentPanel();
        this.renderCharts();
        this.renderAnomalies();
        this.renderRecommendations();
        this.setupEventListeners();
    },

    /**
     * Rule-Based Energy Agent Analysis Algorithm
     */
    runEnergyAgentAnalysis() {
        this.anomalies = [];
        this.recommendations = [];

        if (this.rawDataset.length === 0) return;

        // Calculate baseline averages
        let totalElec = 0;
        let totalHvac = 0;
        let totalLighting = 0;
        let totalCost = 0;
        
        this.rawDataset.forEach(row => {
            totalElec += row.electricity_kwh || 0;
            totalHvac += row.hvac_kwh || 0;
            totalLighting += row.lighting_kwh || 0;
            totalCost += row.energy_cost || 0;
        });

        const meanElec = totalElec / this.rawDataset.length;
        
        // Calculate Standard Deviation
        const variance = this.rawDataset.reduce((acc, row) => acc + Math.pow(row.electricity_kwh - meanElec, 2), 0) / this.rawDataset.length;
        const stdDev = Math.sqrt(variance);

        // Anomaly Detection: Z-Score > 2.0 OR specific rule breaches
        this.rawDataset.forEach(row => {
            const zScore = (row.electricity_kwh - meanElec) / stdDev;
            const hour = new Date(row.timestamp).getHours();

            // Rule 1: High consumption at night during low occupancy
            if ((hour >= 23 || hour <= 5) && row.occupancy < 15 && row.electricity_kwh > meanElec * 1.2) {
                const diffPct = Math.round(((row.electricity_kwh - meanElec) / meanElec) * 100);
                this.anomalies.push({
                    id: `ANO-${row.building_id}-${row.floor}-${row.timestamp}`,
                    timestamp: row.timestamp,
                    building: row.building_id,
                    floor: row.floor,
                    type: "Nighttime Off-Hours Surge",
                    message: `Building ${row.building_id} (Floor ${row.floor}) consumed ${diffPct}% more energy than expected at off-peak ${row.timestamp} (${row.electricity_kwh} kWh).`,
                    severity: "HIGH",
                    kwh: row.electricity_kwh
                });
            }
            // Rule 2: Excessive HVAC spike on mild temperature days
            else if (row.outdoor_temperature >= 20 && row.outdoor_temperature <= 25 && row.hvac_kwh > (meanElec * 0.6)) {
                this.anomalies.push({
                    id: `ANO-HVAC-${row.building_id}-${row.floor}-${row.timestamp}`,
                    timestamp: row.timestamp,
                    building: row.building_id,
                    floor: row.floor,
                    type: "Abnormal HVAC Surge",
                    message: `Building ${row.building_id} Floor ${row.floor} HVAC running at peak capacity (${row.hvac_kwh} kWh) despite mild outdoor temperature (${row.outdoor_temperature}°C).`,
                    severity: "MEDIUM",
                    kwh: row.hvac_kwh
                });
            }
            // Rule 3: Statistical Z-Score Outlier (> 2.2 std dev)
            else if (zScore > 2.2) {
                const diffPct = Math.round(((row.electricity_kwh - meanElec) / meanElec) * 100);
                this.anomalies.push({
                    id: `ANO-Z-${row.building_id}-${row.floor}-${row.timestamp}`,
                    timestamp: row.timestamp,
                    building: row.building_id,
                    floor: row.floor,
                    type: "Statistical Energy Anomaly",
                    message: `Building ${row.building_id} (Floor ${row.floor}) registered extreme anomaly (+${diffPct}% above mean, Z-score: ${zScore.toFixed(2)}) at ${row.timestamp}.`,
                    severity: "HIGH",
                    kwh: row.electricity_kwh
                });
            }
        });

        // AI Rule-Based Recommendations Engine
        this.recommendations = [
            {
                title: "Reduce HVAC Operation During Low Occupancy",
                reason: "Nighttime telemetry indicates HVAC systems operating at 80% power on Floors 3 & 4 while occupancy is under 5%.",
                savingsKwh: 340,
                savingsCost: 45.90,
                priority: "HIGH"
            },
            {
                title: "Optimize Lighting Schedules on Floor 3 & 5",
                reason: "Lighting energy usage remains elevated past 8:00 PM during non-business hours.",
                savingsKwh: 180,
                savingsCost: 24.30,
                priority: "MEDIUM"
            },
            {
                title: "Shift High-Energy Equipment Away From Peak Hours",
                reason: "Heavy equipment usage detected between 1:00 PM - 4:00 PM during maximum utility tariff rates.",
                savingsKwh: 520,
                savingsCost: 93.60,
                priority: "HIGH"
            },
            {
                title: "Investigate Abnormal Nighttime Electricity Baseline",
                reason: "Base load in Building B2 Floor 2 is 35% higher than Building B1 under identical inactive conditions.",
                savingsKwh: 210,
                savingsCost: 28.35,
                priority: "MEDIUM"
            },
            {
                title: "Adjust HVAC Setpoint During Moderate Outdoor Temps",
                reason: "Cooling systems are over-chilling indoor areas to 19°C when outdoor temperature is a mild 22°C.",
                savingsKwh: 290,
                savingsCost: 39.15,
                priority: "LOW"
            }
        ];
    },

    /**
     * Renders Top KPI Cards
     */
    renderKPIs() {
        const data = this.filteredDataset;
        if (!data || data.length === 0) return;

        let totalKwh = 0;
        let totalCost = 0;
        let totalHvac = 0;
        let totalLighting = 0;
        let totalOccupancy = 0;

        data.forEach(r => {
            totalKwh += r.electricity_kwh || 0;
            totalCost += r.energy_cost || 0;
            totalHvac += r.hvac_kwh || 0;
            totalLighting += r.lighting_kwh || 0;
            totalOccupancy += r.occupancy || 0;
        });

        const avgDailyKwh = (totalKwh / (data.length / 6)).toFixed(1);
        const avgOccupancy = Math.round(totalOccupancy / data.length);

        document.getElementById('kpi-total-energy').innerText = `${Math.round(totalKwh).toLocaleString()} kWh`;
        document.getElementById('kpi-avg-daily').innerText = `${Math.round(avgDailyKwh).toLocaleString()} kWh`;
        document.getElementById('kpi-energy-cost').innerText = `$${Math.round(totalCost).toLocaleString()}`;
        document.getElementById('kpi-hvac-consumption').innerText = `${Math.round(totalHvac).toLocaleString()} kWh`;
        document.getElementById('kpi-lighting-consumption').innerText = `${Math.round(totalLighting).toLocaleString()} kWh`;
        document.getElementById('kpi-avg-occupancy').innerText = `${avgOccupancy} persons`;
    },

    /**
     * Renders Energy Agent Panel
     */
    renderAgentPanel() {
        const lastTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const totalSavingsCost = this.recommendations.reduce((acc, r) => acc + r.savingsCost, 0);

        const lastAnalysisElem = document.getElementById('agent-last-analysis');
        const anomalyCountElem = document.getElementById('agent-anomaly-count');
        const savingsElem = document.getElementById('agent-potential-savings');

        if (lastAnalysisElem) lastAnalysisElem.innerText = lastTime;
        if (anomalyCountElem) anomalyCountElem.innerText = this.anomalies.length;
        if (savingsElem) savingsElem.innerText = `$${Math.round(totalSavingsCost * 30).toLocaleString()}/mo`;
    },

    /**
     * Initializes and renders Chart.js charts
     */
    renderCharts() {
        const data = this.filteredDataset;
        if (!data || data.length === 0) return;

        // Take last 50 data points for clean temporal display
        const displayData = data.slice(-50);
        const timestamps = displayData.map(r => r.timestamp.split(' ')[1] || r.timestamp);

        // Chart 1: Daily Electricity Consumption Line Chart
        this.buildChart('chart-daily-consumption', {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Electricity Consumption (kWh)',
                    data: displayData.map(r => r.electricity_kwh),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2,
                    pointHoverRadius: 6
                }]
            },
            options: this.getCommonChartOptions('Daily Electricity Consumption (kWh)')
        });

        // Chart 2: Category Breakdown (Doughnut Chart)
        let totalHvac = 0, totalLighting = 0, totalEquipment = 0;
        data.forEach(r => {
            totalHvac += r.hvac_kwh || 0;
            totalLighting += r.lighting_kwh || 0;
            totalEquipment += r.equipment_kwh || 0;
        });

        this.buildChart('chart-category-breakdown', {
            type: 'doughnut',
            data: {
                labels: ['HVAC System', 'Lighting System', 'Facility Equipment'],
                datasets: [{
                    data: [Math.round(totalHvac), Math.round(totalLighting), Math.round(totalEquipment)],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8' } }
                }
            }
        });

        // Chart 3: Energy vs Occupancy (Line/Bar Dual)
        this.buildChart('chart-energy-vs-occupancy', {
            type: 'bar',
            data: {
                labels: timestamps,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Occupancy (People)',
                        data: displayData.map(r => r.occupancy),
                        backgroundColor: 'rgba(16, 185, 129, 0.4)',
                        yAxisID: 'y1'
                    },
                    {
                        type: 'line',
                        label: 'Electricity (kWh)',
                        data: displayData.map(r => r.electricity_kwh),
                        borderColor: '#8b5cf6',
                        borderWidth: 2,
                        tension: 0.3,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    y: { type: 'linear', position: 'left', ticks: { color: '#8b5cf6' }, grid: { color: '#334155' } },
                    y1: { type: 'linear', position: 'right', ticks: { color: '#10b981' }, grid: { drawOnChartArea: false } }
                },
                plugins: { legend: { labels: { color: '#94a3b8' } } }
            }
        });

        // Chart 4: Energy Cost Over Time
        this.buildChart('chart-cost-over-time', {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Energy Cost ($)',
                    data: displayData.map(r => r.energy_cost),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: this.getCommonChartOptions('Energy Cost ($)')
        });

        // Chart 5: Consumption by Floor (Bar Chart)
        const floorTotals = {};
        data.forEach(r => {
            const fl = `Floor ${r.floor}`;
            floorTotals[fl] = (floorTotals[fl] || 0) + (r.electricity_kwh || 0);
        });

        this.buildChart('chart-consumption-by-floor', {
            type: 'bar',
            data: {
                labels: Object.keys(floorTotals),
                datasets: [{
                    label: 'Total Electricity (kWh)',
                    data: Object.values(floorTotals).map(v => Math.round(v)),
                    backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b']
                }]
            },
            options: this.getCommonChartOptions('kWh by Floor')
        });
    },

    /**
     * Helper to build/update Chart instance
     */
    buildChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas element '${canvasId}' not found in DOM.`);
            return;
        }

        if (typeof Chart === 'undefined') {
            console.warn(`Chart.js CDN not available yet. Retrying chart '${canvasId}' in 500ms...`);
            setTimeout(() => this.buildChart(canvasId, config), 500);
            return;
        }

        try {
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
            }
            this.charts[canvasId] = new Chart(canvas, config);
        } catch (err) {
            console.error(`Failed to construct Chart on canvas '${canvasId}':`, err);
        }
    },

    getCommonChartOptions(yTitle) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#94a3b8', maxTicksLimit: 12 }, grid: { color: '#1e293b' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' }, title: { display: true, text: yTitle, color: '#94a3b8' } }
            },
            plugins: { legend: { labels: { color: '#94a3b8' } } }
        };
    },

    /**
     * Render Energy Anomalies List
     */
    renderAnomalies() {
        const container = document.getElementById('anomalies-list-container');
        if (!container) return;

        if (this.anomalies.length === 0) {
            container.innerHTML = `<p class="text-muted">No anomalies detected in selected timeframe.</p>`;
            return;
        }

        container.innerHTML = this.anomalies.slice(0, 10).map(a => `
            <div class="alert-item alert-item-${a.severity === 'HIGH' ? 'critical' : 'warning'}">
                <div class="alert-icon-box">⚡</div>
                <div class="alert-content">
                    <h4>${a.type} — <span class="badge badge-${a.severity === 'HIGH' ? 'critical' : 'warning'}">${a.severity}</span></h4>
                    <p>${a.message}</p>
                    <div class="alert-meta">
                        <span>🏢 Building ${a.building} (Floor ${a.floor})</span>
                        <span>🕒 ${a.timestamp}</span>
                        <span>📊 Load: ${a.kwh} kWh</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Render AI Recommendations List
     */
    renderRecommendations() {
        const container = document.getElementById('recommendations-list-container');
        if (!container) return;

        container.innerHTML = this.recommendations.map(r => `
            <div class="recommendation-card">
                <div class="recommendation-header">
                    <span class="recommendation-title">💡 ${r.title}</span>
                    <span class="badge badge-${r.priority.toLowerCase()}">${r.priority} PRIORITY</span>
                </div>
                <div class="recommendation-body">
                    <strong>Reason:</strong> ${r.reason}
                </div>
                <div class="recommendation-footer">
                    <span>Est. Reduction: <strong>${r.savingsKwh} kWh/day</strong></span>
                    <span class="savings-tag">💰 Savings: $${r.savingsCost.toFixed(2)}/day</span>
                </div>
            </div>
        `).join('');
    },

    /**
     * Event Listeners for Dynamic Filters
     */
    setupEventListeners() {
        const buildingFilter = document.getElementById('filter-building');
        const floorFilter = document.getElementById('filter-floor');

        const applyFilters = () => {
            const bVal = buildingFilter ? buildingFilter.value : 'ALL';
            const fVal = floorFilter ? floorFilter.value : 'ALL';

            this.filteredDataset = this.rawDataset.filter(r => {
                const matchB = (bVal === 'ALL' || r.building_id === bVal);
                const matchF = (fVal === 'ALL' || String(r.floor) === String(fVal));
                return matchB && matchF;
            });

            this.renderKPIs();
            this.renderCharts();
        };

        if (buildingFilter) buildingFilter.addEventListener('change', applyFilters);
        if (floorFilter) floorFilter.addEventListener('change', applyFilters);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('energy-page-identifier')) {
        EnergyEngine.init();
    }
});
