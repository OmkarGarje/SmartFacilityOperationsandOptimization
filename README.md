# Agentic FacilityOps AI Platform — Building Operations & Facility Intelligence System

An enterprise-grade, browser-native AI Facility Operations & Building Intelligence System implementing **Milestone 1: Energy Intelligence & Monitoring**, **Milestone 2: Predictive Maintenance**, and **Milestone 3: Occupancy & Security Intelligence**.

---

## 📁 Complete Folder Structure

```
facilityops/
│
├── index.html                    # Main Executive Combined Operations Command Center
│
├── pages/
│   ├── energy.html               # Milestone 1: Energy Intelligence & Anomaly Dashboard
│   ├── maintenance.html          # Milestone 2: Predictive Maintenance & Asset Health
│   ├── occupancy.html            # [NEW] Milestone 3: Occupancy Intelligence & Heatmaps
│   ├── security.html             # [NEW] Milestone 3: Security Intelligence & Access Workflows
│   └── alerts.html               # Multi-Agent Unified Operations Alert Command Center
│
├── css/
│   ├── style.css                 # Core CSS variables, typography, sidebar & grid layout
│   ├── dashboard.css             # Milestone 1-3 components: Heatmaps, Workflows, KPI cards
│   └── responsive.css            # Responsive breakpoints (Desktop / Tablet / Mobile)
│
├── js/
│   ├── dataLoader.js             # Async CSV parser & browser fallback generators (M1-M3)
│   ├── dashboard.js              # Executive Overview Controller & Agent Summaries
│   ├── energy.js                 # Energy Agent & statistical anomaly engine (M1)
│   ├── maintenance.js            # Maintenance Agent & telemetry health scoring (M2)
│   ├── occupancy.js              # [NEW] Occupancy Agent, room utilization & heatmap engine (M3)
│   ├── security.js               # [NEW] Security Agent, threat scoring & workflow engine (M3)
│   └── alerts.js                 # Multi-Agent Unified Alert Stream Controller
│
├── data/
│   ├── energy_data.csv           # 750 realistic utility IoT records
│   ├── maintenance_data.csv      # 520 equipment telemetry records
│   ├── occupancy_data.csv        # [NEW] 1,100 room occupancy records
│   └── security_data.csv         # [NEW] 1,150 access control event records
│
└── README.md                     # Technical system documentation & execution guide
```

---

## 🚀 How to Run the Application & Fix Local CSV Fetch Issues

### IMPORTANT NOTE ON BROWSER CORS / LOCAL CSV FETCH:
Modern web browsers block `fetch()` requests to local CSV files (`../data/occupancy_data.csv` and `../data/security_data.csv`) when HTML pages are opened directly using the file protocol (`file:///`).

To ensure Chart.js and all 11 visualizations load the actual CSV datasets correctly without CORS errors:

### Recommended Local HTTP Server Execution:
1. Open terminal/PowerShell in the project directory:
   ```bash
   cd c:\Users\omkar\OneDrive\Desktop\facilityops
   python -m http.server 8000
   ```
2. Open your web browser and navigate to:
   **[http://localhost:8000](http://localhost:8000)**
3. Explore the Milestone 3 dashboards:
   - Occupancy Dashboard: **`http://localhost:8000/pages/occupancy.html`**
   - Security Dashboard: **`http://localhost:8000/pages/security.html`**
   - Unified Alert Command Center: **`http://localhost:8000/pages/alerts.html`**

---

## 👥 1. Occupancy Agent & Space Intelligence (Milestone 3)

The **Occupancy Agent** continuously monitors room occupancy telemetry, space capacity, entry/exit counters, and hourly utilization to prevent overcrowding and optimize floor allocation.

### Occupancy Analytics & Insights Logic:
1. **Utilization Classification**:
   - **Overcrowded**: Occupancy percentage $> 90\%$ of room capacity.
   - **Highly Utilized**: Occupancy percentage $70\% - 90\%$.
   - **Normally Utilized**: Occupancy percentage $25\% - 69\%$.
   - **Underutilized**: Occupancy percentage $< 25\%$ during office hours ($9\text{ AM} - 5\text{ PM}$).
2. **Dynamic Occupancy Heatmap**:
   - Renders a Days (Mon–Sun) $\times$ Hours ($8\text{ AM} - 7\text{ PM}$) visual grid dynamically color-coded from emerald green (normal) to amber (high) and crimson red (overcrowded).
3. **AI Occupancy Recommendations**:
   - Generates prioritized room reallocation suggestions (e.g., staggering lunch schedules or moving meetings from overcrowded rooms).

---

## 🛡️ 2. Security Agent & Access Monitoring Workflows (Milestone 3)

The **Security Agent** analyzes access control events across facility entrances, server rooms, laboratories, and restricted zones.

### Access Monitoring Workflow:
```
  [Access Event]  --->  [Auth Check]  --->  [Clearance Check]  --->  [Risk Analysis]  --->  [Decision & Alert]
 (Badge / Biometric)    (RFID / PIN)      (Role / Time Window)     (Zone / Off-hours)     (Grant / Dispatch Alert)
```

### Risk Detection & Alert Generation Rules:
- **Critical Risk**: Unknown person badge attempt at Server Room / Restricted Area $\rightarrow$ Immediate security team dispatch.
- **High Risk**: Denied access attempt at restricted zones or suspicious off-hours access ($11\text{ PM} - 5\text{ AM}$).
- **Medium Risk**: Failed authorization attempt at main office or parking areas.
- **Low Risk**: Normal authorized employee entry/exit.

---

## 📊 Datasets Dictionary (Milestone 3)

### 1. `data/occupancy_data.csv` (1,100 Records)
Columns: `timestamp`, `building_id`, `floor`, `room_id`, `room_type`, `capacity`, `current_occupancy`, `occupancy_percentage`, `entry_count`, `exit_count`, `day_type`, `hour`, `temperature`, `utilization_status`.

### 2. `data/security_data.csv` (1,150 Records)
Columns: `timestamp`, `event_id`, `building_id`, `access_point`, `person_id`, `person_type`, `access_type`, `authentication_method`, `entry_exit`, `access_status`, `visitor_id`, `location`, `risk_level`.
