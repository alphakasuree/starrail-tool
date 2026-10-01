CREATE TABLE app_profile (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(36) NOT NULL UNIQUE, display_name VARCHAR(30) NOT NULL,
 created_at DATETIME(6) NOT NULL, selected_character VARCHAR(64) NOT NULL, selected_lightcone VARCHAR(64) NOT NULL
);
CREATE TABLE profile_session (
 token_hash VARCHAR(64) PRIMARY KEY, profile_id BIGINT NOT NULL, expires_at DATETIME(6) NOT NULL,
 FOREIGN KEY (profile_id) REFERENCES app_profile(id)
);
CREATE TABLE warp_item (
 item_key VARCHAR(64) PRIMARY KEY, catalog_id VARCHAR(30) NOT NULL, item_type VARCHAR(20) NOT NULL,
 name VARCHAR(150) NOT NULL, rarity INT NOT NULL,
 CHECK (rarity IN (3,4,5)), CHECK (item_type IN ('character','lightcone'))
);
CREATE TABLE warp_banner (
 banner_key VARCHAR(64) PRIMARY KEY, title VARCHAR(150) NOT NULL, pity_group VARCHAR(40) NOT NULL,
 featured_item_key VARCHAR(64) NOT NULL, featured_four BOOLEAN NOT NULL, enabled BOOLEAN NOT NULL,
 FOREIGN KEY (featured_item_key) REFERENCES warp_item(item_key),
 CHECK (pity_group IN ('character','lightcone','characterCollaboration','lightconeCollaboration'))
);
CREATE TABLE warp_banner_pool (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, banner_key VARCHAR(64) NOT NULL, item_key VARCHAR(64) NOT NULL, featured BOOLEAN NOT NULL,
 UNIQUE (banner_key,item_key), FOREIGN KEY (banner_key) REFERENCES warp_banner(banner_key), FOREIGN KEY (item_key) REFERENCES warp_item(item_key)
);
CREATE TABLE warp_pity_state (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, profile_id BIGINT NOT NULL, pity_group VARCHAR(40) NOT NULL,
 pity4 INT NOT NULL, pity5 INT NOT NULL, guaranteed4 BOOLEAN NOT NULL, guaranteed5 BOOLEAN NOT NULL, revision BIGINT NOT NULL,
 UNIQUE(profile_id,pity_group), FOREIGN KEY (profile_id) REFERENCES app_profile(id),
 CHECK(pity4 BETWEEN 0 AND 9), CHECK(revision>=0),
 CHECK((pity_group IN ('character','characterCollaboration') AND pity5 BETWEEN 0 AND 89)
 OR (pity_group IN ('lightcone','lightconeCollaboration') AND pity5 BETWEEN 0 AND 79))
);
CREATE TABLE warp_pull_batch (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, profile_id BIGINT NOT NULL, request_id VARCHAR(36) NOT NULL, request_hash VARCHAR(64) NOT NULL,
 banner_key VARCHAR(64) NOT NULL, pull_count INT NOT NULL, created_at DATETIME(6) NOT NULL,
 end_pity4 INT NOT NULL, end_pity5 INT NOT NULL, end_guaranteed4 BOOLEAN NOT NULL, end_guaranteed5 BOOLEAN NOT NULL, end_revision BIGINT NOT NULL,
 UNIQUE(profile_id,request_id), FOREIGN KEY(profile_id) REFERENCES app_profile(id), FOREIGN KEY(banner_key) REFERENCES warp_banner(banner_key), CHECK(pull_count IN (1,10))
);
CREATE TABLE warp_history (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, batch_id BIGINT NOT NULL, item_key VARCHAR(64) NOT NULL, pull_index INT NOT NULL,
 featured BOOLEAN NOT NULL, pulled_at DATETIME(6) NOT NULL,
 UNIQUE(batch_id,pull_index), FOREIGN KEY(batch_id) REFERENCES warp_pull_batch(id), FOREIGN KEY(item_key) REFERENCES warp_item(item_key), CHECK(pull_index BETWEEN 1 AND 10)
);
CREATE INDEX idx_batch_profile ON warp_pull_batch(profile_id,id);
CREATE INDEX idx_session_expiry ON profile_session(expires_at);
