-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "target_user_id" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_logs_admin_id_idx" ON "admin_audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_user_id_idx" ON "admin_audit_logs"("target_user_id");

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
