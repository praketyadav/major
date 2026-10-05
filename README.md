# Recruitr — Multi-Tenant Campus Placement & AI Assessment Platform

Recruitr is an enterprise-grade, multi-tenant campus recruitment and mock assessment platform built with a modern microservices architecture and a high-performance React SPA. It unifies academic placement cells, corporate talent acquisition teams, and student candidates into a secure, automated hiring pipeline—featuring AI-orchestrated workflows, proctored browser evaluations, and multi-round qualification cascading.

---

## 1. Project Overview

Recruitr addresses the fragmentation, manual overhead, and integrity risks inherent in university campus placement drives. The platform manages the entire recruitment lifecycle:
* **Corporate Job Drives & Round Sequencing**: Flexible multi-round configurations (aptitude, technical, coding, subjective interviews).
* **Automated & Proctored Examination Engine**: Locked-down testing environment with full-screen enforcement, tab-switch telemetry, and automated anti-cheating termination.
* **AI-Assisted Operations**: Natural-language commands allowing Company Admins to dynamically provision hiring drives, sequence rounds, and synthesize comprehensive question banks on the fly.
* **Grading & Advancement Engine**: Instant automated MCQ evaluation, manual subjective scoring interfaces, percentile rank computation, cutoff-based qualification filtering, and automatic progression into subsequent evaluation rounds.

---

## 2. Business Logic & Role-Based Workflows

The platform enforces strict role-based access control (RBAC) across four primary user personas:

### 👑 Super Admin
* **System Administration**: Provisions and oversees global platform users (`SUPER_ADMIN`, `COMPANY_ADMIN`, `COLLEGE_ADMIN`, `STUDENT`).
* **Tenant Governance**: Manages educational institutions (colleges) and corporate hiring organizations (companies).
* **Account State & Security**: Toggles user account active/inactive statuses and executes administrative password reset overrides.
* **Cross-Tenant Telemetry**: Monitors platform-wide analytics, active drive counts, and cohort performance distributions.

### 🏢 Company Admin
* **Drive Lifecycle Management**: Creates placement drives, edits descriptions, publishes opportunities to affiliated campuses, and formally closes completed drives.
* **Round Timeline Configuration**: Sequences assessment rounds with customized durations, cutoff scores, and test parameters.
* **Question Bank & Curriculum**: Authors, edits, and tags domain-specific questions (Multiple-Choice Questions and Subjective prompts).
* **AI Assistant Chat Widget**: Employs conversational prompts (e.g., *"Create a drive called TCS 2026"*, *"Generate 5 MCQ questions on Java Collections"*) to execute complex administrative tasks.
* **Candidate Evaluation & Shortlisting**:
  * Conducts manual subjective answer grading with customized mark allocation.
  * Formulates cutoff thresholds and triggers automatic candidate round advancement.
  * Releases official answer/result keys to student scorecards.
  * Exports ranked candidate shortlists to CSV.

### 🎓 College Admin
* **Drive Participation**: Maps university candidates to published corporate hiring events.
* **Bulk Candidate Onboarding**: Ingests student cohorts via RFC 4180-compliant CSV uploads (`sapId`, `name`, `email`, `branch`), provisioning candidate credentials and enrolling students in targeted preliminary rounds automatically.
* **Roster Monitoring**: Audits candidate participation and institutional eligibility.

### 🧑‍🎓 Student Candidate
* **Assessment Portal**: Accesses assigned placement drives and launches scheduled exam rounds.
* **Locked-Down Examination**:
  * Enforces mandatory full-screen mode and tracks window visibility.
  * Receives uniquely randomized question sequences generated via candidate-seeded Fisher-Yates shuffling.
  * Monitors real-time countdown timers with auto-submission upon expiry or proctoring threshold breach (3 strikes).
* **Candidate Scorecard & Alerts**: Receives asynchronous notifications regarding exam submission, result key releases, and round advancement statuses.

---

## 3. Technical Architecture

Recruitr implements a decentralized microservices pattern orchestrated through an API Gateway, fronted by a React Single Page Application.

