/**
 * Agentic FacilityOps AI Platform - Predictive Maintenance Engine (Milestone 2)
 */

const MaintenanceEngine = {
    rawDataset: [],
    filteredDataset: [],
    alerts: [],
    charts: {},
    currentSort: 'asc', // 'asc' or 'desc' for health score

    /**
     * Initializes Maintenance Page
     */
    async init() {
        try {
            this.rawDataset = await DataLoader.loadMaintenanceData();
            
            // Enrich dataset with dynamic health calculation & risk engine
            this.rawDataset = this.rawDataset.map(asset => this.evaluateAssetTelemetry(asset));
            this.filteredDataset = [...this.rawDataset];

            this.generateMaintenanceAlerts();
            this.renderKPIs();
            this.renderAgentPanel();
            this.renderCharts();
            this.renderTable();
            this.renderAlerts();
            this.setupEventListeners();
        } catch (err) {
            console.error("Error initializing MaintenanceEngine:", err);
        }
    },

    /**
     * Multi-Factor Equipment Health Scoring & Predictive Risk Algorithm
     */
    evaluateAssetTelemetry(asset) {
        const temp = Number(asset.temperature !== undefined ? asset.temperature : 40);
        const vib = Number(asset.vibration !== undefined ? asset.vibration : 1.0);
        const press = Number(asset.pressure !== undefined ? asset.pressure : 50);
        const hours = Number(asset.operating_hours !== undefined ? asset.operating_hours : 2000);
        const failures = Number(asset.failure_count !== undefined ? asset.failure_count : 0);

        // 1. Calculate Penalty Deductions
        const vibPenalty = Math.min(35, Math.max(0, (vib - 1.8) * 8.0));
        const tempPenalty = Math.min(30, Math.max(0, (temp - 50.0) * 1.1));
        const hoursPenalty = Math.min(20, (hours / 18000.0) * 18.0);
        const failPenalty = failures * 6.0;
        
        const totalPenalty = vibPenalty + tempPenalty + hoursPenalty + failPenalty;
        let calculatedScore = Math.max(5, Math.min(100, Math.round(100 - totalPenalty)));

        // 2. Determine Health Category
        let healthLabel = "Excellent";
        let statusClass = "Healthy";

        if (calculatedScore >= 90) {
            healthLabel = "Excellent";
            statusClass = "Healthy";
        } else if (calculatedScore >= 75) {
            healthLabel = "Good";
            statusClass = "Good";
        } else if (calculatedScore >= 50) {
            healthLabel = "Warning";
            statusClass = "Warning";
        } else {
            healthLabel = "Critical";
            statusClass = "Critical";
        }

        // 3. Predictive Maintenance Failure Risk Engine
        // IF high vibration + high temp + high operating hours + failure history => High Risk
        let riskScore = 0;
        if (vib > 3.5) riskScore += 35;
        if (temp > 65.0) riskScore += 30;
        if (hours > 12000) riskScore += 20;
        if (failures >= 2) riskScore += 20;

        let riskLevel = "Low Risk";
        let maintRecommended = false;

        if (riskScore >= 60 || calculatedScore < 50) {
            riskLevel = "High Risk";
            maintRecommended = true;
        } else if (riskScore >= 30 || calculatedScore < 75) {
            riskLevel = "Medium Risk";
            maintRecommended = false;
        }

        return {
            ...asset,
            calculated_health_score: calculatedScore,
            health_label: healthLabel,
            computed_status: statusClass,
            risk_level: riskLevel,
            maintenance_recommended: maintRecommended
        };
    },

    /**
     * Generates Maintenance Alerts based on critical asset conditions
     */
    generateMaintenanceAlerts() {
        this.alerts = [];
        this.rawDataset.forEach(asset => {
            if (asset.computed_status === 'Critical' || asset.risk_level === 'High Risk') {
                let problemStr = [];
                if (asset.vibration > 3.2) problemStr.push(`High Vibration (${asset.vibration} mm/s)`);
                if (asset.temperature > 65) problemStr.push(`Thermal Overheating (${asset.temperature}°C)`);
                if (asset.operating_hours > 12000) problemStr.push(`High Service Hours (${asset.operating_hours.toLocaleString()} hrs)`);

                const probText = problemStr.length > 0 ? problemStr.join(', ') : 'Telemetry parameters exceeding safety threshold.';

                this.alerts.push({
                    id: `ALT-${asset.asset_id}`,
                    assetId: asset.asset_id,
                    assetName: asset.asset_name,
                    building: asset.building_id,
                    floor: asset.floor,
                    type: asset.asset_type,
                    healthScore: asset.calculated_health_score,
                    problem: `${asset.asset_id} (${asset.asset_name}): ${probText}`,
                    riskLevel: asset.risk_level,
                    recommendedAction: asset.computed_status === 'Critical' ? 'Immediate Emergency Inspection & Component Replacement' : 'Schedule Predictive Service within 48 Hours',
                    date: asset.next_maintenance_due || '2026-09-12'
                });
            }
        });
    },

    /**
     * Renders Maintenance KPI Cards
     */
    renderKPIs() {
        const data = this.rawDataset;
        const total = data.length;
        
        const healthyCount = data.filter(a => a.computed_status === 'Healthy' || a.computed_status === 'Good').length;
        const warningCount = data.filter(a => a.computed_status === 'Warning').length;
        const criticalCount = data.filter(a => a.computed_status === 'Critical').length;
        const dueCount = data.filter(a => a.maintenance_recommended || a.computed_status === 'Critical' || a.computed_status === 'Warning').length;
        const predictedFailures = data.filter(a => a.risk_level === 'High Risk').length;

        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setElem('kpi-total-assets', total.toLocaleString());
        setElem('kpi-healthy-assets', healthyCount.toLocaleString());
        setElem('kpi-attention-assets', warningCount.toLocaleString());
        setElem('kpi-critical-assets', criticalCount.toLocaleString());
        setElem('kpi-maint-due', dueCount.toLocaleString());
        setElem('kpi-predicted-failures', predictedFailures.toLocaleString());
    },

    /**
     * Renders Maintenance Agent Visual Panel
     */
    renderAgentPanel() {
        const highRisk = this.rawDataset.filter(a => a.risk_level === 'High Risk').length;
        const maintDue = this.rawDataset.filter(a => a.maintenance_recommended).length;
        const predictedFailures = this.rawDataset.filter(a => a.computed_status === 'Critical').length;

        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setElem('maint-agent-monitored', this.rawDataset.length);
        setElem('maint-agent-highrisk', highRisk);
        setElem('maint-agent-due', maintDue);
        setElem('maint-agent-failures', predictedFailures);
    },

    /**
     * Render Chart.js Visualizations
     */
    renderCharts() {
        const data = this.rawDataset;
        if (!data || data.length === 0) return;

        // Chart 1: Equipment Health Score Distribution (Doughnut Chart)
        const counts = { Excellent: 0, Good: 0, Warning: 0, Critical: 0 };
        data.forEach(a => {
            const label = a.health_label || (a.calculated_health_score >= 90 ? 'Excellent' : a.calculated_health_score >= 75 ? 'Good' : a.calculated_health_score >= 50 ? 'Warning' : 'Critical');
            if (counts[label] !== undefined) {
                counts[label]++;
            }
        });

        this.buildChart('chart-health-distribution', {
            type: 'doughnut',
            data: {
                labels: ['Excellent (90-100)', 'Good (75-89)', 'Warning (50-74)', 'Critical (0-49)'],
                datasets: [{
                    data: [counts.Excellent, counts.Good, counts.Warning, counts.Critical],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
            }
        });

        // Chart 2: Assets by Type & Risk Level (Bar Chart)
        const typeMap = {};
        data.forEach(a => {
            const typeKey = a.asset_type || 'Other';
            if (!typeMap[typeKey]) typeMap[typeKey] = { Low: 0, Medium: 0, High: 0 };
            if (a.risk_level === 'High Risk') typeMap[typeKey].High++;
            else if (a.risk_level === 'Medium Risk') typeMap[typeKey].Medium++;
            else typeMap[typeKey].Low++;
        });

        const types = Object.keys(typeMap);

        this.buildChart('chart-risk-by-type', {
            type: 'bar',
            data: {
                labels: types,
                datasets: [
                    { label: 'Low Risk', data: types.map(t => typeMap[t].Low), backgroundColor: '#10b981' },
                    { label: 'Medium Risk', data: types.map(t => typeMap[t].Medium), backgroundColor: '#f59e0b' },
                    { label: 'High Risk', data: types.map(t => typeMap[t].High), backgroundColor: '#ef4444' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                    y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                },
                plugins: { legend: { labels: { color: '#94a3b8' } } }
            }
        });
    },

    /**
     * Defensive helper to build/update Chart instance with CDN loading check
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

    /**
     * Render Equipment Table
     */
    renderTable() {
        const tbody = document.getElementById('equipment-table-body');
        if (!tbody) return;

        const data = this.filteredDataset;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#94a3b8;">No matching assets found.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.slice(0, 100).map(asset => {
            const score = asset.calculated_health_score;
            let barColor = '#10b981';
            if (score < 50) barColor = '#ef4444';
            else if (score < 75) barColor = '#f59e0b';
            else if (score < 90) barColor = '#3b82f6';

            const badgeClass = (asset.computed_status || 'Healthy').toLowerCase();

            return `
                <tr>
                    <td><strong>${asset.asset_id}</strong></td>
                    <td>${asset.asset_name}</td>
                    <td>${asset.asset_type}</td>
                    <td>Bldg ${asset.building_id} (Fl ${asset.floor})</td>
                    <td>
                        <div class="health-bar-container">
                            <div class="health-bar-fill" style="width: ${score}%; background-color: ${barColor};"></div>
                        </div>
                        <strong>${score}</strong>/100
                    </td>
                    <td><span class="badge badge-${badgeClass}">${asset.computed_status}</span></td>
                    <td>${asset.last_maintenance_date || 'N/A'}</td>
                    <td>${asset.next_maintenance_due || 'N/A'}</td>
                    <td>
                        <span class="badge badge-${asset.risk_level === 'High Risk' ? 'critical' : asset.risk_level === 'Medium Risk' ? 'warning' : 'healthy'}">
                            ${asset.risk_level}
                        </span>
                        ${asset.maintenance_recommended ? '<br><span style="font-size:0.7rem; color:#f87171; font-weight:bold;">⚠️ Maint Recommended</span>' : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Render Maintenance Alerts Feed
     */
    renderAlerts() {
        const container = document.getElementById('maintenance-alerts-container');
        if (!container) return;

        if (this.alerts.length === 0) {
            container.innerHTML = `<p class="text-muted">All systems operational. No critical maintenance alerts.</p>`;
            return;
        }

        container.innerHTML = this.alerts.slice(0, 10).map(a => `
            <div class="alert-item alert-item-${a.riskLevel === 'High Risk' ? 'critical' : 'warning'}">
                <div class="alert-icon-box">🔧</div>
                <div class="alert-content">
                    <h4>${a.problem} — <span class="badge badge-${a.riskLevel === 'High Risk' ? 'critical' : 'warning'}">${a.riskLevel}</span></h4>
                    <p><strong>Action Required:</strong> ${a.recommendedAction}</p>
                    <div class="alert-meta">
                        <span>🏢 Building ${a.building} (Floor ${a.floor})</span>
                        <span>📊 Asset Health: ${a.healthScore}/100</span>
                        <span>📅 Due Date: ${a.date}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Table Filter & Search Controls
     */
    setupEventListeners() {
        const searchInput = document.getElementById('search-asset');
        const typeFilter = document.getElementById('filter-asset-type');
        const statusFilter = document.getElementById('filter-asset-status');
        const sortBtn = document.getElementById('btn-sort-health');

        const applyTableFilters = () => {
            const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const typeVal = typeFilter ? typeFilter.value : 'ALL';
            const statusVal = statusFilter ? statusFilter.value : 'ALL';

            this.filteredDataset = this.rawDataset.filter(asset => {
                const matchSearch = asset.asset_id.toLowerCase().includes(searchVal) || asset.asset_name.toLowerCase().includes(searchVal);
                const matchType = (typeVal === 'ALL' || asset.asset_type === typeVal);
                const matchStatus = (statusVal === 'ALL' || asset.computed_status === statusVal);
                return matchSearch && matchType && matchStatus;
            });

            if (this.currentSort === 'asc') {
                this.filteredDataset.sort((a, b) => a.calculated_health_score - b.calculated_health_score);
            } else {
                this.filteredDataset.sort((a, b) => b.calculated_health_score - a.calculated_health_score);
            }

            this.renderTable();
        };

        if (searchInput) searchInput.addEventListener('input', applyTableFilters);
        if (typeFilter) typeFilter.addEventListener('change', applyTableFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyTableFilters);

        if (sortBtn) {
            sortBtn.addEventListener('click', () => {
                this.currentSort = this.currentSort === 'asc' ? 'desc' : 'asc';
                sortBtn.innerText = this.currentSort === 'asc' ? 'Sort Health: Low → High' : 'Sort Health: High → Low';
                applyTableFilters();
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('maintenance-page-identifier')) {
        MaintenanceEngine.init();
    }
});
