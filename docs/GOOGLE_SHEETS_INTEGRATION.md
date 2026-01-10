# Google Sheets API Integration Plan

## Goal
Fetch transaction data from a private Google Sheet on app load, replacing manual CSV uploads.

---

## Prerequisites (User Setup Required)

1. **Google Cloud Console Setup**:
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project (or use existing)
   - Enable "Google Sheets API" (APIs & Services > Enable APIs)
   - Create Service Account (IAM & Admin > Service Accounts > Create)
   - Create and download JSON key for the service account

2. **Share Sheet with Service Account**:
   - Copy the service account email (looks like `name@project.iam.gserviceaccount.com`)
   - Open your Google Sheet > Share > Add the service account email as Viewer

3. **Get Sheet ID**:
   - From URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

---

## Implementation

### 1. Install Dependencies
```bash
npm install googleapis
```

### 2. Environment Variables
Create `.env` file:
```env
GOOGLE_SHEETS_ID=your-sheet-id-here
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Create Server API Endpoint
**File**: `src/routes/api/transactions/+server.ts`

- Authenticates with Google Sheets API using service account
- Fetches all rows from the sheet
- Parses data using existing CSV utility logic
- Returns JSON array of transactions

### 4. Create Google Sheets Utility
**File**: `src/lib/utils/googleSheets.ts`

- Function to fetch and parse sheet data
- Reuses existing parsing logic from `csv.ts`
- Handles Google Sheets API response format

### 5. Update Page Load
**File**: `src/routes/+page.svelte`

- Add `onMount` to fetch data from `/api/transactions`
- Call `expenses.replaceAllTransactions()` with fetched data
- Add loading state and error handling

### 6. Add Manual Refresh Button
- Add a refresh button to reload data from Google Sheets
- Useful when sheet data is updated

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/routes/api/transactions/+server.ts` | Create |
| `src/lib/utils/googleSheets.ts` | Create |
| `src/routes/+page.svelte` | Modify (add data loading) |
| `.env` | Create |
| `.env.example` | Create (template without secrets) |
| `package.json` | Modify (add googleapis) |

---

## Data Flow

```
App Load
    ↓
+page.svelte onMount
    ↓
fetch('/api/transactions')
    ↓
+server.ts (server-side)
    ↓
Google Sheets API (with service account auth)
    ↓
Parse rows → Transaction[]
    ↓
Return JSON
    ↓
expenses.replaceAllTransactions(data)
    ↓
UI updates reactively
```

---

## Error Handling

- **Loading state**: Show spinner while fetching
- **API errors**: Display error message, allow retry
- **Parse errors**: Log invalid rows, continue with valid ones
- **Network errors**: Show offline message, allow manual CSV fallback

---

## Security Notes

- Service account credentials stay server-side only
- Private key stored in environment variable, not in code
- API endpoint is internal, no external access needed
