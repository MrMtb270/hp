-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TestAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testAttemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedIndex" INTEGER,
    "correct" BOOLEAN NOT NULL,
    "timeSpentSec" INTEGER NOT NULL,
    CONSTRAINT "TestAnswer_testAttemptId_fkey" FOREIGN KEY ("testAttemptId") REFERENCES "TestAttempt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TestAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TestAnswer" ("correct", "id", "questionId", "selectedIndex", "testAttemptId", "timeSpentSec") SELECT "correct", "id", "questionId", "selectedIndex", "testAttemptId", "timeSpentSec" FROM "TestAnswer";
DROP TABLE "TestAnswer";
ALTER TABLE "new_TestAnswer" RENAME TO "TestAnswer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