```text
                               ┌────────────────────────┐
                               │   React Frontend SPA   │
                               │  (Vite + Ant Design)   │
                               │      Port: 3000        │
                               └───────────┬────────────┘
                                           │ HTTP / REST
                                           ▼
                               ┌────────────────────────┐
                               │  Spring Cloud Gateway  │
                               │  (JWT Filter & CORS)   │
                               │      Port: 8080        │
                               └───────────┬────────────┘
                                           │
         ┌──────────────┬──────────────────┼──────────────────┬──────────────┐
         │              │                  │                  │              │
         ▼              ▼                  ▼                  ▼              ▼
  ┌──────────────┐┌──────────────┐  ┌──────────────┐  ┌──────────────┐┌──────────────┐
  │ recruitr-    ││ recruitr-    │  │ recruitr-    │  │ recruitr-    ││ recruitr-    │
  │ auth-service ││ drive-service│  │ enrollment-  │  │ exam-service ││ results-     │
  │              ││              │  │ service      │  │              ││ service      │
  │  Port: 8081  ││  Port: 8082  │  │  Port: 8083  │  │  Port: 8084  ││  Port: 8085  │
  └──────┬───────┘└──────┬───────┘  └──────┬───────┘  └──────┬───────┘└──────┬───────┘
         │               │                 │                 │               │
         ▼               ▼                 ▼                 ▼               ▼
    MySQL: 3307     MySQL: 3308       MySQL: 3309       MySQL: 3310     MySQL: 3311
  (auth_db)       (drive_db)        (enrollment_db)   (exam_db)       (results_db)
```

### Microservice Directory
1. **`recruitr-gateway` (Port `8080`)**:
   * Single entry point built on Spring Cloud Gateway (Spring WebFlux).
   * Executes high-precedence reactive JWT validation (`JwtAuthenticationFilter`, Order `-1`).
   * Extracts user identity (`userId`) and role (`role`) from HMAC-SHA256 tokens and injects standard downstream HTTP headers (`X-User-Id`, `X-User-Role`).
   * Manages unified Cross-Origin Resource Sharing (CORS) rules for `http://localhost:3000`.
2. **`recruitr-auth-service` (Port `8081`)**:
   * Manages user identity, registration, credential updates, and account deactivation.
   * Uses Spring Security Crypto (`BCryptPasswordEncoder` with strength factor 10) for password hashing.
   * Issues 24-hour signed JWT tokens containing identity and authorization claims.
   * Auto-seeds the default Super Admin credential (`admin@recruitr.com` / `admin@123`) on startup.
3. **`recruitr-drive-service` (Port `8082`)**:
   * Manages recruitment drives, evaluation rounds, and question banks (MCQ and Subjective).
   * Hosts the AI Orchestration Engine (`AiService`), integrating Google Gemini to convert natural language into transactional domain mutations.
4. **`recruitr-enrollment-service` (Port `8083`)**:
   * Maps college campuses to corporate drives (`drive_colleges`).
   * Orchestrates candidate round enrollments (`student_enrollments`).
   * Handles Apache Commons CSV roster ingestion, communicating with Auth Service to provision students on the fly.
   * Exposes eligibility validation endpoints consumed by the exam engine.
5. **`recruitr-exam-service` (Port `8084`)**:
   * Tracks real-time assessment sessions (`exam_sessions`).
   * Implements deterministic question randomization via student-seeded Fisher-Yates algorithm.
   * Telemetry processor: monitors tab-switches and fullscreen-exit events, executing automatic exam submission upon reaching 3 violations.
   * Records immutable audit logs in `attempt_logs`.
6. **`recruitr-results-service` (Port `8085`)**:
   * Executes automated MCQ grading against the drive question key.
   * Provides manual scoring interfaces for subjective answers (`subjective_reviews`).
   * Calculates cohort-relative percentile ranks.
   * Applies cutoff qualification logic and triggers automatic rollover into subsequent drive rounds.
   * Manages in-app student alert feeds (`notifications`).
