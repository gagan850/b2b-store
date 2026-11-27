import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/** Adds bill-to-account terms and credit hold to companies. */
export class Migration20261124100000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "company" ADD COLUMN IF NOT EXISTS "payment_terms" text check ("payment_terms" in ('prepaid', 'net_15', 'net_30', 'net_45', 'net_60')) not null default 'prepaid';`
    );
    this.addSql(
      `ALTER TABLE IF EXISTS "company" ADD COLUMN IF NOT EXISTS "credit_hold" boolean not null default false;`
    );
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "company" DROP COLUMN IF EXISTS "payment_terms";`);
    this.addSql(`ALTER TABLE IF EXISTS "company" DROP COLUMN IF EXISTS "credit_hold";`);
  }
}
