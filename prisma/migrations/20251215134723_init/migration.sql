-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "rating" REAL,
    "userRatingCount" INTEGER,
    "category" TEXT,
    "photoUrl" TEXT,
    "openNow" BOOLEAN,
    "website" TEXT,
    "rawData" TEXT,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Place_lat_lng_idx" ON "Place"("lat", "lng");
