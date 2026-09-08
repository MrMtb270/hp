-- Ny profil ska starta med prognos 0, inte en påhittad baslinje.
ALTER TABLE "Profile" ALTER COLUMN "currentEstimate" SET DEFAULT 0;
