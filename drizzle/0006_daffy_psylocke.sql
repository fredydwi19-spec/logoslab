CREATE TABLE `game_word_search` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`words` text NOT NULL,
	`grid_size` int NOT NULL,
	`difficulty` enum('EASY','MEDIUM','HARD') NOT NULL,
	`score` int NOT NULL,
	`grid_data` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_word_search_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `game_word_search` ADD CONSTRAINT `game_word_search_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;