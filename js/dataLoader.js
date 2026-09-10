/**
 * Agentic FacilityOps AI Platform - Data Loader Module
 * Handles loading CSV datasets from data/ folder or generates fallback datasets
 * if file:// browser protocol blocks XMLHttpRequest/Fetch CORS.
 */

const DataLoader = {
    energyData: [],
    maintenanceData: [],
    isLoaded: false,

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
                // Convert numeric strings
                if (val !== undefined && !isNaN(val) && val !== '') {
                    val = Number(val);
                }
                row[header] = val;
            });
            data.push(row);
        }
        return data;
    },

    /**
     * Loads Energy Dataset
     */
    async loadEnergyData() {
        if (this.energyData.length > 0) return this.energyData;
        try {
            const response = await fetch('../data/energy_data.csv').catch(() => fetch('./data/energy_data.csv'));
            if (!response.ok) throw new Error('HTTP error ' + response.status);
            const text = await response.text();
            this.energyData = this.parseCSV(text);
            console.log(`Loaded ${this.energyData.length} energy records from CSV.`);
        } catch (err) {
            console.warn('CSV fetch failed (likely local file:// mode). Generating fallback energy dataset...', err);
            this.energyData = this.generateFallbackEnergyData();
        }
        return this.energyData;
    },

    /**
     * Loads Maintenance Dataset
     */
    async loadMaintenanceData() {
        if (this.maintenanceData.length > 0) return this.maintenanceData;
        try {
            const response = await fetch('../data/maintenance_data.csv').catch(() => fetch('./data/maintenance_data.csv'));
            if (!response.ok) throw new Error('HTTP error ' + response.status);
            const text = await response.text();
            this.maintenanceData = this.parseCSV(text);
            console.log(`Loaded ${this.maintenanceData.length} maintenance records from CSV.`);
        } catch (err) {
            console.warn('CSV fetch failed (likely local file:// mode). Generating fallback maintenance dataset...', err);
            this.maintenanceData = this.generateFallbackMaintenanceData();
        }
        return this.maintenanceData;
    },

    /**
     * Dynamic fallback generator for Energy data if fetch is restricted
     */
    generateFallbackEnergyData() {
        const buildings = ["B1", "B2", "B3"];
        const floors = [1, 2, 3, 4, 5];
        const data = [];
        let date = new Date(2026, 2, 1, 8, 0);

        for (let i = 0; i < 600; i++) {
            date = new Date(date.getTime() + (4 * 60 * 60 * 1000)); // add 4 hrs
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

            // Inject anomalies
            if (i % 27 === 0) {
                hvac = Number((hvac * 2.8).toFixed(2)); // HVAC spike
            } else if (i % 45 === 0) {
                equipment = Number((equipment * 3.2).toFixed(2)); // Night equipment surge
            } else if (i % 65 === 0) {
                water = Number((water * 5.0).toFixed(1)); // Water leak
            }

            const total = Number((hvac + lighting + equipment).toFixed(2));
            const peak = (hour >= 12 && hour <= 18) ? 1 : 0;
            const cost = Number((total * (peak ? 0.18 : 0.11)).toFixed(2));

            const pad = n => n < 10 ? '0' + n : n;
            const timestamp = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(hour)}:00`;

            data.push({
                timestamp,
                building_id: b_id,
                floor: fl,
                electricity_kwh: total,
                water_liters: water,
                hvac_kwh: hvac,
                lighting_kwh: lighting,
                equipment_kwh: equipment,
                occupancy,
                outdoor_temperature: outdoor_temp,
                indoor_temperature: indoor_temp,
                energy_cost: cost,
                peak_hour: peak
            });
        }
        return data;
    },

    /**
     * Dynamic fallback generator for Maintenance data if fetch is restricted
     */
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
                // Healthy
                temp = Number((35 + Math.random() * 18).toFixed(1));
                vibration = Number((0.6 + Math.random() * 1.8).toFixed(2));
                pressure = Number((42 + Math.random() * 16).toFixed(1));
                energy = Number((15 + Math.random() * 30).toFixed(1));
            } else if (rand < 0.92) {
                // Warning
                temp = Number((56 + Math.random() * 15).toFixed(1));
                vibration = Number((2.9 + Math.random() * 1.8).toFixed(2));
                pressure = Number((30 + Math.random() * 35).toFixed(1));
                energy = Number((48 + Math.random() * 25).toFixed(1));
            } else {
                // Critical
                temp = Number((74 + Math.random() * 20).toFixed(1));
                vibration = Number((5.1 + Math.random() * 4.5).toFixed(2));
                pressure = Number((15 + Math.random() * 75).toFixed(1));
                energy = Number((78 + Math.random() * 40).toFixed(1));
                failure_count += Math.floor(1 + Math.random() * 3);
            }

            // Health calculation
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
                asset_id,
                asset_name,
                asset_type: eqTypes[typeIdx],
                building_id: b_id,
                floor: fl,
                installation_date: `2021-04-15`,
                operating_hours: op_hours,
                temperature: temp,
                vibration: vibration,
                pressure: pressure,
                energy_consumption: energy,
                last_maintenance_date: `2026-04-10`,
                maintenance_count: maint_count,
                failure_count: failure_count,
                current_status: status,
                health_score: health_score,
                next_maintenance_due: status === "Critical" || status === "Warning" ? "2026-09-15" : "2026-11-30"
            });
        }
        return data;
    }
};
