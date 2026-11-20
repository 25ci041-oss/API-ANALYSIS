# REAL TIME API ANALYSIS – API KEY SECURITY MONITORING AND INCIDENT RESPONSE SYSTEM
### TEAM: TENSOR TERMINATORS | DOMAIN: CYBER SECURITY | EVENT: CRIMEATHON 2026

A comprehensive, fully functional, end-to-end cybersecurity web application for continuous API key lifecycle monitoring, anomaly detection, breach simulation, CERT-In 6-hour regulatory compliance tracking, manual revocation, and automated plain-English PDF incident reporting.

---

## 1. Problem Statement & Solution

**The Regulatory Challenge:**
CERT-In (Indian Computer Emergency Response Team) mandates that prescribed cybersecurity incidents must be reported **within 6 hours** of noticing or being brought to notice of them. However, API key leaks and unauthorized programmatic access frequently persist undetected for days. Once compromised, organizations often struggle to determine:
- Which API key was misused?
- Who owns the key and is it internal or third-party?
- Is it controlled by human operators or automated software?
- Which IP addresses were involved, and were they approved?
- What permissions were used and how much data was accessed?
- Which systems were impacted and what containment actions were taken?
- How much time remains on the strict 6-hour CERT-In clock?

**The Solution:**
This platform solves these problems through an integrated architecture:
1. **Live Database-Driven Inventory:** Dynamic counting of registered, active, inactive, revoked, internal, third-party, human, and software-controlled keys.
2. **Behavioral Rule Detection Engine:** Real-time analysis of every API request for shadow keys, unapproved source IP access, shared key misuse, over-privileged permissions, and bulk data exfiltration.
3. **Attack Simulation Lab:** Interactive simulation of 8 isolated threat scenarios plus a single-click 7-stage breach attack chain based on the Harbor & Finch Freight case study.
4. **Automatic Breach Attribution:** Correlates multiple suspicious events, identifies all involved keys with evidence, and initiates official notice logging.
5. **Persistent 6-Hour CERT-In Countdown:** Database-backed countdown calculation that survives browser reloads, page refreshes, and app restarts.
6. **Manual Containment Controls:** Strict administrative revocation dialogs with automatic event logging to the incident timeline.
7. **Plain-English PDF Generation:** One-click downloadable incident reports using ReportLab, structured for executive and regulatory compliance.

---

## 2. Technology Stack

- **Frontend:** React.js, Vite, Lucide Icons, Custom Cybersecurity Dark Navy Theme (`#070d1e`, blue `#00b4d8`, safe green, warning yellow, critical red).
- **Backend:** Python FastAPI, Pydantic, Python Standard Library (WAL SQLite / PostgreSQL compatible architecture).
- **Detection Engine:** Python Rule-Based Security Engine with IP boundary comparison, least-privilege role matrix, and volume thresholds.
- **Reporting Engine:** ReportLab Python Library for downloadable PDF reports.
- **Case Study Dataset:** Harbor & Finch Freight (LedgerOne, HelpDeskr, BlueVault, SSO, TallyBridge Connect, with E13 & E16 evidence notes).

---

## 3. Project Directory Structure

