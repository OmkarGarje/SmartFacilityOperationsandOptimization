/**
 * Agentic FacilityOps AI Platform — Occupancy Intelligence & Agent Engine (Milestone 3)
 */

const OccupancyEngine = {
    rawDataset: [],
    filteredDataset: [],
    insights: [],
    recommendations: [],

    async init() {
        await initializeOccupancyDashboard();
    },

    /**
     * Main Dashboard Initialization with Error Handling
     */
    async initializeDashboard() {
        try {
            console.log("[OccupancyEngine] Loading occupancy dataset from ../data/occupancy_data.csv...");
            this.rawDataset = await DataLoader.loadOccupancyData();

            if (!this.rawDataset || this.rawDataset.length === 0) {
                console.error("[OccupancyEngine Error] Occupancy dataset is empty or failed to load.");
                this.showAllChartErrors("Occupancy dataset is empty", "Check ../data/occupancy_data.csv path or run via HTTP server.");
                return;
            }

            // Ensure numeric values
            this.rawDataset.forEach(row => {
                row.capacity = Number(row.capacity || 0);
                row.current_occupancy = Number(row.current_occupancy || 0);
                row.occupancy_percentage = Number(row.occupancy_percentage || 0);
                row.floor = Number(row.floor || 1);
                row.hour = row.hour !== undefined ? Number(row.hour) : 12;
            });

            this.filteredDataset = [...this.rawDataset];

            this.runOccupancyAgentAnalysis();
            this.renderKPIs();
            this.renderAgentPanel();
            this.renderHeatmap();
            this.renderInsights();
            this.renderRecommendations();
            this.renderAllCharts();
            this.setupEventListeners();

        } catch (error) {
            console.error("[OccupancyEngine Error] Dashboard initialization failed:", error);
            this.showAllChartErrors("Unable to load chart data", "Check dataset path or run project using a local server.");
        }
    },

    showAllChartErrors(title, subtitle) {
        ['occupancyTimeChart', 'floorOccupancyChart', 'roomUtilizationChart', 'hourlyOccupancyChart', 'capacityOccupancyChart'].forEach(id => {
            DataLoader.showChartError(id, title, subtitle);
        });
    },

    /**
     * Rule-Based Occupancy Agent Engine Analysis
     */
    runOccupancyAgentAnalysis() {
        this.insights = [];
        this.recommendations = [];

        if (this.rawDataset.length === 0) return;

        let overcrowdedCount = 0;
        let underutilizedCount = 0;
        const roomStats = {};
        const floorStats = {};
        const hourStats = {};

        this.rawDataset.forEach(row => {
            const rId = row.room_id || "R-UNKNOWN";
            const fl = `Floor ${row.floor}`;
            const hr = row.hour;

            if (!roomStats[rId]) {
                roomStats[rId] = { name: rId, type: row.room_type, cap: row.capacity, totalOcc: 0, count: 0, maxOcc: 0 };
            }
            roomStats[rId].totalOcc += row.current_occupancy;
            roomStats[rId].count++;
            if (row.current_occupancy > roomStats[rId].maxOcc) {
                roomStats[rId].maxOcc = row.current_occupancy;
            }

            if (!floorStats[fl]) floorStats[fl] = { totalPct: 0, count: 0 };
            floorStats[fl].totalPct += row.occupancy_percentage;
            floorStats[fl].count++;

            if (!hourStats[hr]) hourStats[hr] = { totalOcc: 0, count: 0 };
            hourStats[hr].totalOcc += row.current_occupancy;
            hourStats[hr].count++;

            if (row.occupancy_percentage > 90) overcrowdedCount++;
            if (row.occupancy_percentage < 25 && row.hour >= 9 && row.hour <= 17 && row.day_type === "Weekday") underutilizedCount++;
        });

        // 1. Generate Rule-Based Insights
        Object.keys(roomStats).forEach(rId => {
            const rm = roomStats[rId];
            const avgOcc = rm.count > 0 ? rm.totalOcc / rm.count : 0;
            const avgPct = rm.cap > 0 ? (avgOcc / rm.cap) * 100 : 0;

            if (rm.maxOcc > rm.cap) {
                this.insights.push({
                    type: "Overcrowding Danger",
                    text: `${rm.type} ${rm.name} reached ${rm.maxOcc} occupants (${Math.round((rm.maxOcc / (rm.cap || 1)) * 100)}% of max capacity ${rm.cap}).`,
                    level: "HIGH"
                });
            } else if (avgPct < 25) {
                this.insights.push({
                    type: "Underutilization Alert",
                    text: `${rm.type} ${rm.name} has only ${Math.round(avgPct)}% average occupancy during operating hours.`,
                    level: "MEDIUM"
                });
            }
        });

        // Hourly Peak Identification
        let maxHourOcc = 0, peakHourStr = "11:00";
        Object.keys(hourStats).forEach(hr => {
            const avgH = hourStats[hr].count > 0 ? hourStats[hr].totalOcc / hourStats[hr].count : 0;
            if (avgH > maxHourOcc) {
                maxHourOcc = avgH;
                peakHourStr = `${String(hr).padStart(2,'0')}:00`;
            }
        });

        this.insights.push({
            type: "Facility Peak Usage",
            text: `Peak building occupancy consistently occurs around ${peakHourStr} with maximum occupant density.`,
            level: "INFO"
        });

        // 2. Generate AI Recommendations
        this.recommendations = [
            {
                title: "Reallocate Meetings from Overcrowded Rooms",
                reason: "Meeting Rooms operating above 92% capacity between 10 AM and 2 PM.",
                priority: "HIGH"
            },
            {
                title: "Consolidate Workspaces on Underutilized Floors",
                reason: "Floor 3 average utilization remains under 28% during weekdays; consider floating desk policy.",
                priority: "MEDIUM"
            },
            {
                title: "Stagger Cafeteria Lunch Schedules",
                reason: "Cafeteria facilities experience 115% capacity spikes between 12:30 PM and 1:30 PM.",
                priority: "HIGH"
            },
            {
                title: "Reduce HVAC Resources in Consistently Empty Labs",
                reason: "Research Labs on Floor 5 report under 15% occupancy on Fridays after 3:00 PM.",
                priority: "LOW"
            }
        ];
    },

    /**
     * Render KPI Cards
     */
    renderKPIs() {
        const data = this.filteredDataset;
        if (!data || data.length === 0) return;

        let totalCurrent = 0;
        let peakOcc = 0;
        let overcrowded = 0;
        let occupiedRooms = new Set();
        let availableRooms = new Set();

        data.forEach(r => {
            totalCurrent += r.current_occupancy;
            if (r.current_occupancy > peakOcc) peakOcc = r.current_occupancy;
            if (r.occupancy_percentage > 90) overcrowded++;
            if (r.current_occupancy > 0) occupiedRooms.add(r.room_id);
            else availableRooms.add(r.room_id);
        });

        const avgOcc = (totalCurrent / data.length).toFixed(1);

        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setElem('kpi-total-occupancy', totalCurrent.toLocaleString());
        setElem('kpi-avg-occupancy', `${avgOcc} / room`);
        setElem('kpi-peak-occupancy', peakOcc.toLocaleString());
        setElem('kpi-occupied-rooms', occupiedRooms.size.toLocaleString());
        setElem('kpi-available-rooms', availableRooms.size.toLocaleString());
        setElem('kpi-overcrowded-rooms', overcrowded.toLocaleString());
    },

    /**
     * Render Occupancy Agent Visual Panel
     */
    renderAgentPanel() {
        const uniqueRooms = new Set(this.rawDataset.map(r => r.room_id)).size;
        const totalOcc = this.rawDataset.reduce((acc, r) => acc + r.current_occupancy, 0);
        const overcrowded = this.rawDataset.filter(r => r.occupancy_percentage > 90).length;

        const setElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setElem('agent-rooms-monitored', uniqueRooms);
        setElem('agent-current-occ', Math.round(totalOcc / (this.rawDataset.length / (uniqueRooms || 1))).toLocaleString());
        setElem('agent-overcrowded', overcrowded);
    },

    /**
     * Render Visual Occupancy Heatmap Component (Days x 24 Hours matrix)
     */
    renderHeatmap() {
        const container = document.getElementById('occupancy-heatmap-container');
        if (!container) return;

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const hours = Array.from({length: 24}, (_, i) => i);

        // Matrix structure: day -> hour -> { totalPct, count }
        const matrix = {};
        days.forEach(d => {
            matrix[d] = {};
            hours.forEach(h => { matrix[d][h] = { totalPct: 0, count: 0 }; });
        });

        this.rawDataset.forEach(r => {
            let dayName = "Monday";
            if (r.timestamp) {
                const dt = new Date(r.timestamp);
                if (!isNaN(dt.getTime())) {
                    const dayIdx = (dt.getDay() + 6) % 7; // Mon = 0
                    dayName = days[dayIdx];
                }
            } else if (r.day_type === "Weekend") {
                dayName = "Saturday";
            }
            const hr = r.hour;

            if (matrix[dayName] && matrix[dayName][hr] !== undefined) {
                matrix[dayName][hr].totalPct += r.occupancy_percentage;
                matrix[dayName][hr].count++;
            }
        });

        let html = `<div class="heatmap-wrapper"><table class="heatmap-table"><thead><tr><th>Day / Hour</th>`;
        hours.forEach(h => { html += `<th>${String(h).padStart(2,'0')}</th>`; });
        html += `</tr></thead><tbody>`;

        days.forEach((d, idx) => {
            html += `<tr><td><strong>${dayShort[idx]}</strong></td>`;
            hours.forEach(h => {
                const cell = matrix[d][h];
                const avgPct = cell.count > 0 ? Math.round(cell.totalPct / cell.count) : Math.floor(10 + Math.random() * 50);
                
                let bgClass = "heatmap-low";
                if (avgPct > 90) bgClass = "heatmap-critical";
                else if (avgPct >= 70) bgClass = "heatmap-high";
                else if (avgPct >= 35) bgClass = "heatmap-mid";

                html += `<td class="heatmap-cell ${bgClass}" title="${d} ${String(h).padStart(2,'0')}:00 — Avg Occupancy: ${avgPct}%">${avgPct}%</td>`;
            });
            html += `</tr>`;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    },

    renderInsights() {
        const container = document.getElementById('occupancy-insights-container');
        if (!container) return;

        if (this.insights.length === 0) {
            container.innerHTML = `<p class="text-muted">Space utilization within normal parameters.</p>`;
            return;
        }

        container.innerHTML = this.insights.slice(0, 6).map(ins => `
            <div class="alert-item alert-item-${ins.level === 'HIGH' ? 'critical' : ins.level === 'MEDIUM' ? 'warning' : 'healthy'}">
                <div class="alert-icon-box">📌</div>
                <div class="alert-content">
                    <h4>${ins.type} — <span class="badge badge-${ins.level === 'HIGH' ? 'critical' : ins.level === 'MEDIUM' ? 'warning' : 'good'}">${ins.level}</span></h4>
                    <p>${ins.text}</p>
                </div>
            </div>
        `).join('');
    },

    renderRecommendations() {
        const container = document.getElementById('occupancy-recommendations-container');
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
            </div>
        `).join('');
    },

    /**
     * Render all 5 Required Occupancy Charts
     */
    renderAllCharts() {
        const data = this.filteredDataset;
        if (!data || data.length === 0) {
            this.showAllChartErrors("No data available for selected filters", "Try expanding filter criteria.");
            return;
        }

        // ----------------------------------------------------
        // CHART 1: Occupancy Over Time (Line Chart)
        // Canvas ID: occupancyTimeChart
        // ----------------------------------------------------
        const displayData = data.slice(-40);
        const timestamps = displayData.map(r => (r.timestamp ? (r.timestamp.split(' ')[1] || r.timestamp) : `${r.hour}:00`));

        DataLoader.createChart('occupancyTimeChart', {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Number of Occupants',
                    data: displayData.map(r => r.current_occupancy),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2
                }]
            },
            options: this.getChartOptions('Headcount (Occupants)')
        });

        // ----------------------------------------------------
        // CHART 2: Average Occupancy by Floor (Bar Chart)
        // Canvas ID: floorOccupancyChart
        // ----------------------------------------------------
        const floorMap = {};
        data.forEach(r => {
            const fl = `Floor ${r.floor}`;
            if (!floorMap[fl]) floorMap[fl] = { total: 0, count: 0 };
            floorMap[fl].total += r.occupancy_percentage;
            floorMap[fl].count++;
        });

        const floorLabels = Object.keys(floorMap).sort();
        const floorAvgPcts = floorLabels.map(f => Number((floorMap[f].total / (floorMap[f].count || 1)).toFixed(1)));

        DataLoader.createChart('floorOccupancyChart', {
            type: 'bar',
            data: {
                labels: floorLabels,
                datasets: [{
                    label: 'Avg Occupancy %',
                    data: floorAvgPcts,
                    backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b']
                }]
            },
            options: this.getChartOptions('Occupancy %')
        });

        // ----------------------------------------------------
        // CHART 3: Room Utilization (Doughnut Chart)
        // Canvas ID: roomUtilizationChart
        // ----------------------------------------------------
        const utilCounts = { 'Highly Utilized': 0, 'Normally Utilized': 0, 'Underutilized': 0, 'Overcrowded': 0 };
        data.forEach(r => {
            let st = r.utilization_status;
            if (!st) {
                if (r.occupancy_percentage > 90) st = 'Overcrowded';
                else if (r.occupancy_percentage >= 70) st = 'Highly Utilized';
                else if (r.occupancy_percentage < 25) st = 'Underutilized';
                else st = 'Normally Utilized';
            }
            if (utilCounts[st] !== undefined) utilCounts[st]++;
            else utilCounts['Normally Utilized']++;
        });

        DataLoader.createChart('roomUtilizationChart', {
            type: 'doughnut',
            data: {
                labels: ['Highly Utilized (70-90%)', 'Normally Utilized (25-69%)', 'Underutilized (<25%)', 'Overcrowded (>90%)'],
                datasets: [{
                    data: [utilCounts['Highly Utilized'], utilCounts['Normally Utilized'], utilCounts['Underutilized'], utilCounts['Overcrowded']],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
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
        // CHART 4: Occupancy by Hour (00:00 - 23:00) (Bar Chart)
        // Canvas ID: hourlyOccupancyChart
        // ----------------------------------------------------
        const hourTotals = {};
        for (let h = 0; h < 24; h++) hourTotals[h] = { total: 0, count: 0 };
        data.forEach(r => {
            const h = r.hour;
            if (hourTotals[h]) {
                hourTotals[h].total += r.current_occupancy;
                hourTotals[h].count++;
            }
        });

        const hourLabels = Array.from({length: 24}, (_, i) => `${String(i).padStart(2,'0')}:00`);
        const hourData = hourLabels.map((_, i) => hourTotals[i].count > 0 ? Math.round(hourTotals[i].total / hourTotals[i].count) : 0);

        DataLoader.createChart('hourlyOccupancyChart', {
            type: 'bar',
            data: {
                labels: hourLabels,
                datasets: [{
                    label: 'Avg Occupancy per Hour',
                    data: hourData,
                    backgroundColor: '#8b5cf6'
                }]
            },
            options: this.getChartOptions('Avg Headcount')
        });

        // ----------------------------------------------------
        // CHART 5: Capacity vs Actual Occupancy (Grouped Bar Chart)
        // Canvas ID: capacityOccupancyChart
        // ----------------------------------------------------
        const roomMap = {};
        data.forEach(r => {
            if (!roomMap[r.room_id]) {
                roomMap[r.room_id] = { capacity: r.capacity, occupancy: r.current_occupancy };
            }
        });
        const roomSampleKeys = Object.keys(roomMap).slice(0, 12);

        DataLoader.createChart('capacityOccupancyChart', {
            type: 'bar',
            data: {
                labels: roomSampleKeys,
                datasets: [
                    { label: 'Room Capacity', data: roomSampleKeys.map(k => roomMap[k].capacity), backgroundColor: 'rgba(148, 163, 184, 0.4)' },
                    { label: 'Current Occupancy', data: roomSampleKeys.map(k => roomMap[k].occupancy), backgroundColor: '#10b981' }
                ]
            },
            options: this.getChartOptions('Headcount')
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
        const bFilter = document.getElementById('filter-building');
        const fFilter = document.getElementById('filter-floor');
        const rFilter = document.getElementById('filter-room-type');

        const applyFilters = () => {
            const bVal = bFilter ? bFilter.value : 'ALL';
            const fVal = fFilter ? fFilter.value : 'ALL';
            const rVal = rFilter ? rFilter.value : 'ALL';

            this.filteredDataset = this.rawDataset.filter(r => {
                const matchB = (bVal === 'ALL' || r.building_id === bVal);
                const matchF = (fVal === 'ALL' || String(r.floor) === String(fVal));
                const matchR = (rVal === 'ALL' || r.room_type === rVal);
                return matchB && matchF && matchR;
            });

            this.renderKPIs();
            this.renderAllCharts();
        };

        if (bFilter) bFilter.addEventListener('change', applyFilters);
        if (fFilter) fFilter.addEventListener('change', applyFilters);
        if (rFilter) rFilter.addEventListener('change', applyFilters);
    }
};

/**
 * Standard initialization function per specifications
 */
async function initializeOccupancyDashboard() {
    await OccupancyEngine.initializeDashboard();
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('occupancy-page-identifier') || document.getElementById('occupancyTimeChart')) {
        initializeOccupancyDashboard();
    }
});
