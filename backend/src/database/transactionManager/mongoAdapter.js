const mongoose = require("mongoose");

/**
 * Creates a MongoDB transaction adapter.
 *
 * This adapter is responsible for:
 * - Starting a MongoDB session
 * - Running a transaction using `withTransaction`
 * - Passing a transaction context (`tx`) to the business logic
 * - Handling commit/rollback automatically
 * - Closing the session after execution
 *
 * @returns {Object} adapter
 * @returns {Function} adapter.run - Executes a function inside a MongoDB transaction
 */
function createMongoTransactionAdapter() {
    return {
        /**
         * Executes a function inside a MongoDB transaction.
         *
         * Internally:
         * - Starts a session
         * - Wraps execution inside `session.withTransaction`
         * - Creates a transaction context (`tx`)
         * - Passes `tx` to the provided function
         *
         * @template T
         * @param {(tx: { kind: "mongo", session: import("mongoose").ClientSession }) => Promise<T>} work
         * @returns {Promise<T>}
         */
        run: async (work) => {
            // start mongodb transaction
            const session = await mongoose.startSession();

            try {
                // execute the transaction
                const result = await session.withTransaction(async () => {
                    // build mongo transaction context
                    const tx = {
                        kind: "mongo",
                        session,
                    };

                    // execute business logic inside transaction
                    return work(tx);
                });
            } finally {
                await session.endSession();
            }
        },
    };
}

/**
 * Extracts the MongoDB session from a transaction context.
 *
 * This helper ensures:
 * - Safe access to the session
 * - Validation that the transaction is Mongo-based
 * - Avoids leaking Mongo-specific logic across the app
 *
 * @param {Object|null} tx - Transaction context
 * @param {string} tx.kind - Type of transaction ("mongo", "postgres", etc.)
 * @param {Object} tx.session - MongoDB session
 *
 * @returns {import("mongoose").ClientSession|undefined}
 *
 * @throws {Error} If tx exists but is not a Mongo transaction
 */
function getMongoSession(tx) {
    if (!tx) return undefined;

    if (tx.kind !== "mongo") {
        throw new Error("Expected a mongo transaction context");
    }

    return tx.session;
}

module.exports = {
    createMongoTransactionAdapter,
    getMongoSession,
};
