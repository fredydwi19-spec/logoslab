CREATE TABLE `achievements` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`achievement_type` enum('MATERI_TEKS_SELESAI','MATERI_VIDEO_SELESAI','GAME_SELESAI') NOT NULL,
	`claimed_at` timestamp DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_project_achiev` UNIQUE(`user_id`,`project_id`,`achievement_type`)
);
--> statement-breakpoint
CREATE TABLE `materi_contents` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`content_type` enum('PDF','PPT','IMAGE','VIDEO','EMBED_URL') NOT NULL,
	`file_url` longtext NOT NULL,
	`file_name` varchar(255),
	`file_size` int,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materi_contents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materi_read_progress` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`scroll_percentage` int DEFAULT 0,
	`time_spent_seconds` int DEFAULT 0,
	`video_watched_percentage` int DEFAULT 0,
	`is_completed` boolean DEFAULT false,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materi_read_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `materi_type` enum('TEKS','VIDEO');--> statement-breakpoint
ALTER TABLE `achievements` ADD CONSTRAINT `achievements_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `achievements` ADD CONSTRAINT `achievements_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materi_contents` ADD CONSTRAINT `materi_contents_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materi_read_progress` ADD CONSTRAINT `materi_read_progress_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materi_read_progress` ADD CONSTRAINT `materi_read_progress_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;