# Automatic JSON to PostgreSQL Sync - Documentation

## Overview

Your EDVANCE system now includes an **automatic synchronization engine** that seamlessly syncs data from your JSON database (`edusphere_db.json`) to PostgreSQL when the system comes online. This enables true offline-first functionality with automatic data persistence.

## How It Works

### 1. **Automatic Connection Detection**
- The system continuously monitors PostgreSQL connection status
- When connection is restored after being offline, it automatically triggers a full sync
- Checks every 15 seconds for connection changes

### 2. **Data Migration Flow**

```
edusphere_db.json (Offline Source)
    ↓
  [Sync Engine]
    ↓
PostgreSQL Database (Online Persistence)
```

### 3. **Sync Operations**

The sync engine automatically migrates:
- **Schools** (8 records): Full UPSERT with conflict resolution
- **Users** (17 records): Smart email deduplication and conflict handling
- **Classes**: Full sync with teacher references
- **Parent-Student Links** (3 records): Auto-ID generation for records

### 4. **Sync Triggers**

**Automatic:**
- On connection restoration (system comes online)
- Every 5 minutes while online (periodic check)
- On backend startup

**Manual:**
- POST `/api/sync/manual` - Trigger sync on demand

## API Endpoints

### Status Endpoint
```bash
GET http://localhost:8080/api/status
```

**Response:**
```json
{
  "online": true,
  "pendingSync": 0,
  "lastSync": "2026-08-13T15:50:41Z",
  "syncDuration": "2.34 seconds"
}
```

### Manual Sync Endpoint
```bash
POST http://localhost:8080/api/sync/manual
```

**Response:**
```json
{
  "message": "Manual sync completed successfully",
  "status": {
    "online": true,
    "pendingSync": 0,
    "lastSync": "2026-08-13T15:51:00Z",
    "syncDuration": "0.89 seconds"
  }
}
```

## File Structure

### Modified Files
- `main.go` - Added sync engine initialization and routes
- `sync_engine.go` - Complete synchronization engine implementation

### Configuration
Edit the DSN (Data Source Name) in `main.go` line 115:
```go
const dsn = "host=localhost port=5432 user=postgres password=Black@123 dbname=edusphere sslmode=disable"
```

## Sync Logic Details

### Conflict Resolution Strategy

**Schools:**
- Primary key: `id`
- On conflict: Updates all fields

**Users:**
- Primary key: `id`
- Email constraint: UNIQUE
- On email conflict: Appends `-idXXX` suffix to email
- Empty emails: Converted to `user-{ID}@noemail.local`

**Classes:**
- Primary key: `id`
- On conflict: Updates all fields

**Parent-Student Links:**
- Primary key: `id`
- Missing IDs: Auto-generated as `parent-link-{index}`
- On conflict: Updates references

### Error Handling

The sync engine logs all operations:
```
[Sync] 🔄 Starting automatic sync from JSON to PostgreSQL...
[Sync] ✅ Sync complete! Schools: 8 | Users: 17 | Classes: 0 | Links: 3
```

Errors are logged with context:
```
[Sync] ⚠️ Failed to sync user X: duplicate key error
```

## Workflow Examples

### Scenario 1: Going Offline and Back Online
1. System loses internet connection
2. Data continues to sync to local JSON
3. When internet returns, automatic sync triggers
4. All changes from JSON file are synced to PostgreSQL
5. Status endpoint shows sync completion

### Scenario 2: Application Startup
1. Backend starts
2. Checks PostgreSQL connection
3. If online, automatically syncs JSON to PostgreSQL
4. If offline, queues operations for later

### Scenario 3: Manual Sync Trigger
1. User sends `POST /api/sync/manual`
2. Backend immediately syncs all JSON data to PostgreSQL
3. Returns sync status and record counts

## Testing the System

### Test Online Sync
```bash
# Check current status
curl http://localhost:8080/api/status

# Manually trigger sync
curl -X POST http://localhost:8080/api/sync/manual

# View synced data
$env:PGPASSWORD='Black@123'; psql -U postgres -h localhost -d edusphere -c "SELECT COUNT(*) FROM schools;"
```

### Test Offline Behavior
1. Stop PostgreSQL: `Stop-Service postgresql-x64-18`
2. The system automatically switches to offline mode
3. Data is stored in local JSON
4. View sync status: `curl http://localhost:8080/api/status`
   - Response: `{"online": false, "pendingSync": 0}`
5. Restart PostgreSQL: `Start-Service postgresql-x64-18`
6. Automatic sync triggers within 15 seconds
7. View status again to confirm sync

## Logs to Monitor

Look for these log patterns to understand sync operations:

```
[DB] ✅ Connected to PostgreSQL!           - Initial connection
[DB] ✅ Schema ready.                      - Tables created
[Sync] 🔄 Starting automatic sync...       - Sync starting
[Sync] ✅ Sync complete!                   - Sync successful
[Sync] 🔗 Connection restored!             - Just came back online
[Sync] ⚠️ Auto-sync failed: ...           - Sync error
```

## Performance Notes

- Initial sync: ~2-3 seconds (for 28 total records)
- Periodic sync check: ~1-2 seconds
- Sync runs on separate goroutine (non-blocking)
- Database connections: Max 10 open, 5 idle

## Security Considerations

⚠️ **Password in Connection String:**
Currently, the PostgreSQL password is stored in code:
```go
const dsn = "host=localhost port=5432 user=postgres password=Black@123 dbname=edusphere sslmode=disable"
```

**For Production:**
1. Use environment variables:
```go
dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
    os.Getenv("DB_HOST"),
    os.Getenv("DB_PORT"),
    os.Getenv("DB_USER"),
    os.Getenv("DB_PASSWORD"),
    os.Getenv("DB_NAME"),
)
```

2. Use `.env` file with proper permissions
3. Use database connection pooling with secrets manager

## Troubleshooting

### Sync not triggering after going online
1. Check if PostgreSQL service is running: `Get-Service postgresql-x64-18`
2. Verify connection string in `main.go`
3. Check backend logs for connection errors
4. Manually trigger sync: `POST /api/sync/manual`

### Duplicate email errors
- The sync engine automatically handles this
- Conflicting emails get `-idXXX` suffix
- Verify with: `SELECT COUNT(DISTINCT email) FROM users;`

### Missing records after sync
1. Check if records exist in edusphere_db.json
2. Verify PostgreSQL is online
3. Check backend logs for sync errors
4. Manually trigger: `POST /api/sync/manual`

## Next Steps

1. **Test the System**: Start/stop PostgreSQL and observe sync behavior
2. **Monitor Logs**: Watch the backend logs during sync operations
3. **Verify Data**: Query PostgreSQL to confirm all data is present
4. **Deploy**: Update your GitHub repository with the new sync engine

## Questions?

The sync engine is designed to be transparent - it works automatically in the background while your application operates normally, whether online or offline.
