/**
 * Database Clear Script
 *
 * This script clears all documents from collections in the database,
 * except for specified collections that should be preserved.
 *
 * Usage:
 * node scripts/clearDatabase.js [collections_to_preserve]
 *
 * Examples:
 * node scripts/clearDatabase.js                         # Clear all collections
 * node scripts/clearDatabase.js users                   # Preserve User collection
 * node scripts/clearDatabase.js users products          # Preserve User and Role collections
 * node scripts/clearDatabase.js users products batches  # Preserve multiple collections
 */

require("dotenv").config();
const mongoose = require("mongoose");

// Default collections to never clear (can be overridden by command line arguments)
const DEFAULT_PROTECTED_COLLECTIONS = [];

// Collections that should always be protected (system collections)
const SYSTEM_PROTECTED_COLLECTIONS = ["system.indexes", "system.views"];

/**
 * Main function to clear database
 */
async function clearDatabase() {
    try {
        console.log("🔗 Connecting to database...");

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ Connected to database successfully\n");

        // Get protected collections from command line arguments
        const protectedCollections = [
            ...SYSTEM_PROTECTED_COLLECTIONS,
            ...DEFAULT_PROTECTED_COLLECTIONS,
            ...process.argv.slice(2),
        ];

        console.log(
            "📋 Protected collections:",
            protectedCollections.length > 0 ? protectedCollections : "None\n",
        );

        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📊 Total collections found: ${collections.length}\n`);

        let clearedCount = 0;
        let skippedCount = 0;

        // Clear each collection
        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;

            // Check if collection should be protected
            if (protectedCollections.includes(collectionName)) {
                console.log(`⏭️  Skipping protected collection: ${collectionName}`);
                skippedCount++;
                continue;
            }

            try {
                const collection = mongoose.connection.db.collection(collectionName);
                const result = await collection.deleteMany({});
                console.log(
                    `🗑️  Cleared collection: ${collectionName} (${result.deletedCount} documents removed)`,
                );
                clearedCount++;
            } catch (err) {
                console.error(`❌ Error clearing collection ${collectionName}:`, err.message);
            }
        }

        console.log("\n" + "=".repeat(50));
        console.log(`✨ Database clear operation completed!`);
        console.log(`   • Collections cleared: ${clearedCount}`);
        console.log(`   • Collections protected: ${skippedCount}`);
        console.log("=".repeat(50));

        // Disconnect from database
        await mongoose.connection.close();
        console.log("\n✅ Disconnected from database");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

// Run the script
clearDatabase();