```text
tensor_terminator/
├── backend/
│   ├── main.py              # FastAPI application, CORS, API routes & static mounting
│   ├── database.py          # SQLite database schema, WAL mode, queries & connection pool
│   ├── models.py            # Pydantic validation models
│   ├── rules_engine.py      # Core detection engine (IP boundaries, permissions, bulk data)
│   ├── simulation.py        # 8 Attack scenarios, complete breach simulation & reset
│   ├── pdf_generator.py     # ReportLab professional PDF report generation
│   ├── seed_data.py         # Baseline seeder (10 fictional API keys)
│   ├── test_suite.py        # 15 End-to-end automated verification tests
│   └── requirements.txt     # Backend dependency specification
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx           # 9-page left navigation with live badge counts
│   │   │   ├── Header.jsx            # Status banner, admin identity & quick actions
│   │   │   ├── CertInTimer.jsx       # 6-Hour statutory countdown banner
│   │   │   ├── AddKeyModal.jsx       # Form to register new API keys
│   │   │   ├── KeyDetailModal.jsx    # Complete key profile, activity & change history
│   │   │   ├── RevokeModal.jsx       # Confirmation dialog for manual revocation
│   │   │   └── NotificationToast.jsx # Instant notification alert toasts
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx              # Live count cards & operational stats
│   │   │   ├── ApiKeyInventory.jsx        # Complete key inventory with filters
│   │   │   ├── CriticalKeys.jsx           # Shared & over-privileged key reviews
│   │   │   ├── LiveMonitoring.jsx         # Live updating activity stream
│   │   │   ├── AttackSimulation.jsx       # 8 Scenarios + Complete Breach button
│   │   │   ├── SecurityAlerts.jsx         # Correlated security threat alerts
│   │   │   ├── IncidentInvestigation.jsx  # Breach attribution & checklist
│   │   │   ├── Reports.jsx                # Interactive report preview & PDF download
│   │   │   └── Settings.jsx               # System thresholds & admin audit log
│   │   ├── api.js           # Centralized API fetch client
│   │   ├── App.jsx          # Application root state & router
│   │   └── index.css        # Professional dark navy design system
│   ├── package.json
│   └── vite.config.js       # Vite build config & proxy to backend
├── README.md
```

---

## 4. Setup & Running Instructions

### Prerequisites
- Python 3.10+ (FastAPI, uvicorn, reportlab, pydantic already installed)
- Node.js 18+ & npm

### Option A: Unified Single-Port Run (Recommended)
The React frontend is pre-built into `frontend/dist/`. FastAPI serves both the complete REST API and the React web application from a single port!

```powershell
# 1. Navigate to the backend directory
cd c:\Users\HP\tensor_terminator\backend

# 2. Seed the initial 10 baseline keys (if needed)
python seed_data.py

# 3. Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000
```
Open your browser at: **`http://localhost:8000`**

---

### Option B: Development Mode (Dual Process)

**Terminal 1 — Backend:**
```powershell
cd c:\Users\HP\tensor_terminator\backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend (with Vite Hot-Reload):**
```powershell
cd c:\Users\HP\tensor_terminator\frontend
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

## 5. Automated Verification Test Suite (15 / 15 Passed)

Run the automated verification suite anytime to test all requirements from Section 24 of the specification:

```powershell
python backend/test_suite.py
```

### Verified Test Matrix:
| Test ID | Requirement | Test Result |
|---|---|---|
| **TEST 1** | Start with 10 fictional keys & verify live dashboard count | **PASSED (10 Keys)** |
| **TEST 2** | Add 2 API keys & confirm total count dynamically becomes 12 | **PASSED (12 Keys)** |
| **TEST 3** | Unregistered API key activity detected & NOT added to approved keys | **PASSED (Shadow Key Flagged)** |
| **TEST 4** | Shared key monitoring across multiple unexpected external IPs | **PASSED (Shared Misuse Flagged)** |
| **TEST 5** | Critical Keys page displays shared keys with complete IP breakdown | **PASSED (Critical IPs Listed)** |
| **TEST 6** | Over-privileged key activity flags excessive permissions | **PASSED (Extra Perms Flagged)** |
| **TEST 7** | Bulk data access (10,000 records) exceeds baseline & triggers alert | **PASSED (Bulk Anomaly Flagged)** |
| **TEST 8** | Run Complete Breach Simulation (7-stage attack chain) | **PASSED (7 Stages Correlated)** |
| **TEST 9** | Confirmed incident record created with all involved keys visible | **PASSED (INC-2026-BREACH-01)** |
| **TEST 10** | Manually revoke compromised key KEY-103 with confirmation dialog | **PASSED (Status = REVOKED)** |
| **TEST 11** | Request with revoked key triggers CRITICAL violation alert | **PASSED (Critical Violation)** |
| **TEST 12** | Applicable reportable incident starts the 6-Hour CERT-In Countdown | **PASSED (Countdown Active)** |
| **TEST 13** | Page refreshes/restarts do NOT reset countdown (Database-backed) | **PASSED (State Persisted)** |
| **TEST 14** | Generate & download readable plain-English PDF incident report | **PASSED (ReportLab PDF Valid)** |
| **TEST 15** | Global data consistency confirmed across Dashboard, Inventory, Alerts & PDF | **PASSED (100% Consistent)** |

