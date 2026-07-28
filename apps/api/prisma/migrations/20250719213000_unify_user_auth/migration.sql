-- Drop legacy admin tables and create unified user_actions
DROP TABLE IF EXISTS "admin_actions";
DROP TABLE IF EXISTS "admins";

CREATE TABLE "user_actions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_id" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_actions_user_id_idx" ON "user_actions"("user_id");
CREATE INDEX "user_actions_action_type_idx" ON "user_actions"("action_type");

ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
