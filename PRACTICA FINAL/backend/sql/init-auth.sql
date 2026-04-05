-- ──────────────────────────────────────────────────────────────────
-- 1. AUTH_DB — Auth Service (:5001)
-- ──────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE auth_db;

CREATE TABLE users_auth (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_users_auth     PRIMARY KEY (id),
  CONSTRAINT uq_users_auth_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  user_id       CHAR(36)        NOT NULL,
  token_hash    VARCHAR(512)    NOT NULL,
  expires_at    DATETIME        NOT NULL,
  revoked       TINYINT(1)      NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
  CONSTRAINT fk_rt_user        FOREIGN KEY (user_id) REFERENCES users_auth(id) ON DELETE CASCADE,
  INDEX idx_rt_user_id (user_id),
  INDEX idx_rt_expires (expires_at)
) ENGINE=InnoDB;