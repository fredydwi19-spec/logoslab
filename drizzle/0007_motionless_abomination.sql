CREATE TABLE `game_crossword` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`clues` text NOT NULL,
	`grid_size` int NOT NULL,
	`difficulty` enum('EASY','MEDIUM','HARD') NOT NULL,
	`score` int NOT NULL,
	`grid_data` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_crossword_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_scores` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`score` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `status` enum('DRAFT','REVIEW_PAKAR','REVISI_PAKAR','ACCEPTED_PAKAR','REVIEW_KETUA','REVISI_KETUA','PUBLISHED','UNPUBLISHED') NOT NULL DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `thumbnail_url` longtext;--> statement-breakpoint
ALTER TABLE `game_crossword` ADD CONSTRAINT `game_crossword_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_scores` ADD CONSTRAINT `user_scores_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_scores` ADD CONSTRAINT `user_scores_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;