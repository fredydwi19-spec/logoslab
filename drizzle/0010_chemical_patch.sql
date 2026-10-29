CREATE TABLE `bank_soal_ftb` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`full_text` text NOT NULL,
	`answers` text NOT NULL,
	`difficulty` enum('MUDAH','SEDANG','SULIT') NOT NULL,
	`created_by` bigint unsigned,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_soal_ftb_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bank_soal_quiz` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`question` text NOT NULL,
	`option_a` varchar(255) NOT NULL,
	`option_b` varchar(255) NOT NULL,
	`option_c` varchar(255) NOT NULL,
	`option_d` varchar(255) NOT NULL,
	`correct_answer` enum('A','B','C','D') NOT NULL,
	`difficulty` enum('MUDAH','SEDANG','SULIT') NOT NULL,
	`explanation` text,
	`created_by` bigint unsigned,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_soal_quiz_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bank_soal_tts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`clue` text NOT NULL,
	`answer` varchar(255) NOT NULL,
	`difficulty` enum('MUDAH','SEDANG','SULIT') NOT NULL,
	`explanation` text,
	`created_by` bigint unsigned,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_soal_tts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_interests` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`interest_category` enum('Biblical Knowledge','Eksegesis & Hermeneutik','Biblical Theory','Homiletika','Apologetika','Lainnya') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `game_interests_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_category_unq` UNIQUE(`project_id`,`interest_category`)
);
--> statement-breakpoint
CREATE TABLE `game_play_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	CONSTRAINT `game_play_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `material_access_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`accessed_at` timestamp DEFAULT (now()),
	CONSTRAINT `material_access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `game_fill_the_blank` MODIFY COLUMN `difficulty` enum('MUDAH','SEDANG','SULIT') NOT NULL;--> statement-breakpoint
ALTER TABLE `game_questions_bank` MODIFY COLUMN `difficulty` enum('MUDAH','SEDANG','SULIT') NOT NULL;--> statement-breakpoint
ALTER TABLE `question_bank` MODIFY COLUMN `difficulty` enum('MUDAH','SEDANG','SULIT','BONUS') NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `started_at` timestamp;--> statement-breakpoint
ALTER TABLE `projects` ADD `completed_at` timestamp;--> statement-breakpoint
ALTER TABLE `bank_soal_ftb` ADD CONSTRAINT `bank_soal_ftb_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bank_soal_quiz` ADD CONSTRAINT `bank_soal_quiz_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bank_soal_tts` ADD CONSTRAINT `bank_soal_tts_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_interests` ADD CONSTRAINT `game_interests_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_play_logs` ADD CONSTRAINT `game_play_logs_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_access_logs` ADD CONSTRAINT `material_access_logs_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `category_idx` ON `game_interests` (`interest_category`);