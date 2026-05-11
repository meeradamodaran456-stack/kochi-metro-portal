-- ============================================
-- Kochi Metro Staff Directory - MySQL Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS kochi_metro_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kochi_metro_db;

-- -----------------------------------------------
-- Staff Table
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  staff_name      VARCHAR(150)   NOT NULL,
  department      VARCHAR(150)   NOT NULL DEFAULT '',
  designation     VARCHAR(150)   NOT NULL DEFAULT '',
  extension_no    VARCHAR(30)    DEFAULT NULL,
  did             VARCHAR(30)    DEFAULT NULL,
  direct_number   VARCHAR(30)    DEFAULT NULL,
  mobile_number   VARCHAR(20)    DEFAULT NULL,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_staff_name     (staff_name),
  INDEX idx_department     (department),
  INDEX idx_designation    (designation),
  FULLTEXT INDEX ft_search (staff_name, department, designation, extension_no, did, direct_number, mobile_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------
-- Users Table (Admin & Staff)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------
-- Default Accounts
-- Admin: admin@kochi.metro / admin
-- Staff: staff@kochi.metro / staff@kochi.metro
-- -----------------------------------------------
INSERT IGNORE INTO users (username, password_hash, role)
VALUES 
('admin@kochi.metro', '$2a$10$XXDNF59Qxu7.lDPZqhXNpuQSJ96nRgJYsU/oKu2A0anjbihCgweAG', 'admin'),
('staff@kochi.metro', '$2a$10$5b42DsEHL4gjt1eKsG4WxOc.jNyn3oycRdLGwizJxGfNYAVEzeo1i', 'staff');