7. **`recruitr-frontend` (Port `3000`)**:
   * React 18 SPA created with Vite, styled with Ant Design 5 and customized dark-mode design tokens.
   * Features client-side route protection (`PrivateRoute`), centralized Axios interceptors, responsive data tables, full-screen exam canvas, and an interactive AI chat drawer.

---

## 4. Database Topology (Database-Per-Service)

Recruitr enforces strict bounded contexts through the **Database-per-Service** design pattern. Each microservice connects exclusively to its dedicated MySQL 8.0 schema running in isolated containers. Cross-service database joins are strictly prohibited; inter-domain correlation is achieved via logical IDs and REST contracts.

| Service | Schema / Container | Host Port | Core Tables & Domain Entities | Key Constraints & Indexes |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `recruitr_auth_db`<br>`mysql-auth` | `3307` | • `users`<br>• `refresh_tokens` | • `users.sap_id` (UNIQUE)<br>• `users.email` (UNIQUE)<br>• `refresh_tokens.token` (UNIQUE) |
| **Drive** | `recruitr_drive_db`<br>`mysql-drive` | `3308` | • `drives`<br>• `rounds`<br>• `questions`<br>• `round_questions` | • `round_questions` (UNIQUE: `round_id, question_id`)<br>• Logical `company_id` scoping |
| **Enrollment** | `recruitr_enrollment_db`<br>`mysql-enrollment` | `3309` | • `drive_colleges`<br>• `student_enrollments` | • `drive_colleges` (UNIQUE: `drive_id, college_id`)<br>• `student_enrollments` (UNIQUE: `student_id, round_id`) |
| **Exam** | `recruitr_exam_db`<br>`mysql-exam` | `3310` | • `exam_sessions`<br>• `responses`<br>• `attempt_logs` | • `exam_sessions` (UNIQUE: `student_id, round_id`) — Enforces single-attempt exam locking |
| **Results** | `recruitr_results_db`<br>`mysql-results` | `3311` | • `results`<br>• `subjective_reviews`<br>• `notifications` | • `results` (UNIQUE: `student_id, round_id`)<br>• Indexed `user_id` on notifications |

---

## 5. AI Orchestration Layer

The platform integrates a Full-Stack AI assistant inside `recruitr-drive-service` to streamline hiring administration.

### AI Engine Specifications
* **Provider**: Google Generative AI (Gemini REST API).
* **Model**: `gemini-3.5-flash-lite` (low-latency generative parsing).
* **Configuration**: Configured via `spring-dotenv` from `.env` in `recruitr-drive-service`, keeping sensitive API credentials decoupled from version control.

### System Prompt & Schema Translation
`AiService.java` submits the user's plain-text input along with a strict operational system prompt instructing the model to act as a structured command parser. The model is constrained to return strictly raw JSON conforming to the following envelope:

```json
{
  "action": "<ACTION_TYPE>",
  "result": "<human-readable summary of understood intent>",
  "payload": { ... }
}
```

### Supported Actions & Execution Logic
1. `CREATE_DRIVE`:
   * Payload: `{ "title": string, "description": string }`
   * Action: Invokes `DriveService.createDrive(...)`, persisting a new drive in `DRAFT` status.
2. `ADD_ROUND`:
   * Payload: `{ "driveId": number, "title": string, "durationMinutes": number, "cutoffScore": number }`
   * Action: Adds a sequential round to the specified drive.
3. `CREATE_QUESTION`:
   * Payload: Array of questions specifying `questionText`, `questionType` (`MCQ` or `SUBJECTIVE`), `marks`, `tags`, options `A`-`D`, and `correctOption`.
   * Action: Generates synthetic, domain-appropriate assessment questions and appends them to the company's Question Bank.
4. `QUERY_RESULTS`:
   * Payload: `{ "roundId": number }`
   * Action: Retrieves quick summary statistics for the requested round.

---

## 6. Exam Integrity & Core Algorithms