---

## 6. Demonstration Walkthrough (Hackathon Presentation Guide)

Follow this 5-minute presentation script for judging:

1. **Dashboard & Key Counts (1 min):**
   - Open `http://localhost:8000`.
   - Point to the live count cards: **Total Registered Keys = 10**, Internal = 7, Third-Party = 3, Human = 4, Software = 6.
   - Explain that all counts are computed from actual SQLite/PostgreSQL database records, not hardcoded.
   - Click **Add New API Key** to register a new key (e.g. `KEY-111`). Watch the dashboard immediately update to **11**.

2. **Attack Simulation Lab (1.5 min):**
   - Click **Attack Simulation** in the sidebar.
   - Show the 8 individual simulation scenario buttons. Run **Simulation 2 – Shadow API Key**.
   - Show how the unknown key is detected as CRITICAL on the SSO gateway, without being added to the approved inventory.
   - Click the large red button: **RUN COMPLETE BREACH SIMULATION**.
   - Watch the 7 sequential attack stages simulate with live explanations.

3. **6-Hour CERT-In Countdown & Incident Investigation (1.5 min):**
   - Point to the top banner: **6-HOUR CERT-In REPORTING COUNTDOWN** is now ticking down from 6 hours based on the recorded notice time.
   - Refresh the page to prove to the judges that the countdown is stored in the database and **never resets**.
   - Click **Incident Investigation** to show the section: **API KEYS INVOLVED IN THIS BREACH**.
   - Show all compromised keys:
     - `KEY-103`: Third-party key used from foreign IP `185.220.101.5` to exfiltrate 14,800 financial records and alter vendor bank routing.
     - `KEY-106`: Internal shared key accessed from unexpected offshore IP (corroborating Evidence E13 chat logs).
     - `KEY-SHADOW-X`: Unregistered key probing SSO endpoints.
   - Complete 2 items on the **Incident Response Checklist** and observe the progress bar update.

4. **Manual Revocation & Defense Containment (30 sec):**
   - In the incident key table, click **Revoke** next to `KEY-103`.
   - In the confirmation dialog, review the key ID and submit.
   - Confirm status changes to **REVOKED** in red, and a new revocation entry appears on the chronological timeline.
   - Run **Simulation 7 – Revoked Key Usage** to demonstrate that subsequent requests using this key are immediately blocked with a critical violation alert.

5. **PDF Report Download (30 sec):**
   - Click **Reports** in the sidebar.
   - View the clean, plain-English preview.
   - Click **GENERATE INCIDENT REPORT (PDF)**.
   - Open the downloaded PDF and show the complete executive summary, involved keys table, root cause findings, CERT-In compliance deadline, and chronological evidence timeline.

---

## 7. Security & Academic Integrity Notes

- All simulation scenarios utilize fictional demonstration data (Harbor & Finch Freight case study).
- Real secrets are never stored or displayed in the UI; fictional identifiers (`KEY-101`, `KEY-102`) are used throughout.
- The prototype operates within an isolated sandbox and does not interact with external networks or real production credentials.
- The CERT-In countdown is an automated compliance tracking aid and does not automatically file statutory reports.

---
**Developed by Tensor Terminators for Crimeathon 2026**
