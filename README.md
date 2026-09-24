# Agentic FacilityOps AI Platform — Building Operations & Facility Intelligence System

An enterprise-grade, browser-native AI Facility Operations & Building Intelligence System implementing **Milestone 1: Energy Intelligence & Monitoring**, **Milestone 2: Predictive Maintenance**, **Milestone 3: Occupancy & Security Intelligence**, and **Milestone 4: AI-Driven Facility Optimization & Decision Support**.

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
│   ├── occupancy.html            # Milestone 3: Occupancy Intelligence & Heatmaps
│   ├── security.html             # Milestone 3: Security Intelligence & Access Workflows
│   ├── optimization.html         # [NEW] Milestone 4: AI Facility Optimization & Decision Support
│   └── alerts.html               # Multi-Agent Unified Operations Alert Command Center
│
├── css/
│   ├── style.css                 # Core CSS variables, typography, sidebar & grid layout
│   ├── dashboard.css             # Milestone 1-4 components: Heatmaps, Workflows, KPI cards, Timelines
│   └── responsive.css            # Responsive breakpoints (Desktop / Tablet / Mobile)
│
├── js/
│   ├── dataLoader.js             # Async CSV parser & browser fallback generators (M1-M4)
│   ├── dashboard.js              # Executive Overview Controller & Agent Summaries
│   ├── energy.js                 # Energy Agent & statistical anomaly engine (M1)
│   ├── maintenance.js            # Maintenance Agent & telemetry health scoring (M2)
│   ├── occupancy.js              # Occupancy Agent, room utilization & heatmap engine (M3)
│   ├── security.js               # Security Agent, threat scoring & workflow engine (M3)
│   ├── optimization.js           # [NEW] Optimization Agent, Cross-Milestone AI decision engine (M4)
│   └── alerts.js                 # Multi-Agent Unified Alert Stream Controller
│
├── data/
│   ├── energy_data.csv           # 750 utility IoT telemetry records
│   ├── maintenance_data.csv      # 520 equipment telemetry records
│   ├── occupancy_data.csv        # 1,100 room occupancy records
│   ├── security_data.csv         # 1,150 access control event records
│   └── facility_optimization.csv # [NEW] 800 cross-domain optimization telemetry records
│
└── README.md                     # Technical system documentation & execution guide
```

---

## 🚀 How to Run the Application

### Recommended Local HTTP Server Execution:
1. Open terminal/PowerShell in the project directory:
   ```bash
   cd c:\Users\omkar\OneDrive\Desktop\facilityops
   python -m http.server 8000
   ```
2. Open your web browser and navigate to:
   **[http://localhost:8000](http://localhost:8000)**
3. Explore the dashboards:
   - Executive Overview: **`http://localhost:8000/index.html`**
   - Milestone 1 Energy: **`http://localhost:8000/pages/energy.html`**
   - Milestone 2 Maintenance: **`http://localhost:8000/pages/maintenance.html`**
   - Milestone 3 Occupancy: **`http://localhost:8000/pages/occupancy.html`**
   - Milestone 3 Security: **`http://localhost:8000/pages/security.html`**
   - Milestone 4 AI Optimization: **`http://localhost:8000/pages/optimization.html`**
   - Unified Alert Command Center: **`http://localhost:8000/pages/alerts.html`**

---

## 🤖 Milestone 4 — AI Facility Optimization & Decision Support

The **Optimization Agent** operates as an intelligent decision-support layer synthesizing telemetry from Energy, Maintenance, Occupancy, and Security Agents to answer key facility questions:
* *What problems are happening right now?*
* *Which problem needs attention first?*
* *Where can energy or operational efficiency be improved?*
* *Which equipment or area requires attention?*
* *Are occupancy and security conditions affecting facility operations?*
* *What action should the facility manager take?*

### 1. Cross-Milestone Architecture Pipeline
```text
  [Energy Data] ---> [Maintenance Data] ---> [Occupancy Data] ---> [Security Data]
                                                                        │
                                                                        ▼
   [Facility Manager Action] <--- [AI Recommendations] <--- [Optimization Agent]
```

### 2. Facility Health Score Formula (0–100)
- **Energy Health**: $100 - (\text{Anomaly Penalty})$
- **Maintenance Health**: Average Asset Health Score across equipment telemetry.
- **Occupancy Health**: $100 - (\text{Overcrowding Penalty})$.
- **Security Health**: $100 - (\text{Critical/High Breach Penalty})$.
- **Overall Score**: $\text{Weighted Average} = (0.3 \cdot \text{Energy}) + (0.3 \cdot \text{Maintenance}) + (0.2 \cdot \text{Occupancy}) + (0.2 \cdot \text{Security})$.

### 3. Priority Matrix (Risk vs Impact)
- **Risk vs Operational Impact Scatter Chart** (`riskImpactChart`) mapping issues into 4 quadrants to highlight critical action items.

### 4. AI Recommendation Center & Combined Rules
- Evaluates individual rules (High Energy Setbacks, Critical Maintenance, Overcrowding Reallocation, Security Lockdowns) and **Combined Cross-Domain Rules** (e.g., High Occupancy + High Energy in Zone B1-F2 $\rightarrow$ Priority Alert).

---

## 📊 Datasets Dictionary

1. **`data/energy_data.csv`** (750 Records): Electricity kWh, water liters, HVAC, lighting, equipment, temperatures, energy cost.
2. **`data/maintenance_data.csv`** (520 Records): Operating hours, temperature, vibration, pressure, health score, failure risk.
3. **`data/occupancy_data.csv`** (1,100 Records): Room capacity, current occupancy, percentage, entries, exits, hour, utilization status.
4. **`data/security_data.csv`** (1,150 Records): Access points, person type, authentication method, access status, location, risk level.
5. **`data/facility_optimization.csv`** (800 Records): Zone ID, building, floor, area, energy anomaly score, asset health score, occupancy percentage, security risk level, combined priority score, primary category, recommended action, annual savings.
