/**
 * Agentic FacilityOps AI Platform - Security Intelligence & Agent Engine (Milestone 3)
 */

const SecurityEngine = {
    rawDataset: [],
    filteredDataset: [],
    alerts: [],
    charts: {},

    async init() {
        this.rawDataset = await DataLoader.loadSecurityData();
        this.filteredDataset = [...this.rawDataset];

        this.generateSecurityAlerts();
        this.renderKPIs();
        this.renderAgentPanel();
        this.renderCharts();
        this.renderWorkflow();
        this.renderAlerts();
        this.setupEventListeners();
    },

    /**
     * Rule-Based Access Monitoring Workflow & Security Threat Analysis
     */
    generateSecurityAlerts() {
        this.alerts = [];
        if (!this.rawDataset || this.rawDataset.length === 0) return;

        this.rawDataset.forEach(row => {
            const isDenied = row.access_status === "Denied";
            const isSuspicious = row.access_status === "Suspicious";
            const isRestricted = row.access_type === "Server Room" || row.access_type === "Restricted Area" || row.access_type === "Laboratory";
            const isUnknown = row.person_type === "Unknown";

            if (row.risk_level === "Critical" || (isRestricted && isDenied)) {
                this.alerts.push({
                    id: `SEC-ALT-${row.event_id}`,
                    eventId: row.event_id,
                    timestamp: row.timestamp,
                    location: row.location,
                    event: `${row.access_status} ${row.entry_exit} Attempt at ${row.access_point}`,
                    person: `${row.person_type} (${row.person_id})`,
                    riskLevel: "CRITICAL",
                    status: row.access_status,
                    action: "Immediate Security Team Dispatch & Access Point Lockdown"
                });
            } else if (row.risk_level === "High" || (isDenied && isSuspicious)) {
                this.alerts.push({
                    id: `SEC-ALT-${row.event_id}`,
                    eventId: row.event_id,
                    timestamp: row.timestamp,
                    location: row.location,
                    event: `Suspicious Access Pattern at ${row.access_point} via ${row.authentication_method}`,
                    person: `${row.person_type} (${row.person_id})`,
                    riskLevel: "HIGH",
                    status: row.access_status,
                    action: "Flag Badge for Audit & Review CCTV Footage"
                });
            } else if (isDenied) {
                this.alerts.push({
                    id: `SEC-ALT-${row.event_id}`,
                    eventId: row.event_id,
                    timestamp: row.timestamp,
                    location: row.location,
                    event: `Denied ${row.entry_exit} Attempt (${row.authentication_method})`,
                    person: `${row.person_type} (${row.person_id})`,
                    riskLevel: "MEDIUM",
                    status: row.access_status,
                    action: "Log Event & Notify Building Manager"
                });
            }
        });
    },

    /**
     * Render KPI Cards
     */
    renderKPIs() {
        const data = this.filteredDataset;
        if (!data || data.length === 0) return;

        const totalEvents = data.length;
        const authorized = data.filter(r => r.access_status === "Authorized").length;
        const denied = data.filter(r => r.access_status === "Denied").length;
        const suspicious = data.filter(r => r.access_status === "Suspicious" || r.risk_level === "High").length;
        const highRisk = data.filter(r => r.risk_level === "High" || r.risk_level === "Critical").length;

        document.getElementById('kpi-sec-total').innerText = totalEvents.toLocaleString();
        document.getElementById('kpi-sec-authorized').innerText = authorized.toLocaleString();
        document.getElementById('kpi-sec-denied').innerText = denied.toLocaleString();
        document.getElementById('kpi-sec-suspicious').innerText = suspicious.toLocaleString();
        document.getElementById('kpi-sec-alerts').innerText = this.alerts.length.toLocaleString();
        document.getElementById('kpi-sec-highrisk').innerText = highRisk.toLocaleString();
    },

    /**
     * Render Security Agent Visual Panel
     */
    renderAgentPanel() {
        const total = this.rawDataset.length;
        const denied = this.rawDataset.filter(r => r.access_status === "Denied").length;
        const suspicious = this.rawDataset.filter(r => r.access_status === "Suspicious").length;
        const highRisk = this.rawDataset.filter(r => r.risk_level === "High").length;
        const critical = this.rawDataset.filter(r => r.risk_level === "Critical").length;

        document.getElementById('sec-agent-monitored').innerText = total;
        document.getElementById('sec-agent-denied').innerText = denied;
        document.getElementById('sec-agent-suspicious').innerText = suspicious;
        document.getElementById('sec-agent-highrisk').innerText = highRisk;
        document.getElementById('sec-agent-critical').innerText = critical;
    },

    /**
     * Render Chart.js Visualizations
     */
    renderCharts() {
        const data = this.filteredDataset;
        if (!data || data.length === 0) return;

        const displayData = data.slice(-40);
        const timestamps = displayData.map(r => r.timestamp.split(' ')[1] || r.timestamp);

        // Chart 1: Access Events Over Time
        this.buildChart('chart-sec-over-time', {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Access Events',
                    data: displayData.map((_, idx) => (idx % 5) + 1),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: this.getChartOptions('Events Count')
        });

        // Chart 2: Authorized vs Denied Access (Doughnut Chart)
        const statusMap = { Authorized: 0, Denied: 0, Suspicious: 0, Unknown: 0 };
        data.forEach(r => {
            const st = r.access_status || "Authorized";
            if (statusMap[st] !== undefined) statusMap[st]++;
            else statusMap.Authorized++;
        });

        this.buildChart('chart-sec-auth-vs-denied', {
            type: 'doughnut',
            data: {
                labels: ['Authorized', 'Denied', 'Suspicious', 'Unknown'],
                datasets: [{
                    data: [statusMap.Authorized, statusMap.Denied, statusMap.Suspicious, statusMap.Unknown],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#64748b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
            }
        });

        // Chart 3: Access by Location
        const locMap = {};
        data.forEach(r => {
            const loc = r.access_type || "Main Entrance";
            locMap[loc] = (locMap[loc] || 0) + 1;
        });

        this.buildChart('chart-sec-by-location', {
            type: 'bar',
            data: {
                labels: Object.keys(locMap),
                datasets: [{
                    label: 'Access Count',
                    data: Object.values(locMap),
                    backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899']
                }]
            },
            options: this.getChartOptions('Access Count')
        });

        // Chart 4: Security Events by Risk Level
        const riskMap = { Low: 0, Medium: 0, High: 0, Critical: 0 };
        data.forEach(r => {
            const rk = r.risk_level || "Low";
            if (riskMap[rk] !== undefined) riskMap[rk]++;
        });

        this.buildChart('chart-sec-by-risk', {
            type: 'bar',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
                datasets: [{
                    label: 'Event Count',
                    data: [riskMap.Low, riskMap.Medium, riskMap.High, riskMap.Critical],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                }]
            },
            options: this.getChartOptions('Event Count')
        });

        // Chart 5: Access Events by Person Type
        const pMap = {};
        data.forEach(r => {
            const pt = r.person_type || "Employee";
            pMap[pt] = (pMap[pt] || 0) + 1;
        });

        this.buildChart('chart-sec-by-person', {
            type: 'bar',
            data: {
                labels: Object.keys(pMap),
                datasets: [{
                    label: 'Events by User Category',
                    data: Object.values(pMap),
                    backgroundColor: '#06b6d4'
                }]
            },
            options: this.getChartOptions('Event Count')
        });
    },

    /**
     * Render Access Monitoring Workflow Step Diagram
     */
    renderWorkflow() {
        const container = document.getElementById('security-workflow-container');
        if (!container) return;

        container.innerHTML = `
            <div class="workflow-flowchart">
                <div class="workflow-step">
                    <div class="step-badge">Step 1</div>
                    <div class="step-title">🚪 Access Event</div>
                    <div class="step-desc">Badge Tap / Biometric Sensor Scan</div>
                </div>
                <div class="workflow-arrow">➔</div>

                <div class="workflow-step">
                    <div class="step-badge">Step 2</div>
                    <div class="step-title">🔐 Auth Check</div>
                    <div class="step-desc">RFID / PIN / Visitor Pass Match</div>
                </div>
                <div class="workflow-arrow">➔</div>

                <div class="workflow-step">
                    <div class="step-badge">Step 3</div>
                    <div class="step-title">🛡️ Clearance Check</div>
                    <div class="step-desc">Verify Role & Time Windows</div>
                </div>
                <div class="workflow-arrow">➔</div>

                <div class="workflow-step">
                    <div class="step-badge">Step 4</div>
                    <div class="step-title">⚖️ Risk Analysis</div>
                    <div class="step-desc">Evaluate Off-Hours & Restricted Areas</div>
                </div>
                <div class="workflow-arrow">➔</div>

                <div class="workflow-step">
                    <div class="step-badge">Step 5</div>
                    <div class="step-title">🚨 Decision & Alert</div>
                    <div class="step-desc">Grant Access or Trigger Alert</div>
                </div>
            </div>
        `;
    },

    /**
     * Render Security Alerts Feed
     */
    renderAlerts() {
        const container = document.getElementById('security-alerts-container');
        if (!container) return;

        if (this.alerts.length === 0) {
            container.innerHTML = `<p class="text-muted">All access points secure. No security breach alerts.</p>`;
            return;
        }

        container.innerHTML = this.alerts.slice(0, 10).map(a => `
            <div class="alert-item alert-item-${a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH' ? 'critical' : 'warning'}">
                <div class="alert-icon-box">🛡️</div>
                <div class="alert-content">
                    <h4>${a.event} — <span class="badge badge-${a.riskLevel === 'CRITICAL' ? 'critical' : a.riskLevel === 'HIGH' ? 'critical' : 'warning'}">${a.riskLevel}</span></h4>
                    <p><strong>Person:</strong> ${a.person} | <strong>Recommended Action:</strong> ${a.action}</p>
                    <div class="alert-meta">
                        <span>🏢 ${a.location}</span>
                        <span>🕒 ${a.timestamp}</span>
                        <span>🆔 ${a.id}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    buildChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        if (typeof Chart === 'undefined') {
            setTimeout(() => this.buildChart(canvasId, config), 500);
            return;
        }
        try {
            if (this.charts[canvasId]) this.charts[canvasId].destroy();
            this.charts[canvasId] = new Chart(canvas, config);
        } catch (err) {
            console.error(`Error building chart ${canvasId}:`, err);
        }
    },

    getChartOptions(yTitle) {
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

    setupEventListeners() {
        const searchInput = document.getElementById('search-sec');
        const statusFilter = document.getElementById('filter-sec-status');

        const applyFilters = () => {
            const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const stVal = statusFilter ? statusFilter.value : 'ALL';

            this.filteredDataset = this.rawDataset.filter(r => {
                const matchSearch = r.location.toLowerCase().includes(searchVal) || r.person_id.toLowerCase().includes(searchVal) || r.access_point.toLowerCase().includes(searchVal);
                const matchStatus = (stVal === 'ALL' || r.access_status === stVal);
                return matchSearch && matchStatus;
            });

            this.renderKPIs();
            this.renderCharts();
        };

        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('security-page-identifier')) {
        SecurityEngine.init();
    }
});
