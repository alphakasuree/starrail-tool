ALTER TABLE app_profile ADD COLUMN login_id VARCHAR(30) NULL;
ALTER TABLE app_profile ADD COLUMN password_hash VARCHAR(100) NULL;
ALTER TABLE app_profile ADD CONSTRAINT uq_profile_login_id UNIQUE (login_id);

CREATE TABLE account_session (
 token_hash VARCHAR(64) PRIMARY KEY,
 profile_id BIGINT NOT NULL,
 created_at DATETIME(6) NOT NULL,
 expires_at DATETIME(6) NOT NULL,
 absolute_expires_at DATETIME(6) NOT NULL,
 FOREIGN KEY (profile_id) REFERENCES app_profile(id)
);
CREATE INDEX idx_account_session_profile ON account_session(profile_id);
CREATE INDEX idx_account_session_expiry ON account_session(expires_at);

CREATE TABLE account_document (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 profile_id BIGINT NOT NULL,
 section VARCHAR(20) NOT NULL,
 payload MEDIUMTEXT NOT NULL,
 revision BIGINT NOT NULL,
 UNIQUE(profile_id, section),
 FOREIGN KEY (profile_id) REFERENCES app_profile(id),
 CHECK(section IN ('relic','teams')), CHECK(revision >= 0)
);
CREATE TABLE account_import (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 profile_id BIGINT NOT NULL,
 payload_hash VARCHAR(64) NOT NULL,
 created_at DATETIME(6) NOT NULL,
 UNIQUE(profile_id, payload_hash),
 FOREIGN KEY (profile_id) REFERENCES app_profile(id)
);
CREATE TABLE login_throttle (
 bucket_key VARCHAR(64) PRIMARY KEY,
 failures INT NOT NULL,
 window_started_at DATETIME(6) NOT NULL,
 blocked_until DATETIME(6) NULL
);
