# Database Scripts

This folder contains utility scripts for managing the database.

## Available Scripts

### 1. Clear Database (`clearDatabase.js`)

Clears all documents from collections in the database while preserving specified collections.

#### Usage

```bash
# Clear all collections
node scripts/clearDatabase.js

# Preserve specific collection(s)
node scripts/clearDatabase.js User
node scripts/clearDatabase.js User Product
node scripts/clearDatabase.js User Product Order Customer
```

#### Examples

**Clear everything:**

```bash
node scripts/clearDatabase.js
```

**Clear everything except User collection:**

```bash
node scripts/clearDatabase.js User
```

**Clear everything except User and Product collections:**

```bash
node scripts/clearDatabase.js User Product
```

**Clear everything except multiple collections:**

```bash
node scripts/clearDatabase.js User Product Order Customer Issue
```

#### What It Does

- Connects to the MongoDB database using credentials from `.env`
- Lists all collections in the database
- Deletes all documents from each collection (except protected ones)
- Shows a summary of cleared and protected collections
- System collections are automatically protected

#### Protection

- **System collections** (system.indexes, system.views) are always protected
- **Specified collections** via command line arguments are protected
- All other collections are cleared

#### Notes

- Make sure you have the correct `MONGODB_URI` in your `.env` file
- Always verify which collections will be cleared before running
- Use with caution on production environments

## Running Scripts

From the backend root directory, run:

```bash
# Using Node
node scripts/clearDatabase.js [arguments]

# Or with npm script (if configured in package.json)
npm run clear:db [arguments]
```

## Environment Variables

Make sure your `.env` file has:

```
MONGODB_URI=mongodb://localhost:27017/your_database_name
```
