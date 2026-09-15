/**
 * Agentic FacilityOps AI Platform - Expanded Data Loader & Offline Chart Engine
 */

const DataLoader = {
    energyData: [],
    maintenanceData: [],
    occupancyData: [],
    securityData: [],
    chartInstances: {},

    /**
     * Universal Defensive Chart Creator
     * Uses Chart.js CDN when available, or draws native 2D Canvas fallback charts if offline.
     */
    createChart(canvasId, config, retryCount = 0) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas element '${canvasId}' not found in DOM.`);
            return;
        }

        // 1. If Chart.js CDN is loaded
        if (typeof Chart !== 'undefined') {
            try {
                if (this.chartInstances[canvasId]) {
                    this.chartInstances[canvasId].destroy();
                }
                this.chartInstances[canvasId] = new Chart(canvas, config);
                return;
            } catch (err) {
                console.error(`Chart.js error on '${canvasId}':`, err);
            }
        }

        // 2. Retry up to 2 times for slow CDN loading
        if (retryCount < 2) {
            setTimeout(() => this.createChart(canvasId, config, retryCount + 1), 400);
            return;
        }

        // 3. Fallback: Draw Native HTML5 Canvas Chart directly if offline or CDN blocked
        this.drawFallbackChart(canvas, config);
    },

    /**
     * Native 2D HTML5 Canvas Fallback Renderer for Offline Mode
     */
    drawFallbackChart(canvas, config) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement ? canvas.parentElement.clientWidth : (canvas.width || 300);
        const height = canvas.parentElement ? canvas.parentElement.clientHeight : (canvas.height || 220);
        
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);

        const type = config.type || 'bar';
        const labels = (config.data && config.data.labels) || [];
        const datasets = (config.data && config.data.datasets) || [];

        if (datasets.length === 0 || !datasets[0].data || datasets[0].data.length === 0) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', width / 2, height / 2);
            return;
        }

        if (type === 'doughnut' || type === 'pie') {
            const data = datasets[0].data;
            const colors = datasets[0].backgroundColor || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const total = data.reduce((a, b) => a + Number(b), 0) || 1;

            let startAngle = -Math.PI / 2;
            const centerX = width / 2;
            const centerY = height / 2 - 12;
            const radius = Math.min(width, height) / 3.2;

            data.forEach((val, idx) => {
                const sliceAngle = (Number(val) / total) * 2 * Math.PI;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
                if (type === 'doughnut') {
                    ctx.arc(centerX, centerY, radius * 0.55, startAngle + sliceAngle, startAngle, true);
                } else {
                    ctx.lineTo(centerX, centerY);
                }
                ctx.closePath();
                ctx.fillStyle = Array.isArray(colors) ? colors[idx % colors.length] : colors;
                ctx.fill();
                startAngle += sliceAngle;
            });

            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#94a3b8';
            const legendText = labels.map((l, i) => `${l}: ${data[i]}`).join(' | ');
            ctx.fillText(legendText.substring(0, 60), centerX, height - 10);
        } else if (type === 'bar') {
            const data = datasets[0].data;
            const color = (Array.isArray(datasets[0].backgroundColor) ? datasets[0].backgroundColor[0] : datasets[0].backgroundColor) || '#3b82f6';
            const maxVal = Math.max(...data.map(v => Number(v) || 0)) || 1;

            const padding = 35;
            const chartW = width - padding * 2;
            const chartH = height - padding * 2;
            const barWidth = Math.max(4, Math.min(36, (chartW / data.length) - 4));

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.lineTo(width - padding, height - padding);
            ctx.stroke();

            data.forEach((val, idx) => {
                const barH = (Number(val) / maxVal) * chartH;
                const x = padding + idx * (chartW / data.length) + (chartW / data.length - barWidth) / 2;
                const y = height - padding - barH;

                ctx.fillStyle = Array.isArray(datasets[0].backgroundColor) ? datasets[0].backgroundColor[idx % datasets[0].backgroundColor.length] : color;
                ctx.fillRect(x, y, barWidth, barH);
            });

            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText(datasets[0].label || 'Data Bar Chart', width / 2, padding / 2 + 5);
        } else {
            const data = datasets[0].data;
            const color = datasets[0].borderColor || '#3b82f6';
            const maxVal = Math.max(...data.map(v => Number(v) || 0)) || 1;

            const padding = 35;
            const chartW = width - padding * 2;
            const chartH = height - padding * 2;

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.lineTo(width - padding, height - padding);
            ctx.stroke();

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            data.forEach((val, idx) => {
                const x = padding + (idx / Math.max(1, data.length - 1)) * chartW;
                const y = height - padding - ((Number(val) / maxVal) * chartH);
                if (idx === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText(datasets[0].label || 'Data Line Chart', width / 2, padding / 2 + 5);
        }
    },

    /**
     * Parses CSV string into array of objects
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                let val = values[index];
                if (val !== undefined && !isNaN(val) && val !== '') {
                    val = Number(val);
                }
                row[header] = val;
            });
            data.push(row);
        }
        return data;
    },

    async loadEnergyData() {
        if (this.energyData.length > 0) return this.energyData;
        try {
            const response = await fetch('../data/energy_data.csv').catch(() => fetch('./data/energy_data.csv'));
            if (!response.ok) throw new Error('HTTP error ' + response.status);
            const text = await response.text();
            this.energyData = this.parseCSV(text);
        } catch (err) {
            this.energyData = this.generateFallbackEnergyData();
        }
        return this.energyData;
    },

    async loadMaintenanceData() {
        if (this.maintenanceData.length > 0) return this.maintenanceData;
        try {
            const response = await fetch('../data/maintenance_data.csv').catch(() => fetch('./data/maintenance_data.csv'));
            if (!response.ok) throw new Error('HTTP error ' + response.status);
            const text = await response.text();
            this.maintenanceData = this.parseCSV(text);
        } catch (err) {
            this.maintenanceData = this.generateFallbackMaintenanceData();
        }
        return this.maintenanceData;
    },

    async loadOccupancyData() {
        if (this.occupancyData.length > 0) return this.occupancyData;
        try {
            const response = await fetch('../data/occupancy_data.csv').catch(() => fetch('./data/occupancy_data.csv'));
            if (!response.ok) throw new Error('HTTP error ' + response.status);
            const text = await response.text();
            this.occupancyData = this.parseCSV(text);
        } catch (err) {
            this.occupancyData = this.generateFallbackOccupancyData();
        }
        return this.occupancyData;
    },

    async loadSecurityData() {
        if (this.securityData.length > 0) return this.securityData;
        try {
            const response = await fetch('../data/security_data.csv').catch(() => fetch('./data/security_data.csv'));
            if (!response.ok) throw new Error('HTTP error ' + response.status);
            const text = await response.text();
            this.securityData = this.parseCSV(text);
        } catch (err) {
            this.securityData = this.generateFallbackSecurityData();
        }
        return this.securityData;
    },

    generateFallbackEnergyData() {
        const buildings = ["B1", "B2", "B3"];
        const floors = [1, 2, 3, 4, 5];
        const data = [];
        let date = new Date(2026, 2, 1, 8, 0);

        for (let i = 0; i < 600; i++) {
            date = new Date(date.getTime() + (4 * 60 * 60 * 1000));
            const hour = date.getHours();
            const b_id = buildings[i % buildings.length];
            const fl = floors[i % floors.length];
            const outdoor_temp = Number((22 + Math.sin(i / 10) * 10 + (Math.random() * 4)).toFixed(1));
            const indoor_temp = Number((21 + Math.random() * 2).toFixed(1));
            const occupancy = (hour >= 8 && hour <= 18) ? Math.floor(60 + Math.random() * 100) : Math.floor(5 + Math.random() * 15);
            
            let hvac = Number((30 + (outdoor_temp - 20) * 5 + occupancy * 0.2 + Math.random() * 10).toFixed(2));
            let lighting = Number(((hour >= 7 && hour <= 19 ? 25 : 6) + Math.random() * 5).toFixed(2));
            let equipment = Number((20 + occupancy * 0.3 + Math.random() * 8).toFixed(2));
            let water = Number((50 + occupancy * 8 + Math.random() * 20).toFixed(1));

            if (i % 27 === 0) hvac = Number((hvac * 2.8).toFixed(2));
            else if (i % 45 === 0) equipment = Number((equipment * 3.2).toFixed(2));
            else if (i % 65 === 0) water = Number((water * 5.0).toFixed(1));

            const total = Number((hvac + lighting + equipment).toFixed(2));
            const peak = (hour >= 12 && hour <= 18) ? 1 : 0;
            const cost = Number((total * (peak ? 0.18 : 0.11)).toFixed(2));

            const pad = n => n < 10 ? '0' + n : n;
            const timestamp = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(hour)}:00`;

            data.push({
                timestamp, building_id: b_id, floor: fl, electricity_kwh: total, water_liters: water,
                hvac_kwh: hvac, lighting_kwh: lighting, equipment_kwh: equipment, occupancy,
                outdoor_temperature: outdoor_temp, indoor_temperature: indoor_temp, energy_cost: cost, peak_hour: peak
            });
        }
        return data;
    },

    generateFallbackMaintenanceData() {
        const eqTypes = ["HVAC Unit", "Chiller", "Air Handling Unit", "Generator", "Elevator", "Water Pump", "Cooling Tower", "Compressor"];
        const prefixes = ["HVAC", "CHILL", "AHU", "GEN", "ELEV", "PUMP", "CTWR", "COMP"];
        const buildings = ["B1", "B2", "B3"];
        const floors = [1, 2, 3, 4, 5];
        const data = [];

        for (let i = 1; i <= 500; i++) {
            const typeIdx = i % eqTypes.length;
            const b_id = buildings[i % buildings.length];
            const fl = floors[i % floors.length];
            const asset_id = `${prefixes[typeIdx]}-${b_id}${fl}${String(i).padStart(3, '0')}`;
            const asset_name = `${eqTypes[typeIdx]} #${String(i).padStart(3, '0')}`;
            
            const op_hours = Math.floor(1500 + Math.random() * 16000);
            const maint_count = Math.floor(2 + Math.random() * 18);
            let failure_count = Math.floor(Math.random() * 3);

            let temp, vibration, pressure, energy;
            const rand = Math.random();
            if (rand < 0.78) {
                temp = Number((35 + Math.random() * 18).toFixed(1));
                vibration = Number((0.6 + Math.random() * 1.8).toFixed(2));
                pressure = Number((42 + Math.random() * 16).toFixed(1));
                energy = Number((15 + Math.random() * 30).toFixed(1));
            } else if (rand < 0.92) {
                temp = Number((56 + Math.random() * 15).toFixed(1));
                vibration = Number((2.9 + Math.random() * 1.8).toFixed(2));
                pressure = Number((30 + Math.random() * 35).toFixed(1));
                energy = Number((48 + Math.random() * 25).toFixed(1));
            } else {
                temp = Number((74 + Math.random() * 20).toFixed(1));
                vibration = Number((5.1 + Math.random() * 4.5).toFixed(2));
                pressure = Number((15 + Math.random() * 75).toFixed(1));
                energy = Number((78 + Math.random() * 40).toFixed(1));
                failure_count += Math.floor(1 + Math.random() * 3);
            }

            const vibPen = Math.min(35, Math.max(0, (vibration - 1.5) * 8.5));
            const tempPen = Math.min(30, Math.max(0, (temp - 45) * 1.1));
            const hoursPen = Math.min(20, (op_hours / 18500) * 18);
            const failPen = failure_count * 5;
            
            const health_score = Number(Math.max(5, Math.min(100, (100 - (vibPen + tempPen + hoursPen + failPen)))).toFixed(1));
            
            let status = "Healthy";
            if (health_score < 50) status = "Critical";
            else if (health_score < 70) status = "Warning";
            else if (health_score < 88) status = "Good";

            data.push({
                asset_id, asset_name, asset_type: eqTypes[typeIdx], building_id: b_id, floor: fl,
                installation_date: `2021-04-15`, operating_hours: op_hours, temperature: temp,
                vibration, pressure, energy_consumption: energy, last_maintenance_date: `2026-04-10`,
                maintenance_count: maint_count, failure_count, current_status: status, health_score,
                next_maintenance_due: status === "Critical" || status === "Warning" ? "2026-09-15" : "2026-11-30"
            });
        }
        return data;
    },

    generateFallbackOccupancyData() {
        const buildings = ["B1", "B2", "B3"];
        const floors = [1, 2, 3, 4, 5];
        const roomConfigs = [
            ["OFF", "Office", 25], ["MEET", "Meeting Room", 15], ["LAB", "Laboratory", 20],
            ["CLASS", "Classroom", 40], ["CONF", "Conference Room", 80], ["CAF", "Cafeteria", 100], ["COM", "Common Area", 50]
        ];
        const data = [];
        let date = new Date(2026, 2, 1, 8, 0);

        for (let i = 0; i < 1000; i++) {
            date = new Date(date.getTime() + (30 * 60 * 1000));
            const hour = date.getHours();
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const b_id = buildings[i % buildings.length];
            const fl = floors[i % floors.length];
            const [prefix, r_type, capacity] = roomConfigs[i % roomConfigs.length];
            const room_id = `${prefix}-${b_id}${fl}${String((i%20)+1).padStart(2,'0')}`;

            let base_pct = isWeekend ? (Math.random() * 0.1) : (hour >= 8 && hour <= 18 ? 0.4 + Math.random() * 0.45 : Math.random() * 0.08);
            if (i % 29 === 0) base_pct = 0.96;
            else if (i % 41 === 0 && (hour >= 9 && hour <= 16) && !isWeekend) base_pct = 0.08;

            const curr_occ = Math.min(Math.floor(capacity * 1.25), Math.floor(capacity * base_pct));
            const occ_pct = Number(((curr_occ / capacity) * 100).toFixed(1));
            const entries = (hour >= 8 && hour <= 18) ? Math.floor(Math.random() * 12) : Math.floor(Math.random() * 2);
            const exits = (hour >= 8 && hour <= 18) ? Math.floor(Math.random() * 12) : Math.floor(Math.random() * 2);

            let status = "Normally Utilized";
            if (occ_pct > 90) status = "Overcrowded";
            else if (occ_pct >= 70) status = "Highly Utilized";
            else if (occ_pct < 25) status = "Underutilized";

            const pad = n => n < 10 ? '0' + n : n;
            const timestamp = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(hour)}:${pad(date.getMinutes())}`;

            data.push({
                timestamp, building_id: b_id, floor: fl, room_id, room_type: r_type, capacity,
                current_occupancy: curr_occ, occupancy_percentage: occ_pct, entry_count: entries, exit_count: exits,
                day_type: isWeekend ? "Weekend" : "Weekday", hour, temperature: Number((21 + Math.random() * 3).toFixed(1)),
                utilization_status: status
            });
        }
        return data;
    },

    generateFallbackSecurityData() {
        const buildings = ["B1", "B2", "B3"];
        const floors = [1, 2, 3, 4, 5];
        const pTypes = ["Employee", "Visitor", "Contractor", "Administrator", "Unknown"];
        const accTypes = ["Main Entrance", "Server Room", "Laboratory", "Restricted Area", "Parking", "Office", "Emergency Exit"];
        const authMethods = ["RFID", "Access Card", "Biometric", "PIN", "Visitor Pass"];
        const data = [];
        let date = new Date(2026, 2, 1, 8, 0);

        for (let i = 1; i <= 1000; i++) {
            date = new Date(date.getTime() + (20 * 60 * 1000));
            const hour = date.getHours();
            const b_id = buildings[i % buildings.length];
            const fl = floors[i % floors.length];
            const acc_type = accTypes[i % accTypes.length];
            const p_type = pTypes[i % pTypes.length];
            const acc_point = `${acc_type} #${b_id}-F${fl}`;
            const location = `Building ${b_id} (Floor ${fl} - ${acc_type})`;

            let p_id = `EMP-${100 + (i%50)}`;
            let vis_id = "N/A";
            if (p_type === "Visitor") { p_id = `VIS-${500 + (i%30)}`; vis_id = p_id; }
            else if (p_type === "Contractor") p_id = `CON-${300 + (i%20)}`;
            else if (p_type === "Administrator") p_id = `ADM-${10 + (i%10)}`;
            else if (p_type === "Unknown") p_id = "UNK-999";

            let acc_status = "Authorized";
            let risk_level = "Low";

            const rand = Math.random();
            if (rand > 0.84 && rand < 0.94) {
                acc_status = "Denied";
                risk_level = (acc_type === "Server Room" || acc_type === "Restricted Area") ? "High" : "Medium";
            } else if (rand >= 0.94 && rand < 0.98) {
                acc_status = "Suspicious";
                risk_level = "High";
            } else if (rand >= 0.98) {
                acc_status = "Denied";
                risk_level = "Critical";
            }

            const pad = n => n < 10 ? '0' + n : n;
            const timestamp = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(hour)}:${pad(date.getMinutes())}`;

            data.push({
                timestamp, event_id: `EVT-${String(i).padStart(5,'0')}`, building_id: b_id, access_point: acc_point,
                person_id: p_id, person_type: p_type, access_type: acc_type, authentication_method: authMethods[i % authMethods.length],
                entry_exit: i % 2 === 0 ? "Entry" : "Exit", access_status: acc_status, visitor_id: vis_id, location, risk_level
            });
        }
        return data;
    }
};
