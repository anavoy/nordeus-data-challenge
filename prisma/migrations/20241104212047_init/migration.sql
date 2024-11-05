-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "device_os" TEXT NOT NULL,
    "registration_date" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "match_id" TEXT NOT NULL,
    "home_user_id" TEXT NOT NULL,
    "away_user_id" TEXT NOT NULL,
    "home_goals_scored" INTEGER,
    "away_goals_scored" INTEGER,
    "match_start" DATETIME NOT NULL,
    "match_end" DATETIME,
    CONSTRAINT "Match_home_user_id_fkey" FOREIGN KEY ("home_user_id") REFERENCES "User" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_away_user_id_fkey" FOREIGN KEY ("away_user_id") REFERENCES "User" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Timezone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "country" TEXT NOT NULL,
    "timezone" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_id_key" ON "User"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Timezone_country_key" ON "Timezone"("country");
