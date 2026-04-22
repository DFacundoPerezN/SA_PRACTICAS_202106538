SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection=utf8mb4;

-- ──────────────────────────────────────────────────────────────────
-- 5. NOTIFICATIONS_DB — Notification Service (:5005) [opcional]
-- ──────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS notifications_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE notifications_db;

CREATE TABLE notification_types (
  id   TINYINT     NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  CONSTRAINT pk_notification_types    PRIMARY KEY (id),
  CONSTRAINT uq_notification_type_name UNIQUE (name)
) ENGINE=InnoDB;

INSERT INTO notification_types (name) VALUES
  ('ticket_created'), ('ticket_assigned'), ('ticket_status_updated'),
  ('ticket_resolved'), ('ticket_closed'), ('ticket_auto_closed'), ('ticket_reopened');

CREATE TABLE notifications (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()),
  recipient_id         CHAR(36)     NOT NULL,
  ticket_id            CHAR(36)     NOT NULL,
  notification_type_id TINYINT      NOT NULL,
  channel              VARCHAR(50)  NOT NULL DEFAULT 'email',
  subject              VARCHAR(255) NOT NULL,
  body                 TEXT         NOT NULL,
  sent                 TINYINT(1)   NOT NULL DEFAULT 0,
  sent_at              DATETIME     NULL,
  error_message        TEXT         NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_notifications        PRIMARY KEY (id),
  CONSTRAINT fk_notif_type           FOREIGN KEY (notification_type_id) REFERENCES notification_types(id),
  INDEX idx_notif_recipient (recipient_id),
  INDEX idx_notif_ticket    (ticket_id),
  INDEX idx_notif_sent      (sent),
  INDEX idx_notif_created   (created_at)
) ENGINE=InnoDB;