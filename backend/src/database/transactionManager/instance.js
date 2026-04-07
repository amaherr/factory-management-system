const { createMongoTransactionAdapter } = require("./mongoAdapter");

/**
 * Creates a transaction manager using a provided database adapter.
 *
 * This function abstracts the transaction execution logic from the rest of the application.
 * The application only interacts with `transactionManager.run(...)` without knowing
 * which database is being used underneath.
 *
 * @param {Object} adapter - Database-specific transaction adapter
 * @param {Function} adapter.run - Function that executes work inside a transaction
 *
 * @returns {Object} transactionManager
 * @returns {Function} transactionManager.run - Runs a function inside a transaction
 */
function createTransactionManager(adapter) {
    return {
        /**
         * Executes a given function inside a database transaction.
         *
         * The function `work` will receive a transaction context (`tx`) which contains
         * database-specific transaction data (e.g., Mongo session).
         *
         * @template T
         * @param {(tx: Object) => Promise<T>} work - Business logic to execute atomically
         * @returns {Promise<T>} Result returned by the work function
         */
        run: async (work) => {
            return adapter.run(work);
        },
    };
}

/**
 * Application-wide transaction manager instance.
 *
 * This is the single entry point used across the application
 * to execute transactional operations.
 *
 * If the database changes in the future (e.g., PostgreSQL),
 * only this file needs to be updated.
 */
const transactionManager = createTransactionManager(createMongoTransactionAdapter());

module.exports = transactionManager;
