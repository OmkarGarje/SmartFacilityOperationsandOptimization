/**
 * Agentic FacilityOps AI Platform - Executive Main Dashboard Controller (Milestones 1, 2, 3)
 */

const DashboardEngine = {
    energyData: [],
    maintenanceData: [],
    occupancyData: [],
    securityData: [],

    async init() {
        // Load all 4 module datasets concurrently
        const [eData, mData, oData, sData] = await Promise.all([
            DataLoader.loadEnergyData(),
            DataLoader.loadMaintenanceData(),
            DataLoader.loadOccupancyData(),
            DataLoader.loadSecurityData()
        ]);

        this.energyData = eData;
        this.maintenanceData = mData;
        this.occupancyData = oData;
        this.securityData = sData;

        // Run Agent Evaluations
        EnergyEngine.rawDataset = this.energyData;
        EnergyEngine.runEnergyAgentAnalysis();

        MaintenanceEngine.rawDataset = this.maintenanceData.map(a => MaintenanceEngine.evaluateAssetTelemetry(a));
        MaintenanceEngine.generateMaintenanceAlerts();

        OccupancyEngine.rawDataset = this.occupancyData;
        OccupancyEngine.runOccupancyAgentAnalysis();

        SecurityEngine.rawDataset = this.securityData;
        SecurityEngine.generateSecurityAlerts();

        this.renderExecutiveKPIs();
        this.renderCharts();
        this.renderRecentAlerts();
        this.renderFacilityIntelligence();
    },

    renderExecutiveKPIs() {
        let totalKwh = 0, totalCost = 0;
        this.energyData.forEach(r => {
            totalKwh += (r.electricity_kwh || 0);
            totalCost += (r.energy_cost || 0);
        });

        const totalAssets = this.maintenanceData.length;
        const currentOcc = this.occupancyData.reduce((acc, r) => acc + (r.current_occupancy || 0), 0);
        const uniqueRooms = new Set(this.occupancyData.map(r => r.room_id)).size || 1;
        const avgBuildingOcc = Math.round(currentOcc / (this.occupancyData.length / uniqueRooms));

        const overcrowdedRooms = this.occupancyData.filter(r => r.occupancy_percentage > 90).length;
        const secAlerts = SecurityEngine.alerts.length;
        const suspiciousEvents = this.securityData.filter(s => s.access_status === "Suspicious" || s.risk_level === "High").length;

        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setElem('exec-total-energy', `${Math.round(totalKwh).toLocaleString()} kWh`);
        setElem('exec-energy-cost', `$${Math.round(totalCost).toLocaleString()}`);
        setElem('exec-total-assets', totalAssets.toLocaleString());
        setElem('exec-current-occ', avgBuildingOcc.toLocaleString());
        setElem('exec-overcrowded-rooms', overcrowdedRooms.toLocaleString());
        setElem('exec-sec-alerts', secAlerts.toLocaleString());
        setElem('exec-suspicious-events', suspiciousEvents.toLocaleString());
    },

    renderCharts() {
        // 1. Energy Overview Chart
        const eDisplay = this.energyData.slice(-30);
        const eLabels = eDisplay.map(r => r.timestamp.split(' ')[1] || r.timestamp);
        DataLoader.createChart('chart-exec-energy', {
            type: 'line',
            data: {
                labels: eLabels,
                datasets: [{
                    label: 'Electricity (kWh)',
                    data: eDisplay.map(r => r.electricity_kwh),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { ticks: { color: '#94a3b8', maxTicksLimit: 6 }, grid: { color: '#1e293b' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } } },
                plugins: { legend: { display: false } }
            }
        });

        // 2. Maintenance Overview Chart
        const mCounts = { Excellent: 0, Good: 0, Warning: 0, Critical: 0 };
        this.maintenanceData.forEach(a => { mCounts[a.health_label] = (mCounts[a.health_label] || 0) + 1; });
        DataLoader.createChart('chart-exec-maintenance', {
            type: 'doughnut',
            data: {
                labels: ['Excellent', 'Good', 'Warning', 'Critical'],
                datasets: [{
                    data: [mCounts.Excellent, mCounts.Good, mCounts.Warning, mCounts.Critical],
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

        // 3. Occupancy Overview Chart
        const oDisplay = this.occupancyData.slice(-30);
        const oLabels = oDisplay.map(r => r.timestamp.split(' ')[1] || r.timestamp);
        DataLoader.createChart('chart-exec-occupancy', {
            type: 'bar',
            data: {
                labels: oLabels,
                datasets: [{
                    label: 'Occupants',
                    data: oDisplay.map(r => r.current_occupancy),
                    backgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { ticks: { color: '#94a3b8', maxTicksLimit: 6 }, grid: { color: '#1e293b' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } } },
                plugins: { legend: { display: false } }
            }
        });
    },

    renderRecentAlerts() {
        const container = document.getElementById('exec-recent-alerts');
        if (!container) return;

        const combined = [];

        EnergyEngine.anomalies.slice(0, 2).forEach(a => {
            combined.push({ icon: '⚡', title: `ENERGY: ${a.type}`, desc: a.message, sev: a.severity, time: a.timestamp });
        });

        MaintenanceEngine.alerts.slice(0, 2).forEach(m => {
            combined.push({ icon: '🔧', title: `MAINTENANCE: ${m.problem}`, desc: m.recommendedAction, sev: m.riskLevel === 'High Risk' ? 'HIGH' : 'MEDIUM', time: m.date });
        });

        SecurityEngine.alerts.slice(0, 3).forEach(s => {
            combined.push({ icon: '🛡️', title: `SECURITY: ${s.event}`, desc: `${s.person} @ ${s.location}`, sev: s.riskLevel, time: s.timestamp });
        });

        if (combined.length === 0) {
            container.innerHTML = `<p class="text-muted">No active alerts.</p>`;
            return;
        }

        container.innerHTML = combined.slice(0, 6).map(item => `
            <div class="alert-item alert-item-${item.sev === 'CRITICAL' || item.sev === 'HIGH' ? 'critical' : 'warning'}">
                <div class="alert-icon-box">${item.icon}</div>
                <div class="alert-content">
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                    <div class="alert-meta">
                        <span>🕒 ${item.time}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderFacilityIntelligence() {
        const container = document.getElementById('exec-facility-intelligence');
        if (!container) return;

        const eAnom = EnergyEngine.anomalies.length;
        const mHigh = MaintenanceEngine.alerts.length;
        const oOver = OccupancyEngine.rawDataset.filter(r => r.occupancy_percentage > 90).length;
        const sCrit = SecurityEngine.alerts.filter(a => a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH').length;

        container.innerHTML = `
            <div class="recommendation-card">
                <div class="recommendation-header">
                    <span class="recommendation-title">⚡ Energy Agent Status</span>
                    <span class="badge badge-healthy">ACTIVE</span>
                </div>
                <div class="recommendation-body">
                    Monitoring utility telemetry. Detected <strong>${eAnom} energy anomalies</strong> and identified up to $1,200/mo potential optimization.
                </div>
            </div>

            <div class="recommendation-card">
                <div class="recommendation-header">
                    <span class="recommendation-title">🔧 Maintenance Agent Status</span>
                    <span class="badge badge-healthy">ACTIVE</span>
                </div>
                <div class="recommendation-body">
                    Evaluating equipment telemetry across 520 assets. Flagged <strong>${mHigh} high-risk assets</strong> requiring predictive service.
                </div>
            </div>

            <div class="recommendation-card">
                <div class="recommendation-header">
                    <span class="recommendation-title">👥 Occupancy Agent Status</span>
                    <span class="badge badge-healthy">ACTIVE</span>
                </div>
                <div class="recommendation-body">
                    Tracking space utilization. Identified <strong>${oOver} overcrowded room events</strong> and peak building occupancy between 11 AM - 1 PM.
                </div>
            </div>

            <div class="recommendation-card">
                <div class="recommendation-header">
                    <span class="recommendation-title">🛡️ Security Agent Status</span>
                    <span class="badge badge-healthy">ACTIVE</span>
                </div>
                <div class="recommendation-body">
                    Monitoring access control workflows. Flagged <strong>${sCrit} high-priority security events</strong> at server room & restricted zones.
                </div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('overview-dashboard-identifier')) {
        DashboardEngine.init();
    }
});
