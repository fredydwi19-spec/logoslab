CREATE TABLE `game_fill_the_blank` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`question_bank_id` bigint unsigned,
	`full_text` text NOT NULL,
	`answers` text NOT NULL,
	`difficulty` enum('RENDAH','SEDANG','SULIT') NOT NULL,
	`score` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_fill_the_blank_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_questions_bank` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100),
	`difficulty` enum('RENDAH','SEDANG','SULIT') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_questions_bank_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`message` text NOT NULL,
	`project_id` bigint unsigned,
	`is_read` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `question_bank` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`question` text NOT NULL,
	`option_a` varchar(255) NOT NULL,
	`option_b` varchar(255) NOT NULL,
	`option_c` varchar(255) NOT NULL,
	`option_d` varchar(255) NOT NULL,
	`correct_answer` enum('A','B','C','D') NOT NULL,
	`difficulty` enum('RENDAH','SEDANG','SULIT','BONUS') NOT NULL,
	`score` int NOT NULL,
	`explanation` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `question_bank_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews_history` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`reviewer_id` bigint unsigned NOT NULL,
	`feedback` text NOT NULL,
	`status_given` varchar(50) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `reviews_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `status` enum('DRAFT','REVIEW_PAKAR','REVISI_PAKAR','ACCEPTED_PAKAR','REVIEW_KETUA','REVISI_KETUA','PUBLISHED') NOT NULL DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE `projects` ADD `description` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `instructions` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `game_type` enum('QUIZ','FILL_THE_BLANK','WORD_SEARCH','CROSSWORD');--> statement-breakpoint
ALTER TABLE `projects` ADD `category` varchar(100);--> statement-breakpoint
ALTER TABLE `projects` ADD `revision_count` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `projects` ADD `deadline` timestamp;--> statement-breakpoint
ALTER TABLE `projects` ADD `thumbnail_url` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `has_onboarded` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `interests` varchar(500);--> statement-breakpoint
ALTER TABLE `game_fill_the_blank` ADD CONSTRAINT `game_fill_the_blank_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_fill_the_blank` ADD CONSTRAINT `game_fill_the_blank_question_bank_id_game_questions_bank_id_fk` FOREIGN KEY (`question_bank_id`) REFERENCES `game_questions_bank`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_bank` ADD CONSTRAINT `question_bank_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews_history` ADD CONSTRAINT `reviews_history_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews_history` ADD CONSTRAINT `reviews_history_reviewer_id_users_id_fk` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;