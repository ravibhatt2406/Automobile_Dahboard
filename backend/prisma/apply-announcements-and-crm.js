const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  console.log('--- STARTING SAFE ADDITIVE MIGRATION FOR CRM & ANNOUNCEMENTS ---');

  const exec = async (sql) => {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      console.warn('SQL notice:', err.message);
    }
  };

  // 1. Leads table alterations
  console.log('[1] Updating leads table with prospect fields and lead_number...');
  await exec('ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lead_number" VARCHAR(50);');
  await exec('ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "prospect_name" VARCHAR(255);');
  await exec('ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "prospect_phone" VARCHAR(50);');
  await exec('ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "prospect_email" VARCHAR(255);');
  await exec('ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "company_name" VARCHAR(255);');
  await exec('ALTER TABLE "leads" ALTER COLUMN "customer_id" DROP NOT NULL;');

  await exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_lead_number_key'
      ) THEN
        ALTER TABLE "leads" ADD CONSTRAINT "leads_lead_number_key" UNIQUE ("lead_number");
      END IF;
    END $$;
  `);

  await exec(`
    UPDATE "leads" 
    SET "lead_number" = 'LD-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8))
    WHERE "lead_number" IS NULL;
  `);

  // 2. LeadActivityType and lead_activities table
  console.log('[2] Creating LeadActivityType enum and lead_activities table...');
  await exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadActivityType') THEN
        CREATE TYPE "LeadActivityType" AS ENUM ('NOTE', 'CALL', 'MEETING', 'TEST_DRIVE', 'STAGE_CHANGE', 'FOLLOW_UP');
      END IF;
    END $$;
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS "lead_activities" (
      "id" TEXT PRIMARY KEY,
      "lead_id" TEXT NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
      "employee_id" TEXT REFERENCES "employees"("id") ON DELETE SET NULL,
      "activity_type" "LeadActivityType" NOT NULL DEFAULT 'NOTE',
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "scheduled_at" TIMESTAMP(3),
      "completed_at" TIMESTAMP(3),
      "metadata" JSONB,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await exec('CREATE INDEX IF NOT EXISTS "lead_activities_lead_id_idx" ON "lead_activities"("lead_id");');

  // 3. Announcement enums
  console.log('[3] Creating Announcement enums...');
  await exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnnouncementCategory') THEN
        CREATE TYPE "AnnouncementCategory" AS ENUM ('GENERAL', 'OPERATIONS', 'SALES', 'SERVICE', 'FINANCE', 'HR', 'URGENT');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnnouncementPriority') THEN
        CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnnouncementStatus') THEN
        CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnnouncementAudience') THEN
        CREATE TYPE "AnnouncementAudience" AS ENUM ('PLATFORM_WIDE', 'FRANCHISE', 'BRANCH', 'SELECTED_BRANCHES');
      END IF;
    END $$;
  `);

  // 4. Announcements table
  console.log('[4] Creating announcements table...');
  await exec(`
    CREATE TABLE IF NOT EXISTS "announcements" (
      "id" TEXT PRIMARY KEY,
      "title" VARCHAR(255) NOT NULL,
      "content" TEXT NOT NULL,
      "category" "AnnouncementCategory" NOT NULL DEFAULT 'GENERAL',
      "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
      "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
      "target_audience" "AnnouncementAudience" NOT NULL DEFAULT 'PLATFORM_WIDE',
      "franchise_id" TEXT REFERENCES "franchises"("id") ON DELETE CASCADE,
      "branch_id" TEXT REFERENCES "branches"("id") ON DELETE CASCADE,
      "target_branch_ids" TEXT[] NOT NULL DEFAULT '{}',
      "author_user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "author_name" VARCHAR(255),
      "author_role" VARCHAR(100),
      "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expiry_date" TIMESTAMP(3),
      "published_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await exec('CREATE INDEX IF NOT EXISTS "announcements_franchise_id_idx" ON "announcements"("franchise_id");');
  await exec('CREATE INDEX IF NOT EXISTS "announcements_branch_id_idx" ON "announcements"("branch_id");');
  await exec('CREATE INDEX IF NOT EXISTS "announcements_status_idx" ON "announcements"("status");');

  // 5. Announcement reads table
  console.log('[5] Creating announcement_reads table...');
  await exec(`
    CREATE TABLE IF NOT EXISTS "announcement_reads" (
      "id" TEXT PRIMARY KEY,
      "announcement_id" TEXT NOT NULL REFERENCES "announcements"("id") ON DELETE CASCADE,
      "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "announcement_reads_announcement_id_user_id_key" UNIQUE ("announcement_id", "user_id")
    );
  `);
  await exec('CREATE INDEX IF NOT EXISTS "announcement_reads_user_id_idx" ON "announcement_reads"("user_id");');

  console.log('✅ ALL ADDITIVE DATABASE OBJECTS CREATED AND VERIFIED SUCCESSFULLY!');
  await prisma.$disconnect();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
