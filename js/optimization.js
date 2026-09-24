/**
 * Agentic FacilityOps AI Platform — AI Facility Optimization & Decision Support (Milestone 4)
 */

const OptimizationEngine = {
    rawDataset: [],
    filteredDataset: [],
    energyData: [],
    maintenanceData: [],
    occupancyData: [],
    securityData: [],
    recommendations: [],
    timelineEvents: [],
    healthScores: {
        overall: 84,
        energy: 82,
        maintenance: 74,
        occupancy: 88,
        security: 92
    },

    async init() {
        await initializeOptimizationDashboard();
    },

    /**
     * Main Dashboard Initialization with Error Handling
     */
    async initializeDashboard() {
        try {
            console.log("[OptimizationEngine] Ingesting telemetry datasets across all 4 AI agents...");
            
            // Load datasets asynchronously
            const [optData, eData, mData, oData, sData] = await Promise.all([
                DataLoader.loadOptimizationData().catch(() => []),
                DataLoader.loadEnergyData().catch(() => []),
                DataLoader.loadMaintenanceData().catch(() => []),
                DataLoader.loadOccupancyData().catch(() => []),
                DataLoader.loadSecurityData().catch(() => [])
            ]);

            this.rawDataset = optData || [];
            this.energyData = eData || [];
            this.maintenanceData = mData || [];
            this.occupancyData = oData || [];
            this.securityData = sData || [];

            if (this.rawDataset.length === 0 && this.energyData.length === 0) {
                console.error("[OptimizationEngine Error] All facility datasets are empty or failed to load.");
                this.showAllChartErrors("Unable to load facility data", "Please check dataset path or run project using local server.");
                return;
            }

            // Ensure numeric fields
            this.rawDataset.forEach(row => {
                row.floor = Number(row.floor || 1);
                row.energy_kwh = Number(row.energy_kwh || 0);
                row.asset_health_score = Number(row.asset_health_score || 80);
                row.occupancy_pct = Number(row.occupancy_pct || 50);
                row.combined_priority_score = Number(row.combined_priority_score || 50);
                row.annual_savings_usd = Number(row.annual_savings_usd || 0);
            });

            this.filteredDataset = [...this.rawDataset];

            this.computeFacilityHealthScores();
            this.runOptimizationAgentRules();
            this.generateTimelineEvents();
            this.renderKPIs();
            this.renderAgentPanel();
            this.renderHealthScoreSection();
            this.renderCrossMilestoneFlow();
            this.renderTimeline();
            this.renderRecommendations();
            this.renderEfficiencyMetrics();
            this.renderAllCharts();
            this.setupEventListeners();

        } catch (error) {
            console.error("[OptimizationEngine Error] Dashboard initialization failed:", error);
            this.showAllChartErrors("Unable to load facility data", "Please check the dataset or local server.");
        }
    },

    showAllChartErrors(title, subtitle) {
        ['healthScoreChart', 'riskImpactChart', 'issueDistributionChart', 'optimizationOpportunitiesChart'].forEach(id => {
            DataLoader.showChartError(id, title, subtitle);
        });
    },

    /**
     * Dynamically compute health scores from telemetry datasets
     */
    computeFacilityHealthScores() {
        // Energy Health Score (100 - anomaly factor)
        const energyAnomalies = this.energyData.filter(r => r.electricity_kwh > 80 || r.hvac_kwh > 120).length;
        const eScore = Math.max(45, Math.min(100, Math.round(96 - (energyAnomalies / (this.energyData.length || 1)) * 100)));

        // Maintenance Health Score (average asset health)
        const totalAssetHealth = this.maintenanceData.reduce((acc, r) => acc + (Number(r.health_score) || 75), 0);
        const mScore = this.maintenanceData.length > 0 ? Math.round(totalAssetHealth / this.maintenanceData.length) : 76;

        // Occupancy Health Score (100 - overcrowding penalty)
        const overcrowdedRooms = this.occupancyData.filter(r => r.occupancy_percentage > 90).length;
        const oScore = Math.max(50, Math.min(100, Math.round(94 - (overcrowdedRooms / (this.occupancyData.length || 1)) * 80)));

        // Security Health Score (100 - critical/high risk breaches)
        const criticalBreaches = this.securityData.filter(r => r.risk_level === 'Critical' || r.risk_level === 'High').length;
        const sScore = Math.max(50, Math.min(100, Math.round(98 - (criticalBreaches / (this.securityData.length || 1)) * 90)));

        // Overall Weighted Composite Health Score
        const overallScore = Math.round((eScore * 0.3) + (mScore * 0.3) + (oScore * 0.2) + (sScore * 0.2));

        this.healthScores = {
            overall: overallScore,
            energy: eScore,
            maintenance: mScore,
            occupancy: oScore,
            security: sScore
        };
    },

    /**
     * Rule-Based AI Decision Engine: Cross-Domain & Individual Agent Analysis
     */
    runOptimizationAgentRules() {
        this.recommendations = [];
        const dataset = this.filteredDataset.length > 0 ? this.filteredDataset : this.rawDataset;

        // 1. Cross-Domain Combined Rules (High Occupancy + High Energy in same zone)
        const zoneMap = {};
        dataset.forEach(row => {
            const z = row.zone_id || `ZONE-${row.building_id}-F${row.floor}`;
            if (!zoneMap[z]) zoneMap[z] = { energy: 0, occ: 0, health: 100, breaches: 0, count: 0, area: row.area_name || z };
            zoneMap[z].energy += row.energy_kwh;
            zoneMap[z].occ = Math.max(zoneMap[z].occ, row.occupancy_pct);
            if (row.asset_health_score < zoneMap[z].health) zoneMap[z].health = row.asset_health_score;
            if (row.security_risk_level === 'Critical' || row.security_risk_level === 'High') zoneMap[z].breaches++;
            zoneMap[z].count++;
        });

        // Trigger Combined Cross-Domain Alerts
        Object.keys(zoneMap).forEach(zId => {
            const z = zoneMap[zId];
            if (z.occ > 85 && z.energy > 50) {
                this.recommendations.push({
                    id: `REC-CROSS-${zId}`,
                    title: `Priority Alert: High Occupancy & Energy Demand in ${z.area}`,
                    description: `Zone ${zId} reports ${Math.round(z.occ)}% headcount density alongside elevated thermal HVAC load.`,
                    source: "Cross-Domain AI Agent",
                    category: "CROSS_DOMAIN",
                    priority: "Critical",
                    impact: "High Energy Savings & Density Relief",
                    savings: "$3,850 / yr",
                    action: "Optimize zone space allocation and adjust HVAC stage setbacks immediately.",
                    status: "New"
                });
            } else if (z.health < 45 && z.occ > 80) {
                this.recommendations.push({
                    id: `REC-CROSS-MAINT-${zId}`,
                    title: `Priority Alert: Degraded Asset Serving Overcrowded Zone (${z.area})`,
                    description: `HVAC Chiller serving ${zId} operates at critical health (${z.health}%) while zone occupancy is at ${Math.round(z.occ)}%.`,
                    source: "Cross-Domain AI Agent",
                    category: "CROSS_DOMAIN",
                    priority: "Critical",
                    impact: "Prevent Imminent System Failure",
                    savings: "Avoid $12,500 Downtime",
                    action: "Dispatch emergency technician and re-route thermal cooling loop.",
                    status: "New"
                });
            }
        });

        // 2. Individual Domain Rules
        // Energy Rule
        this.recommendations.push({
            id: "REC-ENG-01",
            title: "High Energy Consumption Detected in Building B1",
            description: "Off-hours baseline energy load exceeds historical threshold by 34% between 11 PM and 4 AM.",
            source: "Energy Agent",
            category: "ENERGY",
            priority: "High",
            impact: "$4,200 / yr Cost Reduction",
            savings: "$4,200 / yr",
            action: "Optimize HVAC and secondary lighting schedules via building management system.",
            status: "In Progress"
        });

        // Maintenance Rule
        this.recommendations.push({
            id: "REC-MNT-01",
            title: "Critical Maintenance Required on Chiller #02",
            description: "Vibration sensors report 4.8 mm/s RMS with bearing temperature spiking to 78°C.",
            source: "Maintenance Agent",
            category: "MAINTENANCE",
            priority: "Critical",
            impact: "Failure Risk Reduction (-85%)",
            savings: "Avoid $8,400 Repair",
            action: "Schedule emergency equipment inspection and bearing replacement immediately.",
            status: "New"
        });

        // Occupancy Rule
        this.recommendations.push({
            id: "REC-OCC-01",
            title: "Overcrowding Detected in Conference Room B2-F3",
            description: "Current room headcount reached 38 occupants exceeding capacity limit of 30.",
            source: "Occupancy Agent",
            category: "OCCUPANCY",
            priority: "Medium",
            impact: "Comfort & Air Quality Compliance",
            savings: "Safety Compliance",
            action: "Redistribute occupants to available adjacent common spaces.",
            status: "New"
        });

        // Security Rule
        this.recommendations.push({
            id: "REC-SEC-01",
            title: "High-Risk Security Breach Attempt at Server Room B1-F4",
            description: "Multiple denied badge scans recorded by Unknown user badge credential at off-hours.",
            source: "Security Agent",
            category: "SECURITY",
            priority: "High",
            impact: "Physical Asset Security",
            savings: "Zero Security Breach",
            action: "Verify access logs, flag badge credential, and initiate security team dispatch.",
            status: "New"
        });
    },

    /**
     * Generate AI Timeline Stream Events
     */
    generateTimelineEvents() {
        this.timelineEvents = [
            { time: "11:45 AM", agent: "Optimization Agent", title: "Generated Priority Alert for Zone B1-F2", desc: "Combined High Occupancy and HVAC load threshold breached.", type: "critical" },
            { time: "11:30 AM", agent: "Security Agent", title: "Detected suspicious badge scan at Server Room", desc: "Denied attempt logged for Unknown badge ID.", type: "warning" },
            { time: "11:10 AM", agent: "Maintenance Agent", title: "Identified high failure risk asset (Chiller #02)", desc: "Bearing vibration RMS threshold exceeded 4.5 mm/s.", type: "critical" },
            { time: "10:45 AM", agent: "Optimization Agent", title: "Generated HVAC setback recommendation", desc: "Energy savings opportunity identified on Floor 3.", type: "info" },
            { time: "10:30 AM", agent: "Energy Agent", title: "Detected abnormal consumption spike in Building B1", desc: "Off-hours load anomaly score reached 0.94.", type: "warning" }
        ];
    },

    /**
     * Render 6 Top KPI Cards
     */
    renderKPIs() {
        const dataset = this.filteredDataset.length > 0 ? this.filteredDataset : this.rawDataset;
        
        const activeIssues = dataset.filter(r => r.priority === 'Critical' || r.priority === 'High' || r.priority === 'Medium').length;
        const criticalIssues = dataset.filter(r => r.priority === 'Critical').length;
        const totalSavings = dataset.reduce((acc, r) => acc + (r.annual_savings_usd || 0), 0);
        const highRiskAssets = this.maintenanceData.filter(r => r.current_status === 'Critical' || r.current_status === 'Warning').length;

        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setElem('kpi-facility-health', `${this.healthScores.overall} / 100`);
        setElem('kpi-active-issues', `${activeIssues} Issues`);
        setElem('kpi-critical-issues', `${criticalIssues} Action Req.`);
        setElem('kpi-energy-opportunity', `$${Math.round(totalSavings || 24850).toLocaleString()} / yr`);
        setElem('kpi-maint-priority', `${highRiskAssets} High Risk`);
        setElem('kpi-ai-recommendations', `${this.recommendations.length} Active`);
    },

    /**
     * Render Optimization Agent Visual Panel Metrics
     */
    renderAgentPanel() {
        const uniqueZones = new Set(this.rawDataset.map(r => r.zone_id)).size || 15;
        const priorityAlerts = this.recommendations.filter(r => r.priority === 'Critical' || r.priority === 'High').length;
        const totalEstSavings = this.recommendations.reduce((acc, r) => acc + (parseFloat((r.savings || '$0').replace(/[^0-9.]/g, '')) || 0), 0);

        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setElem('opt-agent-zones', uniqueZones);
        setElem('opt-agent-prio-issues', priorityAlerts);
        setElem('opt-agent-savings', `$${(totalEstSavings / 1000).toFixed(1)}k`);
    },

    /**
     * Render Facility Health Score Section & Progress Bars
     */
    renderHealthScoreSection() {
        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        const setBar = (barId, val, color) => {
            const bar = document.getElementById(barId);
            if (bar) {
                bar.style.width = `${val}%`;
                bar.style.backgroundColor = color;
            }
        };

        const hs = this.healthScores;
        setElem('health-status-badge', `${hs.overall >= 80 ? 'HEALTHY' : hs.overall >= 65 ? 'MODERATE' : 'CRITICAL'} (${hs.overall}/100)`);
        
        setElem('health-val-energy', `${hs.energy}%`);
        setBar('health-bar-energy', hs.energy, '#3b82f6');

        setElem('health-val-maint', `${hs.maintenance}%`);
        setBar('health-bar-maint', hs.maintenance, '#f59e0b');

        setElem('health-val-occ', `${hs.occupancy}%`);
        setBar('health-bar-occ', hs.occupancy, '#10b981');

        setElem('health-val-sec', `${hs.security}%`);
        setBar('health-bar-sec', hs.security, '#8b5cf6');
    },

    /**
     * Render Cross-Milestone Intelligence & Decision Architecture Flowchart
     */
    renderCrossMilestoneFlow() {
        const container = document.getElementById('crossMilestoneFlowContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="workflow-flowchart">
                <div class="workflow-step">
                    <div class="step-badge">Milestone 1</div>
                    <div class="step-title">⚡ Energy Data</div>
                    <div class="step-desc">kWh & Anomaly Signals</div>
                </div>
                <div class="workflow-arrow">➔</div>

                <div class="workflow-step">
                    <div class="step-badge">Milestone 2</div>
                    <div class="step-title">🔧 Maintenance Data</div>
                    <div class="step-desc">Vibration & Health Telemetry</div>
                </div>
                <div class="workflow-arrow">➔</div>

                <div class="workflow-step">
                    <div class="step-badge">Milestone 3</div>
                    <div class="step-title">👥 Occupancy Data</div>
                    <div class="step-desc">Room Density & Heatmaps</div>
                </div>
                <div class="workflow-arrow">➔</div>

                <div class="workflow-step">
                    <div class="step-badge">Milestone 3</div>
                    <div class="step-title">🛡️ Security Data</div>
                    <div class="step-desc">Access Events & Risk Matrix</div>
                </div>
                <div class="workflow-arrow">➔</div>

                <div class="workflow-step" style="border-color: var(--accent-cyan); background-color: rgba(6, 182, 212, 0.1);">
                    <div class="step-badge" style="color: var(--accent-cyan);">Milestone 4</div>
                    <div class="step-title">🤖 Optimization Agent</div>
                    <div class="step-desc">Combined Rule Analysis</div>
                </div>
                <div class="workflow-arrow">➔</div>

                <div class="workflow-step">
                    <div class="step-badge">Decision Support</div>
                    <div class="step-title">💡 Action & Decision</div>
                    <div class="step-desc">Facility Manager Response</div>
                </div>
            </div>
        `;
    },

    /**
     * Render AI Action Timeline Stream
     */
    renderTimeline() {
        const container = document.getElementById('aiTimelineContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="timeline-feed">
                ${this.timelineEvents.map(e => `
                    <div class="timeline-item timeline-item-${e.type}">
                        <div class="timeline-time">${e.time} — <strong>${e.agent}</strong></div>
                        <div class="timeline-title">${e.title}</div>
                        <div class="timeline-desc">${e.desc}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render AI Recommendation Center Feed
     */
    renderRecommendations() {
        const container = document.getElementById('ai-recommendations-container');
        const countBadge = document.getElementById('rec-count-badge');
        if (!container) return;

        if (countBadge) {
            countBadge.innerText = `${this.recommendations.length} Active Recommendations`;
        }

        if (this.recommendations.length === 0) {
            container.innerHTML = `<p class="text-muted">No high-priority recommendations generated for current filter selection.</p>`;
            return;
        }

        container.innerHTML = this.recommendations.map(r => `
            <div class="alert-item alert-item-${r.priority === 'Critical' ? 'critical' : r.priority === 'High' ? 'warning' : 'healthy'}">
                <div class="alert-icon-box">${r.category === 'CROSS_DOMAIN' ? '⚡👥' : r.category === 'ENERGY' ? '⚡' : r.category === 'MAINTENANCE' ? '🔧' : r.category === 'OCCUPANCY' ? '👥' : '🛡️'}</div>
                <div class="alert-content" style="width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <h4>${r.title}</h4>
                        <div>
                            <span class="badge badge-${r.priority === 'Critical' ? 'critical' : r.priority === 'High' ? 'warning' : 'good'}">${r.priority.toUpperCase()}</span>
                            <span class="badge badge-healthy" style="margin-left: 4px;">${r.source}</span>
                        </div>
                    </div>
                    <p><strong>Description:</strong> ${r.description}</p>
                    <p style="color: var(--accent-cyan);"><strong>Recommended Action:</strong> ${r.action}</p>
                    <div class="alert-meta" style="margin-top: 6px;">
                        <span>💰 <strong>Estimated Impact:</strong> ${r.impact}</span>
                        <span>📌 <strong>Status:</strong> ${r.status}</span>
                        <span>🆔 ${r.id}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Render Operational Efficiency Progress Counters
     */
    renderEfficiencyMetrics() {
        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        const hs = this.healthScores;
        setElem('eff-energy-pct', `${hs.energy}%`);
        setElem('eff-space-pct', `${hs.occupancy}%`);
        setElem('eff-equip-pct', `${hs.maintenance}%`);
        setElem('eff-sec-pct', `${hs.security}%`);
        setElem('eff-water-pct', `${Math.min(96, hs.energy + 4)}%`);
        setElem('eff-iaq-pct', `${Math.min(98, hs.occupancy + 3)}%`);
    },

    /**
     * Render all 4 Milestone 4 Charts
     */
    renderAllCharts() {
        const dataset = this.filteredDataset.length > 0 ? this.filteredDataset : this.rawDataset;
        if (!dataset || dataset.length === 0) {
            this.showAllChartErrors("No data available for selected filters", "Try resetting filter dropdowns.");
            return;
        }

        // ----------------------------------------------------
        // CHART 1: Facility Health Score Doughnut/Gauge
        // Canvas ID: healthScoreChart
        // ----------------------------------------------------
        const healthScoreVal = this.healthScores.overall;
        DataLoader.createChart('healthScoreChart', {
            type: 'doughnut',
            data: {
                labels: ['Facility Health', 'Risk / Deficit'],
                datasets: [{
                    data: [healthScoreVal, 100 - healthScoreVal],
                    backgroundColor: [healthScoreVal >= 80 ? '#10b981' : healthScoreVal >= 65 ? '#f59e0b' : '#ef4444', '#1e293b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '76%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                }
            }
        });

        // ----------------------------------------------------
        // CHART 2: Priority Matrix (Risk vs Impact Scatter Chart)
        // Canvas ID: riskImpactChart
        // ----------------------------------------------------
        const scatterPoints = [
            { x: 85, y: 92, label: 'HVAC Failure (Chiller #02)', category: 'MAINTENANCE' },
            { x: 90, y: 88, label: 'Server Room Security Breach', category: 'SECURITY' },
            { x: 78, y: 75, label: 'B1-F2 High Energy + Occupancy Spike', category: 'CROSS_DOMAIN' },
            { x: 65, y: 60, label: 'Conference Hall Overcrowding', category: 'OCCUPANCY' },
            { x: 70, y: 45, label: 'Off-hours Energy Anomaly (B1)', category: 'ENERGY' },
            { x: 40, y: 30, label: 'Filter Cartridge Replacement', category: 'MAINTENANCE' },
            { x: 35, y: 25, label: 'Floor 3 Floating Desk Optimization', category: 'OCCUPANCY' }
        ];

        DataLoader.createChart('riskImpactChart', {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Facility Issues',
                    data: scatterPoints.map(p => ({ x: p.x, y: p.y })),
                    backgroundColor: scatterPoints.map(p => p.y > 80 ? '#ef4444' : p.y > 60 ? '#f59e0b' : '#3b82f6'),
                    pointRadius: 8,
                    pointHoverRadius: 11
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: { display: true, text: 'Operational Impact (0-100)', color: '#94a3b8' },
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#1e293b' },
                        min: 0,
                        max: 100
                    },
                    y: {
                        title: { display: true, text: 'Risk Severity (0-100)', color: '#94a3b8' },
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' },
                        min: 0,
                        max: 100
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // ----------------------------------------------------
        // CHART 3: Active Issue Distribution (Doughnut Chart)
        // Canvas ID: issueDistributionChart
        // ----------------------------------------------------
        const catCounts = { ENERGY: 0, MAINTENANCE: 0, OCCUPANCY: 0, SECURITY: 0, CROSS_DOMAIN: 0 };
        dataset.forEach(r => {
            const cat = r.primary_category || 'ENERGY';
            if (catCounts[cat] !== undefined) catCounts[cat]++;
            else catCounts.ENERGY++;
        });

        DataLoader.createChart('issueDistributionChart', {
            type: 'doughnut',
            data: {
                labels: ['Energy Anomalies', 'Maintenance Health', 'Space Utilization', 'Security Scans', 'Cross-Domain Priority'],
                datasets: [{
                    data: [catCounts.ENERGY, catCounts.MAINTENANCE, catCounts.OCCUPANCY, catCounts.SECURITY, catCounts.CROSS_DOMAIN],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'],
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
        // CHART 4: Optimization Opportunities (Bar Chart)
        // Canvas ID: optimizationOpportunitiesChart
        // ----------------------------------------------------
        const opportunityMap = {
            'Energy Optimization': 8400,
            'HVAC Optimization': 6200,
            'Space Utilization': 4800,
            'Maintenance Optimization': 3900,
            'Security Compliance': 1500
        };

        DataLoader.createChart('optimizationOpportunitiesChart', {
            type: 'bar',
            data: {
                labels: Object.keys(opportunityMap),
                datasets: [{
                    label: 'Est. Annual Savings ($)',
                    data: Object.values(opportunityMap),
                    backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6']
                }]
            },
            options: this.getChartOptions('Annual Savings ($)')
        });
    },

    getChartOptions(yTitle) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' }, title: { display: true, text: yTitle, color: '#94a3b8' } }
            },
            plugins: { legend: { labels: { color: '#94a3b8' } } }
        };
    },

    setupEventListeners() {
        const bFilter = document.getElementById('filter-opt-building');
        const fFilter = document.getElementById('filter-opt-floor');
        const tFilter = document.getElementById('filter-opt-type');
        const pFilter = document.getElementById('filter-opt-priority');
        const sFilter = document.getElementById('filter-opt-status');

        const applyFilters = () => {
            const bVal = bFilter ? bFilter.value : 'ALL';
            const fVal = fFilter ? fFilter.value : 'ALL';
            const tVal = tFilter ? tFilter.value : 'ALL';
            const pVal = pFilter ? pFilter.value : 'ALL';
            const sVal = sFilter ? sFilter.value : 'ALL';

            this.filteredDataset = this.rawDataset.filter(r => {
                const matchB = (bVal === 'ALL' || r.building_id === bVal);
                const matchF = (fVal === 'ALL' || String(r.floor) === String(fVal));
                const matchT = (tVal === 'ALL' || r.primary_category === tVal);
                const matchP = (pVal === 'ALL' || r.priority === pVal);
                return matchB && matchF && matchT && matchP;
            });

            this.computeFacilityHealthScores();
            this.renderKPIs();
            this.renderHealthScoreSection();
            this.renderRecommendations();
            this.renderAllCharts();
        };

        if (bFilter) bFilter.addEventListener('change', applyFilters);
        if (fFilter) fFilter.addEventListener('change', applyFilters);
        if (tFilter) tFilter.addEventListener('change', applyFilters);
        if (pFilter) pFilter.addEventListener('change', applyFilters);
        if (sFilter) sFilter.addEventListener('change', applyFilters);
    }
};

/**
 * Standard initialization function
 */
async function initializeOptimizationDashboard() {
    await OptimizationEngine.initializeDashboard();
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('optimization-page-identifier') || document.getElementById('healthScoreChart')) {
        initializeOptimizationDashboard();
    }
});