1. **Deterministic Fisher-Yates Question Shuffling**:
   * Questions assigned to a round are randomized per candidate using the in-place Fisher-Yates algorithm.
   * By seeding the pseudorandom generator strictly with the candidate's `studentId` (`new Random(studentId)`), every candidate receives an individual question order, while guaranteeing identical sequencing if a disconnected candidate reconnects.
2. **Anti-Cheating Proctoring Rules (3-Strike Rule)**:
   * Client-side event listeners monitor the Document Visibility API (`visibilitychange`) and Fullscreen API (`fullscreenchange`).
   * Any tab switch or fullscreen exit dispatches telemetry to `POST /api/v1/exam/session/{sessionId}/warning`.
   * When `tabSwitchCount + fullscreenExitCount >= 3`, the session status is immediately updated to `AUTO_SUBMITTED`, the test canvas locks, and recorded responses are committed for grading.
3. **Automated MCQ Evaluation Engine**:
   * Evaluates responses against the official answer key retrieved from `recruitr-drive-service`.
   * Computes candidate MCQ scores: $\sum \text{marks for correct matches}$.
4. **Cohort Percentile Calculation**:
   * Percentile ranks are computed dynamically across all candidates who attempted the round:
     $$\text{Percentile} = \left( \frac{\text{Count of cohort members with } \text{TotalScore} < \text{CandidateScore}}{\text{Total Candidates Attempted}} \right) \times 100.0$$
5. **Cutoff Advancement & Auto-Rollover**:
   * Candidates with $\text{TotalScore} \ge \text{CutoffScore}$ have their status updated to `ADVANCED`.
   * If a subsequent round exists ($\text{RoundNumber} = \text{CurrentRoundNumber} + 1$), qualifying candidates are enrolled into the next round automatically.

---

## 7. Local Setup & Run Instructions

### Prerequisites
* **Java Development Kit (JDK)**: Version 17+
* **Node.js**: Version 18+ & npm
* **Docker & Docker Compose**: For containerized databases
* **Apache Maven**: Version 3.8+ (or use local Maven wrapper)
* **Google Gemini API Key**: For AI orchestration features

### Step 1: Clone Repository & Configure Environment
```bash
git clone https://github.com/praketyadav/major.git recruitr
cd recruitr

# Configure Drive Service Environment Variables
cd recruitr-drive-service
cp .env.example .env
# Edit .env and supply your Google Gemini API Key:
# GEMINI_API_KEY=AIzaSy...
cd ..
```

### Step 2: Start Database Infrastructure
Launch all 5 isolated MySQL databases using Docker Compose:
```bash
docker compose up -d
```
Verify all 5 database containers are healthy:
```bash
docker compose ps
```

### Step 3: Run Microservices
You can boot all microservices using the automated Windows batch script or manually in individual terminals.

#### Option A: Automated Boot (Windows)
```cmd
start-all.bat
```

#### Option B: Manual Startup
Open separate terminal tabs for each service and execute:

```bash
# 1. Start Auth Service (Port 8081)
cd recruitr-auth-service
mvn spring-boot:run

# 2. Start Drive Service (Port 8082)
cd recruitr-drive-service
mvn spring-boot:run

# 3. Start Enrollment Service (Port 8083)
cd recruitr-enrollment-service
mvn spring-boot:run

# 4. Start Exam Service (Port 8084)
cd recruitr-exam-service
mvn spring-boot:run

# 5. Start Results Service (Port 8085)
cd recruitr-results-service
mvn spring-boot:run

# 6. Start Spring Cloud API Gateway (Port 8080)
cd recruitr-gateway
mvn spring-boot:run
```

### Step 4: Start Frontend SPA
```bash
cd recruitr-frontend
npm install
npm run dev
```
Access the application at `http://localhost:3000`.

### Step 5: Default Credentials
The platform automatically seeds an administrative root account on first boot of `recruitr-auth-service`:
* **URL**: `http://localhost:3000/login`
* **Email**: `admin@recruitr.com`
* **Password**: `admin@123`
* **Role**: `SUPER_ADMIN`
