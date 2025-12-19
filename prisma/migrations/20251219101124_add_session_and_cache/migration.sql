-- CreateTable
CREATE TABLE "RouteCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startLat" REAL NOT NULL,
    "startLng" REAL NOT NULL,
    "endLat" REAL NOT NULL,
    "endLng" REAL NOT NULL,
    "distance" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "pathJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "cacheType" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "cacheData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "UserCache_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("sessionId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RouteCache_startLat_startLng_endLat_endLng_idx" ON "RouteCache"("startLat", "startLng", "endLat", "endLng");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionId_key" ON "Session"("sessionId");

-- CreateIndex
CREATE INDEX "Session_sessionId_idx" ON "Session"("sessionId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "UserCache_sessionId_cacheType_idx" ON "UserCache"("sessionId", "cacheType");

-- CreateIndex
CREATE INDEX "UserCache_expiresAt_idx" ON "UserCache"("expiresAt");
