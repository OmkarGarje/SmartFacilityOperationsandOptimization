/**
 * Agentic FacilityOps AI Platform - Multi-Agent Operations Alert Command Center
 */

const AlertsEngine = {
    allAlerts: [],
    filteredAlerts: [],

    async init() {
        // Concurrently load datasets across all 4 modules
        const [eData, mData, oData, sData] = await Promise.all([
            DataLoader.loadEnergyData(),
            DataLoader.loadMaintenanceData(),
            DataLoader.loadOccupancyData(),
            DataLoader.loadSecurityData()
        ]);

        // Evaluate module rules
        EnergyEngine.rawDataset = eData;
        EnergyEngine.runEnergyAgentAnalysis();

        MaintenanceEngine.rawDataset = mData.map(a => MaintenanceEngine.evaluateAssetTelemetry(a));
        MaintenanceEngine.generateMaintenanceAlerts();

        OccupancyEngine.rawDataset = oData;
        OccupancyEngine.runOccupancyAgentAnalysis();

        SecurityEngine.rawDataset = sData;
        SecurityEngine.generateSecurityAlerts();

        this.allAlerts = [];

        // 1. Energy Anomalies (M1)
        EnergyEngine.anomalies.forEach(a => {
            this.allAlerts.push({
                id: a.id,
                category: 'ENERGY',
                title: a.type,
                desc: a.message,
                location: `Building ${a.building} (Floor ${a.floor})`,
                severity: a.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
                time: a.timestamp,
                action: 'Adjust HVAC/lighting schedules or inspect power baseline.'
            });
        });

        // 2. Maintenance Alerts (M2)
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

        // 3. Occupancy Insights & Overcrowding Alerts (M3)
        OccupancyEngine.insights.forEach((o, idx) => {
            this.allAlerts.push({
                id: `OCC-ALT-${idx + 100}`,
                category: 'OCCUPANCY',
                title: o.type,
                desc: o.text,
                location: `Facility Space`,
                severity: o.level === 'HIGH' ? 'HIGH' : o.level === 'MEDIUM' ? 'MEDIUM' : 'LOW',
                time: `Real-time Telemetry`,
                action: 'Reallocate room reservations or optimize space capacity.'
            });
        });

        // 4. Security Alerts (M3)
        SecurityEngine.alerts.forEach(s => {
            this.allAlerts.push({
                id: s.id,
                category: 'SECURITY',
                title: s.event,
                desc: `Person: ${s.person} | ${s.location}`,
                location: s.location,
                severity: s.riskLevel,
                time: s.timestamp,
                action: s.action
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
        const occCount = this.allAlerts.filter(a => a.category === 'OCCUPANCY').length;
        const secCount = this.allAlerts.filter(a => a.category === 'SECURITY').length;
        const highCriticalCount = this.allAlerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length;

        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setElem('count-total-alerts', total);
        setElem('count-energy-alerts', energyCount);
        setElem('count-maint-alerts', maintCount);
        setElem('count-occ-alerts', occCount);
        setElem('count-sec-alerts', secCount);
        setElem('count-high-alerts', highCriticalCount);
    },

    renderAlertList() {
        const container = document.getElementById('alerts-feed-container');
        if (!container) return;

        if (this.filteredAlerts.length === 0) {
            container.innerHTML = `<p class="text-muted" style="padding:20px; text-align:center;">No matching operational alerts found.</p>`;
            return;
        }

        container.innerHTML = this.filteredAlerts.map(a => {
            let icon = '⚡';
            if (a.category === 'MAINTENANCE') icon = '🔧';
            else if (a.category === 'OCCUPANCY') icon = '👥';
            else if (a.category === 'SECURITY') icon = '🛡️';

            const badgeSev = a.severity.toLowerCase();

            return `
                <div class="alert-item alert-item-${badgeSev === 'critical' || badgeSev === 'high' ? 'critical' : badgeSev === 'medium' ? 'warning' : 'healthy'}">
                    <div class="alert-icon-box">${icon}</div>
                    <div class="alert-content" style="flex-grow:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <h4>${a.title}</h4>
                            <div>
                                <span class="badge badge-good">${a.category}</span>
                                <span class="badge badge-${badgeSev === 'critical' ? 'critical' : badgeSev === 'high' ? 'critical' : badgeSev === 'medium' ? 'warning' : 'healthy'}">${a.severity}</span>
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
            `;
        }).join('');
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
                const matchSearch = a.title.toLowerCase().includes(searchVal) || a.desc.toLowerCase().includes(searchVal) || a.location.toLowerCase().includes(searchVal);
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
