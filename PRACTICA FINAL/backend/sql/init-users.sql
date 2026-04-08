-- ──────────────────────────────────────────────────────────────────
-- 2. USERS_DB — User Service (:5002)
-- ──────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS users_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE users_db;

CREATE TABLE roles (
  id    TINYINT     NOT NULL AUTO_INCREMENT,
  name  VARCHAR(50) NOT NULL,
  CONSTRAINT pk_roles    PRIMARY KEY (id),
  CONSTRAINT uq_rol_name UNIQUE (name)
) ENGINE=InnoDB;

INSERT INTO roles (name) VALUES ('cliente'), ('tecnico'), ('administrador');

CREATE TABLE users (
  id           CHAR(36)     NOT NULL,
  name         VARCHAR(150) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  role_id      TINYINT      NOT NULL DEFAULT 1,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  deleted_at   DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_users       PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT fk_users_role  FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_users_role    (role_id),
  INDEX idx_users_deleted (deleted_at)
) ENGINE=InnoDB;

-- Activar usuario administrador por defecto
INSERT INTO users (id, name, email, role_id, is_active) VALUES
('16df9e7f-3150-11f1-9cc0-002b6738278b', 'Admin User', 'admin@admin.com', 3, 1);