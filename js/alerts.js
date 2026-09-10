/**
 * Agentic FacilityOps AI Platform - Unified Operations Alerts Controller
 */

const AlertsEngine = {
    allAlerts: [],
    filteredAlerts: [],

    async init() {
        const [eData, mData] = await Promise.all([
            DataLoader.loadEnergyData(),
            DataLoader.loadMaintenanceData()
        ]);

        EnergyEngine.rawDataset = eData;
        EnergyEngine.runEnergyAgentAnalysis();

        MaintenanceEngine.rawDataset = mData.map(a => MaintenanceEngine.evaluateAssetTelemetry(a));
        MaintenanceEngine.generateMaintenanceAlerts();

        this.allAlerts = [];

        // 1. Energy Anomalies
        EnergyEngine.anomalies.forEach(a => {
            this.allAlerts.push({
                id: a.id,
                category: 'ENERGY',
                title: a.type,
                desc: a.message,
                location: `Building ${a.building} (Floor ${a.floor})`,
                severity: a.severity,
                time: a.timestamp,
                action: 'Adjust HVAC/lighting schedules or inspect power baseline.'
            });
        });

        // 2. Maintenance Alerts
        MaintenanceEngine.alerts.forEach(m => {
            this.allAlerts.push({
                id: m.id,
                category: 'MAINTENANCE',
                title: m.problem,
                desc: `Asset ID: ${m.assetId} | Health Score: ${m.healthScore}/100`,
                location: `Building ${m.building} (Floor ${m.floor})`,
                severity: m.riskLevel === 'High Risk' ? 'HIGH' : 'MEDIUM',
                time: `Due Date: ${m.date}`,
                action: m.recommendedAction
            });
        });

        this.filteredAlerts = [...this.allAlerts];
        this.renderAlertCounts();
        this.renderAlertList();
        this.setupEventListeners();
    },

    renderAlertCounts() {
        const total = this.allAlerts.length;
        const energyCount = this.allAlerts.filter(a => a.category === 'ENERGY').length;
        const maintCount = this.allAlerts.filter(a => a.category === 'MAINTENANCE').length;
        const highCount = this.allAlerts.filter(a => a.severity === 'HIGH').length;

        document.getElementById('count-total-alerts').innerText = total;
        document.getElementById('count-energy-alerts').innerText = energyCount;
        document.getElementById('count-maint-alerts').innerText = maintCount;
        document.getElementById('count-high-alerts').innerText = highCount;
    },

    renderAlertList() {
        const container = document.getElementById('alerts-feed-container');
        if (!container) return;

        if (this.filteredAlerts.length === 0) {
            container.innerHTML = `<p class="text-muted" style="padding:20px; text-align:center;">No matching operational alerts found.</p>`;
            return;
        }

        container.innerHTML = this.filteredAlerts.map(a => `
            <div class="alert-item alert-item-${a.severity === 'HIGH' ? 'critical' : 'warning'}">
                <div class="alert-icon-box">${a.category === 'ENERGY' ? '⚡' : '🔧'}</div>
                <div class="alert-content" style="flex-grow:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <h4>${a.title}</h4>
                        <div>
                            <span class="badge badge-${a.category === 'ENERGY' ? 'good' : 'warning'}">${a.category}</span>
                            <span class="badge badge-${a.severity === 'HIGH' ? 'critical' : 'warning'}">${a.severity}</span>
                        </div>
                    </div>
                    <p>${a.desc}</p>
                    <p style="color:#60a5fa; font-size:0.8rem;"><strong>Recommended Action:</strong> ${a.action}</p>
                    <div class="alert-meta" style="margin-top:8px;">
                        <span>🏢 ${a.location}</span>
                        <span>🕒 ${a.time}</span>
                        <span>🆔 ${a.id}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    setupEventListeners() {
        const searchInput = document.getElementById('search-alert');
        const catFilter = document.getElementById('filter-alert-cat');
        const sevFilter = document.getElementById('filter-alert-sev');

        const applyFilters = () => {
            const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const catVal = catFilter ? catFilter.value : 'ALL';
            const sevVal = sevFilter ? sevFilter.value : 'ALL';

            this.filteredAlerts = this.allAlerts.filter(a => {
                const matchSearch = a.title.toLowerCase().includes(searchVal) || a.desc.toLowerCase().includes(searchVal);
                const matchCat = (catVal === 'ALL' || a.category === catVal);
                const matchSev = (sevVal === 'ALL' || a.severity === sevVal);
                return matchSearch && matchCat && matchSev;
            });

            this.renderAlertList();
        };

        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (catFilter) catFilter.addEventListener('change', applyFilters);
        if (sevFilter) sevFilter.addEventListener('change', applyFilters);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('alerts-page-identifier')) {
        AlertsEngine.init();
    }
});
