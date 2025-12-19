/**
 * Core database interface - abstracts database operations
 * Allows easy swapping of database implementations (Prisma, Mongoose, etc.)
 */
export interface IDatabase {
    /**
     * Initialize database connection
     */
    connect(): Promise<void>;

    /**
     * Close database connection
     */
    disconnect(): Promise<void>;

    /**
     * Check if database is healthy and connectable
     */
    healthCheck(): Promise<boolean>;

    /**
     * Execute operations within a transaction
     */
    transaction<T>(fn: () => Promise<T>): Promise<T>;
}
