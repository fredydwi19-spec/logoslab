ALTER TABLE `projects` ADD `published_level_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `level_review_status` enum('DRAFT','REVIEW_PAKAR','REVISI_PAKAR','ACCEPTED_PAKAR','REVIEW_KETUA','REVISI_KETUA');--> statement-breakpoint
-- Game yang sudah terbit sebelum fitur ini: semua isinya masih Level 1, jadi 1 level sudah terbit
UPDATE `projects` SET `published_level_count` = 1 WHERE `status` = 'PUBLISHED' AND `type` = 'GAME';
