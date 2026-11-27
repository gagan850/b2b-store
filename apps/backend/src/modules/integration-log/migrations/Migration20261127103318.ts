import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261127103318 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "integration_event" ("id" text not null, "integration" text not null, "action" text not null, "direction" text check ("direction" in ('outbound', 'inbound')) not null default 'outbound', "status" text check ("status" in ('success', 'failed')) not null, "reference_type" text null, "reference_id" text null, "request" jsonb null, "response" jsonb null, "error" text null, "duration_ms" integer not null default 0, "attempt" integer not null default 1, "retry_of" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "integration_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_integration_event_deleted_at" ON "integration_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_integration_event_integration_created_at" ON "integration_event" ("integration", "created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_integration_event_status_created_at" ON "integration_event" ("status", "created_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "integration_event" cascade;`);
  }

}
