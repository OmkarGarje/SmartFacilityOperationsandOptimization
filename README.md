# Agentic FacilityOps AI Platform — Building Operations & Facility Intelligence System

An enterprise-grade, browser-native AI Facility Operations & Building Intelligence System implementing **Milestone 1: Energy Intelligence & Monitoring** and **Milestone 2: Predictive Maintenance**.

---

## 📁 Complete Folder Structure

```
facilityops/
│
├── index.html                    # Main Combined Operations Executive Dashboard
│
├── pages/
│   ├── energy.html               # Milestone 1: Energy Intelligence & Anomaly Dashboard
│   ├── maintenance.html          # Milestone 2: Predictive Maintenance & Asset Health
│   └── alerts.html               # Operations Alerts Command Center
│
├── css/
│   ├── style.css                 # Core CSS variables, typography, sidebar & layout
│   ├── dashboard.css             # Component styles: KPI cards, Agent panels, tables
│   └── responsive.css            # Responsive layout breakpoints (Desktop/Tablet/Mobile)
│
├── js/
│   ├── dataLoader.js             # CSV parser with dynamic browser fallback generator
│   ├── dashboard.js              # Executive Overview Controller
│   ├── energy.js                 # Energy Agent, anomaly detection & recommendation rules
│   ├── maintenance.js            # Maintenance Agent, health score algorithm & risk engine
│   └── alerts.js                 # Centralized alert stream filter controller
│
├── data/
│   ├── energy_data.csv           # 750 realistic utility & energy IoT records
│   └── maintenance_data.csv      # 520 equipment telemetry sensor records
│
└── README.md                     # System documentation & execution guide
```

---

## 🚀 How to Run the Application

### Option A: Local Python Web Server (Recommended)
1. Open your terminal or Command Prompt in the `facilityops` directory:
   ```bash
   cd c:\Users\omkar\OneDrive\Desktop\facilityops
   python -m http.server 8000
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

### Option B: Direct File Execution (Fallback Mode)
- Double-click `index.html` to open directly in any browser.
- The built-in dynamic fallback generator in `dataLoader.js` automatically activates if browser `file://` security policy restricts local `fetch()` calls, guaranteeing 100% functionality out-of-the-box.

---

## 🤖 How the AI Agents Work

### ⚡ 1. Energy Agent Architecture & Anomaly Detection
The **Energy Agent** is a transparent, statistical rule-based agent that monitors utility telemetry to detect abnormal energy spikes, off-hours wastage, and HVAC inefficiencies.

#### Anomaly Detection Logic
1. **Statistical Baseline Calculation**:
   - Calculates sample Mean ($\mu$) and Standard Deviation ($\sigma$) for total electricity consumption ($\text{kWh}$).
   - Evaluates each record's $Z\text{-score}$:
     $$Z = \frac{x - \mu}{\sigma}$$
   - Any record with $Z > 2.2$ is classified as a **Statistical Energy Anomaly**.

2. **Rule-Based Threshold Analysis**:
   - **Nighttime Off-Hours Surge**: IF time is between 11:00 PM and 5:00 AM AND occupancy $< 15$ AND consumption exceeds baseline by $> 20\%$, flag as **HIGH Severity Night Surge**.
   - **HVAC Thermal Misalignment**: IF outdoor temperature is mild ($20^\circ\text{C} - 25^\circ\text{C}$) AND HVAC consumption exceeds $60\%$ of total baseline load, flag as **Abnormal HVAC Surge**.

3. **AI Energy Recommendations Engine**:
   - Evaluates system-wide energy usage patterns and outputs actionable recommendations with title, reason, daily kWh reduction, and estimated monetary savings (\$). Each item carries a priority label (`HIGH`, `MEDIUM`, `LOW`).

---

### 🔧 2. Maintenance Agent & Equipment Health Score
The **Maintenance Agent** continuously analyzes multi-sensor equipment telemetry (vibration, temperature, operating hours, pressure, and failure history) to score asset health and predict failure risks.

#### Equipment Health Score Formula ($0 \dots 100$)
Equipment health is derived using a weighted multi-factor penalty deduction model:

$$\text{Health Score} = \max\Big(5, \min\big(100, 100 - (\text{Vibration Penalty} + \text{Temperature Penalty} + \text{Operating Hours Penalty} + \text{Failure Penalty})\big)\Big)$$

Where:
- $\text{Vibration Penalty} = \min(35, \max(0, (\text{Vibration} - 1.8) \times 8.0))$
- $\text{Temperature Penalty} = \min(30, \max(0, (\text{Temp} - 50.0) \times 1.1))$
- $\text{Operating Hours Penalty} = \min(20, (\text{Hours} / 18000) \times 18.0)$
- $\text{Failure Penalty} = \text{Failure Count} \times 6.0$

#### Health Score Classification
- **$90 - 100$**: `Excellent` (Healthy Green)
- **$75 - 89$**: `Good` (Blue)
- **$50 - 74$**: `Warning` (Amber)
- **$0 - 49$**: `Critical` (Critical Red)

#### Predictive Maintenance Failure Risk Engine
Evaluates telemetry risk vectors:
- **IF** Vibration $> 3.5\text{ mm/s}$ + Temperature $> 65^\circ\text{C}$ + Operating Hours $> 12,000\text{ hrs}$ + Failure Count $\ge 2$:
  - **Risk Level**: `High Risk`
  - **Status Flag**: `⚠️ Maintenance Recommended`
  - **Automated Action**: Generated for the Predictive Maintenance Alert stream.

---

## 📊 Datasets Schema

### 1. `data/energy_data.csv` (750 Records)
| Column | Type | Description |
|---|---|---|
| `timestamp` | String | YYYY-MM-DD HH:MM format |
| `building_id` | String | Building identifier (B1, B2, B3) |
| `floor` | Integer | Floor number (1 - 5) |
| `electricity_kwh` | Float | Total electricity consumption in kWh |
| `water_liters` | Float | Water usage in liters |
| `hvac_kwh` | Float | HVAC electrical load in kWh |
| `lighting_kwh` | Float | Lighting electrical load in kWh |
| `equipment_kwh` | Float | Facility equipment load in kWh |
| `occupancy` | Integer | Recorded floor occupancy (people) |
| `outdoor_temperature` | Float | Ambient outdoor temp (°C) |
| `indoor_temperature` | Float | Indoor climate temp (°C) |
| `energy_cost` | Float | Calculated cost ($) |
| `peak_hour` | Integer | 1 if peak tariff hour, else 0 |

### 2. `data/maintenance_data.csv` (520 Records)
| Column | Type | Description |
|---|---|---|
| `asset_id` | String | Unique Equipment ID (e.g., `HVAC-B11001`) |
| `asset_name` | String | Human readable equipment name |
| `asset_type` | String | Category (HVAC, Chiller, Generator, etc.) |
| `building_id` | String | Building ID (B1, B2, B3) |
| `floor` | Integer | Floor level (1 - 5) |
| `installation_date` | String | Date of commissioning |
| `operating_hours` | Integer | Cumulative runtime hours |
| `temperature` | Float | Motor/housing temperature (°C) |
| `vibration` | Float | Vibration level (mm/s RMS) |
| `pressure` | Float | Operating pressure (PSI) |
| `energy_consumption` | Float | Equipment power draw (kW) |
| `last_maintenance_date`| String | Last serviced date |
| `maintenance_count` | Integer | Historical service instances |
| `failure_count` | Integer | Historical component failure instances |
| `current_status` | String | Telemetry health status |
| `health_score` | Float | Derived health score (0-100) |
| `next_maintenance_due` | String | Target service due date |

---

## 🎨 Design Features
- **Enterprise Dark Slate UI**: Engineered with custom CSS variables, glassmorphic cards, glowing status indicators, and clean typography (`Inter` & `Outfit`).
- **Interactive Visualizations**: 5 distinct dynamic Chart.js charts updating upon user building/floor filter changes.
- **Data Table Engine**: Search by ID/Name, type filter, status filter, and health score sorting.
- **Zero External Framework Overhead**: Built with pure HTML5, CSS3, Vanilla JavaScript (ES6+),PapaParse-style CSV parser, and Chart.js via CDN.
