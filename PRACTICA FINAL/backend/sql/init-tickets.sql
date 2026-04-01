-- ──────────────────────────────────────────────────────────────────
-- 3. TICKETS_DB — Ticket Service (:5003)
-- ──────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS tickets_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tickets_db;

CREATE TABLE categories (
  id   SMALLINT    NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  CONSTRAINT pk_categories    PRIMARY KEY (id),
  CONSTRAINT uq_category_name UNIQUE (name)
) ENGINE=InnoDB;

INSERT INTO categories (name) VALUES
  ('Hardware'), ('Software'), ('Red / Conectividad'),
  ('Accesos y Permisos'), ('Correo Electrónico'), ('Otro');

CREATE TABLE ticket_statuses (
  id   TINYINT     NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  CONSTRAINT pk_ticket_statuses    PRIMARY KEY (id),
  CONSTRAINT uq_ticket_status_name UNIQUE (name)
) ENGINE=InnoDB;

INSERT INTO ticket_statuses (name) VALUES
  ('abierto'), ('en_progreso'), ('resuelto'), ('cerrado'), ('reabierto');

CREATE TABLE priorities (
  id   TINYINT     NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  CONSTRAINT pk_priorities    PRIMARY KEY (id),
  CONSTRAINT uq_priority_name UNIQUE (name)
) ENGINE=InnoDB;

INSERT INTO priorities (name) VALUES ('baja'), ('media'), ('alta'), ('critica');

CREATE TABLE tickets (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  title           VARCHAR(255)  NOT NULL,
  description     TEXT          NOT NULL,
  category_id     SMALLINT      NOT NULL,
  priority_id     TINYINT       NOT NULL,
  status_id       TINYINT       NOT NULL DEFAULT 1,
  created_by      CHAR(36)      NOT NULL,
  assigned_to     CHAR(36)      NULL,
  resolved_at     DATETIME      NULL,
  closed_at       DATETIME      NULL,
  auto_closed     TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_tickets          PRIMARY KEY (id),
  CONSTRAINT fk_ticket_category  FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_ticket_priority  FOREIGN KEY (priority_id) REFERENCES priorities(id),
  CONSTRAINT fk_ticket_status    FOREIGN KEY (status_id)   REFERENCES ticket_statuses(id),
  INDEX idx_ticket_status      (status_id),
  INDEX idx_ticket_created_by  (created_by),
  INDEX idx_ticket_assigned_to (assigned_to),
  INDEX idx_ticket_created_at  (created_at),
  FULLTEXT idx_ticket_search   (title, description)
) ENGINE=InnoDB;

CREATE TABLE comments (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  ticket_id   CHAR(36)    NOT NULL,
  author_id   CHAR(36)    NOT NULL,
  content     TEXT        NOT NULL,
  is_internal TINYINT(1)  NOT NULL DEFAULT 0,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_comments       PRIMARY KEY (id),
  CONSTRAINT fk_comment_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  INDEX idx_comment_ticket (ticket_id),
  INDEX idx_comment_author (author_id)
) ENGINE=InnoDB;

CREATE TABLE ticket_history (
  id            CHAR(36)    NOT NULL DEFAULT (UUID()),
  ticket_id     CHAR(36)    NOT NULL,
  changed_by    CHAR(36)    NOT NULL,
  field_changed VARCHAR(50) NOT NULL,
  old_value     VARCHAR(255) NULL,
  new_value     VARCHAR(255) NULL,
  changed_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_ticket_history       PRIMARY KEY (id),
  CONSTRAINT fk_ticket_history_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  INDEX idx_history_ticket (ticket_id),
  INDEX idx_history_date   (changed_at)
) ENGINE=InnoDB;