CREATE TABLE `level_attempts` (
	`id` varchar(36) NOT NULL,
	`user_id` bigint unsigned,
	`project_id` bigint unsigned NOT NULL,
	`level` int NOT NULL,
	`answers` longtext NOT NULL,
	`score` int,
	`finished_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `level_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `level_attempts` ADD CONSTRAINT `level_attempts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `level_attempts` ADD CONSTRAINT `level_attempts_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;