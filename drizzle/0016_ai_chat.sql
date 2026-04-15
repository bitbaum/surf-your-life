-- AI chat message history per client
CREATE TABLE "ai_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "ai_messages_user_id_idx" ON "ai_messages" ("user_id");
CREATE INDEX "ai_messages_created_at_idx" ON "ai_messages" ("created_at");
