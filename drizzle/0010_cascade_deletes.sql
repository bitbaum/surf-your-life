-- Add ON DELETE CASCADE to threads, thread_messages, and programme_enrolments.
-- Previously these FK constraints had no ON DELETE behaviour, causing errors
-- when deleting a user who had threads or programme enrolments.

-- threads.client_id → users.id
ALTER TABLE threads
  DROP CONSTRAINT IF EXISTS threads_client_id_users_id_fk,
  ADD CONSTRAINT threads_client_id_users_id_fk
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;

-- thread_messages.thread_id → threads.id
ALTER TABLE thread_messages
  DROP CONSTRAINT IF EXISTS thread_messages_thread_id_threads_id_fk,
  ADD CONSTRAINT thread_messages_thread_id_threads_id_fk
    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE;

-- thread_messages.sender_id → users.id
ALTER TABLE thread_messages
  DROP CONSTRAINT IF EXISTS thread_messages_sender_id_users_id_fk,
  ADD CONSTRAINT thread_messages_sender_id_users_id_fk
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

-- programme_enrolments.client_id → users.id
ALTER TABLE programme_enrolments
  DROP CONSTRAINT IF EXISTS programme_enrolments_client_id_users_id_fk,
  ADD CONSTRAINT programme_enrolments_client_id_users_id_fk
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;

-- programme_enrolments.programme_id → programmes.id
ALTER TABLE programme_enrolments
  DROP CONSTRAINT IF EXISTS programme_enrolments_programme_id_programmes_id_fk,
  ADD CONSTRAINT programme_enrolments_programme_id_programmes_id_fk
    FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE;
