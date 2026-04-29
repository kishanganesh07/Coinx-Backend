# Transaction Reconciliation Engine

A robust Node.js reconciliation engine designed to match crypto transaction datasets from two different sources (User and Exchange). It handles data inconsistencies, performs fuzzy matching based on configurable tolerances, and generates detailed reconciliation reports.

## Features
- **Data Ingestion**: Parses messy CSV files and stores them in MongoDB with validation flags.
- **Fuzzy Matching**: Matches transactions using configurable time (±5 min) and quantity (±0.01%) tolerances.
- **Conflict Detection**: Identifies transactions that are close matches but differ in quantity or timestamp.
- **CSV Reporting**: Generates downloadable reconciliation reports in standard CSV format.
- **Clean Architecture**: Organized into Controllers, Services, Models, and Utils for scalability and readability.

---

## 🛠 Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (A running local instance or MongoDB Atlas URI)

### 1. Installation
```bash
npm install
```

### 2. Configuration
Create a `.env` file in the root directory (or update the existing one):
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
TIMESTAMP_TOLERANCE_SECONDS=300
QUANTITY_TOLERANCE_PCT=0.01
```

### 3. Run the Server
```bash
# Start the production server
npm start

# Start in development mode (with nodemon)
npm run dev
```

---

##  API Documentation

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/reconcile` | Triggers a new reconciliation run using `data/` files. Returns a `runId`. |
| `GET` | `/report/:runId` | Downloads the full reconciliation report as a **CSV file**. |
| `GET` | `/report/:runId/summary` | Returns JSON counts: matched, conflicting, unmatched. |
| `GET` | `/report/:runId/unmatched` | Returns JSON list of all unmatched rows with specific reasons. |

---

##  Key Design Decisions & Assumptions

During development, several technical decisions were made to handle unclear or messy requirements:

### 1. Handling "Messy" Data (Ingestion)
- **Decision**: Instead of dropping rows with malformed timestamps or missing quantities, I decided to ingest them with an `isValid: false` flag. 
- **Rationale**: This allows these rows to appear in the final report as `UNMATCHED` with a clear reason (e.g., "Malformed timestamp"), ensuring 100% data transparency for the user.

### 2. Asset Aliasing
- **Decision**: Implemented a normalization helper that maps common aliases (e.g., `Bitcoin` -> `BTC`, `Ethereum` -> `ETH`).
- **Rationale**: Real-world exchange exports often use full names while user exports use symbols. Matching strictly on strings would lead to high unmatched rates.

### 3. "Conflicting" vs "Unmatched"
- **Decision**: Defined a "Conflict" as a pair of transactions that match on **Asset** and **Type** and are within the **Time Tolerance**, but whose **Quantity** exceeds the percentage tolerance. 
- **Rationale**: This distinguishes between "I can't find this" and "I found it, but the numbers don't add up," which is critical for financial auditing.

### 4. Type Perspective Mapping
- **Decision**: Implemented a mapping where `TRANSFER_IN` on the exchange side is treated as a valid potential match for `TRANSFER_OUT` on the user side.
- **Rationale**: Transactions represent the same movement of funds but are recorded from opposite perspectives (the exchange sees it coming in, the user sees it going out).

### 5. Report Persistence
- **Decision**: Chose to store the final reconciliation results as an array in a `Reports` collection.
- **Rationale**: This provides a "snapshot" of the reconciliation at the time it was run, allowing users to retrieve historical reports even if the raw transaction data is modified later.

---

##  Testing
You can test the engine using the provided sample files in the `data/` folder:
1. `POST http://localhost:3000/reconcile`
2. Copy the `runId` from the response.
3. `GET http://localhost:3000/report/{runId}`