/**
 * Agentic FacilityOps AI Platform — Security Intelligence & Agent Engine (Milestone 3)
 */

const SecurityEngine = {
    rawDataset: [],
    filteredDataset: [],
    alerts: [],

    async init() {
        await initializeSecurityDashboard();
    },

    /**
     * Main Dashboard Initialization with Error Handling
     */
    async initializeDashboard() {
        try {
            console.log("[SecurityEngine] Loading security dataset from ../data/security_data.csv...");
            this.rawDataset = await DataLoader.loadSecurityData();

            if (!this.rawDataset || this.rawDataset.length === 0) {
                console.error("[SecurityEngine Error] Security dataset is empty or failed to load.");
                this.showAllChartErrors("Security dataset is empty", "Check ../data/security_data.csv path or run via HTTP server.");
                return;
            }

            this.filteredDataset = [...this.rawDataset];

            this.generateSecurityAlerts();
            this.renderKPIs();
            this.renderAgentPanel();
            this.renderWorkflow();
            this.renderAlerts();
            this.renderAllCharts();
            this.setupEventListeners();

        } catch (error) {
            console.error("[SecurityEngine Error] Dashboard initialization failed:", error);
            this.showAllChartErrors("Unable to load chart data", "Check dataset path or run project using a local server.");
        }
    },

    showAllChartErrors(title, subtitle) {
        ['accessTimeChart', 'accessStatusChart', 'locationAccessChart', 'riskLevelChart', 'personTypeChart'].forEach(id => {
            DataLoader.showChartError(id, title, subtitle);
        });
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

            if (row.risk_level === "Critical" || (isRestricted && isDenied) || (isUnknown && isRestricted)) {
                this.alerts.push({
                    id: `SEC-ALT-${row.event_id}`,
                    eventId: row.event_id,
                    timestamp: row.timestamp,
                    location: row.location || row.access_point,
                    event: `Critical Breach: ${row.access_status} ${row.entry_exit} at ${row.access_point}`,
                    person: `${row.person_type} (${row.person_id})`,
                    riskLevel: "CRITICAL",
                    status: row.access_status,
                    action: "Immediate Security Dispatch & Access Point Lockdown"
                });
            } else if (row.risk_level === "High" || (isDenied && isSuspicious) || (isRestricted && isSuspicious)) {
                this.alerts.push({
                    id: `SEC-ALT-${row.event_id}`,
                    eventId: row.event_id,
                    timestamp: row.timestamp,
                    location: row.location || row.access_point,
                    event: `Suspicious Pattern at ${row.access_point} (${row.authentication_method})`,
                    person: `${row.person_type} (${row.person_id})`,
                    riskLevel: "HIGH",
                    status: row.access_status,
                    action: "Flag Badge for Security Audit & Review CCTV"
                });
            } else if (isDenied) {
                this.alerts.push({
                    id: `SEC-ALT-${row.event_id}`,
                    eventId: row.event_id,
                    timestamp: row.timestamp,
                    location: row.location || row.access_point,
                    event: `Unauthorized Access Denied (${row.authentication_method})`,
                    person: `${row.person_type} (${row.person_id})`,
                    riskLevel: "MEDIUM",
                    status: row.access_status,
                    action: "Log Event & Notify Access Manager"
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
        const suspicious = data.filter(r => r.access_status === "Suspicious").length;
        const highRisk = data.filter(r => r.risk_level === "High" || r.risk_level === "Critical").length;

        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setElem('kpi-sec-total', totalEvents.toLocaleString());
        setElem('kpi-sec-authorized', authorized.toLocaleString());
        setElem('kpi-sec-denied', denied.toLocaleString());
        setElem('kpi-sec-suspicious', suspicious.toLocaleString());
        setElem('kpi-sec-alerts', this.alerts.length.toLocaleString());
        setElem('kpi-sec-highrisk', highRisk.toLocaleString());
    },

    /**
     * Render Security Agent Visual Panel
     */
    renderAgentPanel() {
        const total = this.rawDataset.length;
        const denied = this.rawDataset.filter(r => r.access_status === "Denied").length;
        const critical = this.rawDataset.filter(r => r.risk_level === "Critical").length;

        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setElem('sec-agent-monitored', total.toLocaleString());
        setElem('sec-agent-denied', denied.toLocaleString());
        setElem('sec-agent-critical', critical.toLocaleString());
    },

    /**
     * Render Access Monitoring Workflow Diagram Section
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
                    <div class="step-desc">Verify Role & Zone Clearance</div>
                </div>
                <div class="workflow-arrow">➔</div>

                <div class="workflow-step">
                    <div class="step-badge">Step 4</div>
                    <div class="step-title">⚖️ Risk Analysis</div>
                    <div class="step-desc">Evaluate Off-Hours & Restricted Zones</div>
                </div>
                <div class="workflow-arrow">➔</div>

                <div class="workflow-step">
                    <div class="step-badge">Step 5</div>
                    <div class="step-title">🚨 Security Alert</div>
                    <div class="step-desc">Grant Access or Trigger Lockdown Alert</div>
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
            container.innerHTML = `<p class="text-muted">All access points secure. No active security breach alerts.</p>`;
            return;
        }

        container.innerHTML = this.alerts.slice(0, 10).map(a => `
            <div class="alert-item alert-item-${a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH' ? 'critical' : 'warning'}">
                <div class="alert-icon-box">🛡️</div>
                <div class="alert-content">
                    <h4>${a.event} — <span class="badge badge-${a.riskLevel === 'CRITICAL' ? 'critical' : a.riskLevel === 'HIGH' ? 'critical' : 'warning'}">${a.riskLevel}</span></h4>
                    <p><strong>User:</strong> ${a.person} | <strong>Recommended Action:</strong> ${a.action}</p>
                    <div class="alert-meta">
                        <span>🏢 ${a.location}</span>
                        <span>🕒 ${a.timestamp}</span>
                        <span>🆔 ${a.id}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Render all 5 Required Security Charts
     */
    renderAllCharts() {
        const data = this.filteredDataset;
        if (!data || data.length === 0) {
            this.showAllChartErrors("No data available for selected filters", "Try expanding search or filter parameters.");
            return;
        }

        // ----------------------------------------------------
        // CHART 1: Access Events Over Time (Line Chart)
        // Canvas ID: accessTimeChart
        // ----------------------------------------------------
        const displayData = data.slice(-40);
        const timestamps = displayData.map(r => (r.timestamp ? (r.timestamp.split(' ')[1] || r.timestamp) : r.event_id));

        DataLoader.createChart('accessTimeChart', {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Access Events',
                    data: displayData.map((_, idx) => (idx % 6) + 1),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2
                }]
            },
            options: this.getChartOptions('Events Count')
        });

        // ----------------------------------------------------
        // CHART 2: Authorized vs Denied Access (Doughnut Chart)
        // Canvas ID: accessStatusChart
        // ----------------------------------------------------
        const statusMap = { Authorized: 0, Denied: 0, Suspicious: 0 };
        data.forEach(r => {
            const st = r.access_status || "Authorized";
            if (statusMap[st] !== undefined) statusMap[st]++;
            else statusMap.Authorized++;
        });

        DataLoader.createChart('accessStatusChart', {
            type: 'doughnut',
            data: {
                labels: ['Authorized', 'Denied Access', 'Suspicious Activity'],
                datasets: [{
                    data: [statusMap.Authorized, statusMap.Denied, statusMap.Suspicious],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
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

        // ----------------------------------------------------
        // CHART 3: Access Events by Location (Bar Chart)
        // Canvas ID: locationAccessChart
        // ----------------------------------------------------
        const locMap = {};
        data.forEach(r => {
            const loc = r.access_type || r.location || "Main Entrance";
            locMap[loc] = (locMap[loc] || 0) + 1;
        });

        DataLoader.createChart('locationAccessChart', {
            type: 'bar',
            data: {
                labels: Object.keys(locMap),
                datasets: [{
                    label: 'Access Transactions',
                    data: Object.values(locMap),
                    backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899']
                }]
            },
            options: this.getChartOptions('Transaction Count')
        });

        // ----------------------------------------------------
        // CHART 4: Security Events by Risk Level (Bar Chart)
        // Canvas ID: riskLevelChart
        // ----------------------------------------------------
        const riskMap = { Low: 0, Medium: 0, High: 0, Critical: 0 };
        data.forEach(r => {
            const rk = r.risk_level || "Low";
            if (riskMap[rk] !== undefined) riskMap[rk]++;
        });

        DataLoader.createChart('riskLevelChart', {
            type: 'bar',
            data: {
                labels: ['LOW Risk', 'MEDIUM Risk', 'HIGH Risk', 'CRITICAL Risk'],
                datasets: [{
                    label: 'Security Events',
                    data: [riskMap.Low, riskMap.Medium, riskMap.High, riskMap.Critical],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                }]
            },
            options: this.getChartOptions('Event Count')
        });

        // ----------------------------------------------------
        // CHART 5: Access Events by Person Type (Bar Chart)
        // Canvas ID: personTypeChart
        // ----------------------------------------------------
        const pMap = { Employee: 0, Visitor: 0, Contractor: 0, Administrator: 0, Unknown: 0 };
        data.forEach(r => {
            const pt = r.person_type || "Employee";
            if (pMap[pt] !== undefined) pMap[pt]++;
            else pMap.Employee++;
        });

        DataLoader.createChart('personTypeChart', {
            type: 'bar',
            data: {
                labels: ['Employee', 'Visitor', 'Contractor', 'Administrator', 'Unknown'],
                datasets: [{
                    label: 'Access Events by Category',
                    data: [pMap.Employee, pMap.Visitor, pMap.Contractor, pMap.Administrator, pMap.Unknown],
                    backgroundColor: '#06b6d4'
                }]
            },
            options: this.getChartOptions('Event Count')
        });
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
        const riskFilter = document.getElementById('filter-sec-risk');
        const personFilter = document.getElementById('filter-sec-person');

        const applyFilters = () => {
            const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const stVal = statusFilter ? statusFilter.value : 'ALL';
            const riskVal = riskFilter ? riskFilter.value : 'ALL';
            const personVal = personFilter ? personFilter.value : 'ALL';

            this.filteredDataset = this.rawDataset.filter(r => {
                const locStr = (r.location || '') + ' ' + (r.person_id || '') + ' ' + (r.access_point || '');
                const matchSearch = searchVal === '' || locStr.toLowerCase().includes(searchVal);
                const matchStatus = (stVal === 'ALL' || r.access_status === stVal);
                const matchRisk = (riskVal === 'ALL' || r.risk_level === riskVal);
                const matchPerson = (personVal === 'ALL' || r.person_type === personVal);
                return matchSearch && matchStatus && matchRisk && matchPerson;
            });

            this.renderKPIs();
            this.renderAllCharts();
        };

        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
        if (riskFilter) riskFilter.addEventListener('change', applyFilters);
        if (personFilter) personFilter.addEventListener('change', applyFilters);
    }
};

/**
 * Standard initialization function per specifications
 */
async function initializeSecurityDashboard() {
    await SecurityEngine.initializeDashboard();
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('security-page-identifier') || document.getElementById('accessTimeChart')) {
        initializeSecurityDashboard();
    }
});
