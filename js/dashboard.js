/**
 * Agentic FacilityOps AI Platform - Executive Main Dashboard Controller
 */

const DashboardEngine = {
    energyData: [],
    maintenanceData: [],

    async init() {
        // Load datasets concurrently
        const [eData, mData] = await Promise.all([
            DataLoader.loadEnergyData(),
            DataLoader.loadMaintenanceData()
        ]);

        this.energyData = eData;
        this.maintenanceData = mData;

        // Run evaluation logic
        EnergyEngine.rawDataset = this.energyData;
        EnergyEngine.runEnergyAgentAnalysis();

        MaintenanceEngine.rawDataset = this.maintenanceData.map(a => MaintenanceEngine.evaluateAssetTelemetry(a));
        MaintenanceEngine.generateMaintenanceAlerts();

        this.renderExecutiveKPIs();
        this.renderCharts();
        this.renderCombinedAlerts();
        this.renderTopRecommendations();
    },

    renderExecutiveKPIs() {
        let totalKwh = 0, totalCost = 0;
        this.energyData.forEach(r => {
            totalKwh += r.electricity_kwh || 0;
            totalCost += r.energy_cost || 0;
        });

        const totalAssets = this.maintenanceData.length;
        const healthyAssets = this.maintenanceData.filter(a => a.computed_status === 'Healthy' || a.computed_status === 'Good').length;
        const maintDue = this.maintenanceData.filter(a => a.maintenance_recommended || a.computed_status === 'Critical' || a.computed_status === 'Warning').length;
        const activeAlerts = EnergyEngine.anomalies.length + MaintenanceEngine.alerts.length;

        document.getElementById('exec-total-energy').innerText = `${Math.round(totalKwh).toLocaleString()} kWh`;
        document.getElementById('exec-energy-cost').innerText = `$${Math.round(totalCost).toLocaleString()}`;
        document.getElementById('exec-total-assets').innerText = totalAssets.toLocaleString();
        document.getElementById('exec-healthy-assets').innerText = healthyAssets.toLocaleString();
        document.getElementById('exec-maint-due').innerText = maintDue.toLocaleString();
        document.getElementById('exec-active-alerts').innerText = activeAlerts.toLocaleString();
    },

    renderCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js CDN not available yet for Executive Dashboard.');
            setTimeout(() => this.renderCharts(), 500);
            return;
        }

        // 1. Small Energy Consumption Chart
        const displayData = this.energyData.slice(-30);
        const labels = displayData.map(r => r.timestamp.split(' ')[1] || r.timestamp);
        
        const canvasEnergy = document.getElementById('chart-exec-energy');
        if (canvasEnergy) {
            new Chart(canvasEnergy, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Electricity (kWh)',
                        data: displayData.map(r => r.electricity_kwh),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: '#94a3b8', maxTicksLimit: 8 }, grid: { color: '#1e293b' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // 2. Small Equipment Health Distribution Chart
        const counts = { Excellent: 0, Good: 0, Warning: 0, Critical: 0 };
        this.maintenanceData.forEach(a => {
            counts[a.health_label] = (counts[a.health_label] || 0) + 1;
        });

        const canvasMaint = document.getElementById('chart-exec-maintenance');
        if (canvasMaint) {
            new Chart(canvasMaint, {
                type: 'doughnut',
                data: {
                    labels: ['Excellent', 'Good', 'Warning', 'Critical'],
                    datasets: [{
                        data: [counts.Excellent, counts.Good, counts.Warning, counts.Critical],
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } }
                }
            });
        }
    },

    renderCombinedAlerts() {
        const container = document.getElementById('exec-recent-alerts');
        if (!container) return;

        const combined = [];

        EnergyEngine.anomalies.slice(0, 5).forEach(a => {
            combined.push({
                type: '⚡ ENERGY ANOMALY',
                title: a.type,
                desc: a.message,
                severity: a.severity,
                time: a.timestamp
            });
        });

        MaintenanceEngine.alerts.slice(0, 5).forEach(m => {
            combined.push({
                type: '🔧 MAINTENANCE ALERT',
                title: m.problem,
                desc: `Recommended Action: ${m.recommendedAction}`,
                severity: m.riskLevel === 'High Risk' ? 'HIGH' : 'MEDIUM',
                time: `Due ${m.date}`
            });
        });

        if (combined.length === 0) {
            container.innerHTML = `<p class="text-muted">No active alerts.</p>`;
            return;
        }

        container.innerHTML = combined.slice(0, 6).map(item => `
            <div class="alert-item alert-item-${item.severity === 'HIGH' ? 'critical' : 'warning'}">
                <div class="alert-icon-box">${item.type.includes('ENERGY') ? '⚡' : '🔧'}</div>
                <div class="alert-content">
                    <h4>${item.type}: ${item.title}</h4>
                    <p>${item.desc}</p>
                    <div class="alert-meta">
                        <span>🕒 ${item.time}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderTopRecommendations() {
        const container = document.getElementById('exec-recommendations');
        if (!container) return;

        const recs = EnergyEngine.recommendations.slice(0, 3);
        container.innerHTML = recs.map(r => `
            <div class="recommendation-card">
                <div class="recommendation-header">
                    <span class="recommendation-title">💡 ${r.title}</span>
                    <span class="badge badge-${r.priority.toLowerCase()}">${r.priority}</span>
                </div>
                <div class="recommendation-body">${r.reason}</div>
                <div class="recommendation-footer">
                    <span class="savings-tag">💰 Savings: $${r.savingsCost.toFixed(2)}/day (${r.savingsKwh} kWh)</span>
                </div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('overview-dashboard-identifier')) {
        DashboardEngine.init();
    }
});
