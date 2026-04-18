SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection=utf8mb4;

-- ──────────────────────────────────────────────────────────────────
-- 4. ASSIGNMENTS_DB — Assignment Service (:5004)
-- ──────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS assignments_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE assignments_db;

CREATE TABLE assignment_statuses (
  id   TINYINT     NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  CONSTRAINT pk_assignment_statuses PRIMARY KEY (id),
  CONSTRAINT uq_asgn_status_name    UNIQUE (name)
) ENGINE=InnoDB;

INSERT INTO assignment_statuses (name) VALUES
  ('pendiente'), ('asignado'), ('reasignado'), ('cerrado');

CREATE TABLE assignments (
  id            CHAR(36)  NOT NULL DEFAULT (UUID()),
  ticket_id     CHAR(36)  NOT NULL,
  technician_id CHAR(36)  NOT NULL,
  assigned_by   CHAR(36)  NULL,
  status_id     TINYINT   NOT NULL DEFAULT 2,
  assigned_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at     DATETIME  NULL,
  notes         TEXT      NULL,
  CONSTRAINT pk_assignments         PRIMARY KEY (id),
  CONSTRAINT fk_asgn_status         FOREIGN KEY (status_id) REFERENCES assignment_statuses(id),
  INDEX idx_asgn_ticket      (ticket_id),
  INDEX idx_asgn_technician  (technician_id),
  INDEX idx_asgn_status      (status_id),
  INDEX idx_asgn_assigned_at (assigned_at)
) ENGINE=InnoDB;

CREATE TABLE technician_workload (
  technician_id   CHAR(36) NOT NULL,
  active_tickets  INT      NOT NULL DEFAULT 0,
  last_updated    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_technician_workload PRIMARY KEY (technician_id)
) ENGINE=InnoDB;