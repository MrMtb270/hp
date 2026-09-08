-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "goalScore" REAL,
    "examDate" DATETIME,
    "previousAttempts" TEXT NOT NULL DEFAULT 'NONE',
    "previousScore" REAL,
    "selfAssessment" TEXT,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "currentEstimate" REAL NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "streakLastActive" DATETIME,
    "streakFreezes" INTEGER NOT NULL DEFAULT 1,
    "studyStyle" TEXT,
    "bestStudyHour" INTEGER,
    "totalStudySeconds" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("bestStudyHour", "currentEstimate", "examDate", "goalScore", "id", "level", "onboardingDone", "previousAttempts", "previousScore", "selfAssessment", "streakCount", "streakFreezes", "streakLastActive", "studyStyle", "totalStudySeconds", "updatedAt", "userId", "xp") SELECT "bestStudyHour", "currentEstimate", "examDate", "goalScore", "id", "level", "onboardingDone", "previousAttempts", "previousScore", "selfAssessment", "streakCount", "streakFreezes", "streakLastActive", "studyStyle", "totalStudySeconds", "updatedAt", "userId", "xp" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
