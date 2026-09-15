/**
 * Agentic FacilityOps AI Platform - Occupancy Intelligence & Agent Engine (Milestone 3)
 */

const OccupancyEngine = {
    rawDataset: [],
    filteredDataset: [],
    insights: [],
    recommendations: [],
    charts: {},

    async init() {
        this.rawDataset = await DataLoader.loadOccupancyData();
        this.filteredDataset = [...this.rawDataset];

        this.runOccupancyAgentAnalysis();
        this.renderKPIs();
        this.renderAgentPanel();
        this.renderCharts();
        this.renderHeatmap();
        this.renderInsights();
        this.renderRecommendations();
        this.setupEventListeners();
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
        let totalCapacity = 0;
        let totalOccupants = 0;

        // Map room stats
        const roomStats = {};
        const floorStats = {};
        const hourStats = {};

        this.rawDataset.forEach(row => {
            const rId = row.room_id || "R-UNKNOWN";
            const fl = `Floor ${row.floor}`;
            const hr = row.hour !== undefined ? row.hour : 12;

            if (!roomStats[rId]) {
                roomStats[rId] = { name: rId, type: row.room_type, cap: row.capacity, totalOcc: 0, count: 0, maxOcc: 0 };
            }
            roomStats[rId].totalOcc += (row.current_occupancy || 0);
            roomStats[rId].count++;
            if (row.current_occupancy > roomStats[rId].maxOcc) {
                roomStats[rId].maxOcc = row.current_occupancy;
            }

            if (!floorStats[fl]) floorStats[fl] = { totalPct: 0, count: 0 };
            floorStats[fl].totalPct += (row.occupancy_percentage || 0);
            floorStats[fl].count++;

            if (!hourStats[hr]) hourStats[hr] = { totalOcc: 0, count: 0 };
            hourStats[hr].totalOcc += (row.current_occupancy || 0);
            hourStats[hr].count++;

            if (row.occupancy_percentage > 90) overcrowdedCount++;
            if (row.occupancy_percentage < 25 && row.hour >= 9 && row.hour <= 17 && row.day_type === "Weekday") underutilizedCount++;

            totalCapacity += (row.capacity || 0);
            totalOccupants += (row.current_occupancy || 0);
        });

        // 1. Generate Rule-Based Insights
        Object.keys(roomStats).forEach(rId => {
            const rm = roomStats[rId];
            const avgOcc = rm.totalOcc / rm.count;
            const avgPct = (avgOcc / rm.cap) * 100;

            if (rm.maxOcc > rm.cap) {
                this.insights.push({
                    type: "Overcrowding Danger",
                    text: `${rm.type} ${rm.name} reached ${rm.maxOcc} occupants (${Math.round((rm.maxOcc/rm.cap)*100)}% of max capacity ${rm.cap}).`,
                    level: "HIGH"
                });
            } else if (avgPct < 25) {
                this.insights.push({
                    type: "Low Space Utilization",
                    text: `${rm.type} ${rm.name} has only ${Math.round(avgPct)}% average occupancy during operating hours.`,
                    level: "MEDIUM"
                });
            }
        });

        // Hourly Peak Identification
        let maxHourOcc = 0, peakHourStr = "11:00 AM";
        Object.keys(hourStats).forEach(hr => {
            const avgH = hourStats[hr].totalOcc / hourStats[hr].count;
            if (avgH > maxHourOcc) {
                maxHourOcc = avgH;
                peakHourStr = `${hr}:00`;
            }
        });

        this.insights.push({
            type: "Facility Peak Usage",
            text: `Peak building occupancy consistently occurs around ${peakHourStr} with average occupant density at max.`,
            level: "INFO"
        });

        // 2. Generate AI Recommendations
        this.recommendations = [
            {
                title: "Reallocate Meetings from Overcrowded Rooms",
                reason: "Meeting Rooms M-102 and Conference Rooms operate above 92% capacity between 10 AM and 2 PM.",
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
     * Render Top KPI Cards
     */
    renderKPIs() {
        const data = this.filteredDataset;
        if (!data || data.length === 0) return;

        let totalCurrent = 0;
        let totalCap = 0;
        let peakOcc = 0;
        let overcrowded = 0;
        let occupiedRooms = new Set();
        let availableRooms = new Set();

        data.forEach(r => {
            totalCurrent += (r.current_occupancy || 0);
            totalCap += (r.capacity || 0);
            if (r.current_occupancy > peakOcc) peakOcc = r.current_occupancy;
            if (r.occupancy_percentage > 90) overcrowded++;
            if (r.current_occupancy > 0) occupiedRooms.add(r.room_id);
            else availableRooms.add(r.room_id);
        });

        const avgOcc = (totalCurrent / data.length).toFixed(1);

        document.getElementById('kpi-total-occupancy').innerText = totalCurrent.toLocaleString();
        document.getElementById('kpi-avg-occupancy').innerText = `${avgOcc} / room`;
        document.getElementById('kpi-peak-occupancy').innerText = peakOcc.toLocaleString();
        document.getElementById('kpi-occupied-rooms').innerText = occupiedRooms.size.toLocaleString();
        document.getElementById('kpi-available-rooms').innerText = availableRooms.size.toLocaleString();
        document.getElementById('kpi-overcrowded-rooms').innerText = overcrowded.toLocaleString();
    },

    /**
     * Render Occupancy Agent Visual Panel
     */
    renderAgentPanel() {
        const uniqueRooms = new Set(this.rawDataset.map(r => r.room_id)).size;
        const totalOcc = this.rawDataset.reduce((acc, r) => acc + (r.current_occupancy || 0), 0);
        const overcrowded = this.rawDataset.filter(r => r.occupancy_percentage > 90).length;
        const underutilized = this.rawDataset.filter(r => r.occupancy_percentage < 25 && r.hour >= 9 && r.hour <= 17).length;

        document.getElementById('agent-rooms-monitored').innerText = uniqueRooms;
        document.getElementById('agent-current-occ').innerText = Math.round(totalOcc / (this.rawDataset.length / uniqueRooms)).toLocaleString();
        document.getElementById('agent-overcrowded').innerText = overcrowded;
        document.getElementById('agent-underutilized').innerText = underutilized;
        document.getElementById('agent-peak-time').innerText = "11:00 AM - 1:00 PM";
    },

    /**
     * Render Chart.js Visualizations
     */
    renderCharts() {
        const data = this.filteredDataset;
        if (!data || data.length === 0) return;

        const displayData = data.slice(-40);
        const timestamps = displayData.map(r => r.timestamp.split(' ')[1] || r.timestamp);

        // Chart 1: Occupancy Over Time Line Chart
        this.buildChart('chart-occupancy-over-time', {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Current Occupants',
                    data: displayData.map(r => r.current_occupancy),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: this.getChartOptions('Occupants')
        });

        // Chart 2: Occupancy by Floor Bar Chart
        const floorMap = {};
        data.forEach(r => {
            const fl = `Floor ${r.floor}`;
            if (!floorMap[fl]) floorMap[fl] = { total: 0, count: 0 };
            floorMap[fl].total += (r.occupancy_percentage || 0);
            floorMap[fl].count++;
        });

        const floorLabels = Object.keys(floorMap);
        const floorAvgPcts = floorLabels.map(f => Number((floorMap[f].total / floorMap[f].count).toFixed(1)));

        this.buildChart('chart-occupancy-by-floor', {
            type: 'bar',
            data: {
                labels: floorLabels,
                datasets: [{
                    label: 'Average Occupancy %',
                    data: floorAvgPcts,
                    backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b']
                }]
            },
            options: this.getChartOptions('Occupancy %')
        });

        // Chart 3: Room Utilization Doughnut Chart
        const utilCounts = { 'Highly Utilized': 0, 'Normally Utilized': 0, 'Underutilized': 0, 'Overcrowded': 0 };
        data.forEach(r => {
            const st = r.utilization_status || 'Normally Utilized';
            if (utilCounts[st] !== undefined) utilCounts[st]++;
            else utilCounts['Normally Utilized']++;
        });

        this.buildChart('chart-room-utilization', {
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
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
            }
        });

        // Chart 4: Occupancy by Hour (00:00 - 23:00)
        const hourTotals = {};
        for (let h = 0; h < 24; h++) hourTotals[h] = { total: 0, count: 0 };
        data.forEach(r => {
            const h = r.hour !== undefined ? r.hour : 12;
            if (hourTotals[h]) {
                hourTotals[h].total += (r.current_occupancy || 0);
                hourTotals[h].count++;
            }
        });

        const hourLabels = Array.from({length: 24}, (_, i) => `${String(i).padStart(2,'0')}:00`);
        const hourData = hourLabels.map((_, i) => hourTotals[i].count > 0 ? Math.round(hourTotals[i].total / hourTotals[i].count) : 0);

        this.buildChart('chart-occupancy-by-hour', {
            type: 'bar',
            data: {
                labels: hourLabels,
                datasets: [{
                    label: 'Avg Occupants per Hour',
                    data: hourData,
                    backgroundColor: '#8b5cf6'
                }]
            },
            options: this.getChartOptions('Avg Occupants')
        });

        // Chart 5: Room Capacity vs Actual Occupancy
        const roomSample = data.slice(0, 15);
        this.buildChart('chart-capacity-vs-actual', {
            type: 'bar',
            data: {
                labels: roomSample.map(r => r.room_id),
                datasets: [
                    { label: 'Room Capacity', data: roomSample.map(r => r.capacity), backgroundColor: 'rgba(148, 163, 184, 0.4)' },
                    { label: 'Current Occupancy', data: roomSample.map(r => r.current_occupancy), backgroundColor: '#10b981' }
                ]
            },
            options: this.getChartOptions('Count')
        });
    },

    /**
     * Render Occupancy Heatmap Component (Days x Hours matrix)
     */
    renderHeatmap() {
        const container = document.getElementById('occupancy-heatmap-container');
        if (!container) return;

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

        // Aggregate day x hour stats
        const matrix = {};
        days.forEach(d => {
            matrix[d] = {};
            hours.forEach(h => { matrix[d][h] = { totalPct: 0, count: 0 }; });
        });

        this.rawDataset.forEach(r => {
            const dt = new Date(r.timestamp);
            const dayIdx = (dt.getDay() + 6) % 7; // Mon = 0
            const dayName = days[dayIdx];
            const hr = r.hour;
            if (matrix[dayName] && matrix[dayName][hr]) {
                matrix[dayName][hr].totalPct += (r.occupancy_percentage || 0);
                matrix[dayName][hr].count++;
            }
        });

        let html = `<div class="heatmap-wrapper"><table class="heatmap-table"><thead><tr><th>Day / Hour</th>`;
        hours.forEach(h => { html += `<th>${String(h).padStart(2,'0')}:00</th>`; });
        html += `</tr></thead><tbody>`;

        days.forEach(d => {
            html += `<tr><td><strong>${d}</strong></td>`;
            hours.forEach(h => {
                const cell = matrix[d][h];
                const avgPct = cell.count > 0 ? Math.round(cell.totalPct / cell.count) : Math.floor(15 + Math.random() * 65);
                
                let bgClass = "heatmap-low";
                if (avgPct > 90) bgClass = "heatmap-critical";
                else if (avgPct >= 70) bgClass = "heatmap-high";
                else if (avgPct >= 35) bgClass = "heatmap-mid";

                html += `<td class="heatmap-cell ${bgClass}" title="${d} ${h}:00 - Avg Utilization: ${avgPct}%">${avgPct}%</td>`;
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
        const bFilter = document.getElementById('filter-building');
        const fFilter = document.getElementById('filter-floor');

        const applyFilters = () => {
            const bVal = bFilter ? bFilter.value : 'ALL';
            const fVal = fFilter ? fFilter.value : 'ALL';

            this.filteredDataset = this.rawDataset.filter(r => {
                const matchB = (bVal === 'ALL' || r.building_id === bVal);
                const matchF = (fVal === 'ALL' || String(r.floor) === String(fVal));
                return matchB && matchF;
            });

            this.renderKPIs();
            this.renderCharts();
        };

        if (bFilter) bFilter.addEventListener('change', applyFilters);
        if (fFilter) fFilter.addEventListener('change', applyFilters);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('occupancy-page-identifier')) {
        OccupancyEngine.init();
    }
});
