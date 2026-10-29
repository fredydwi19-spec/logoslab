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
CREATE TABLE `game_fill_the_blank` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`question_bank_id` bigint unsigned,
	`full_text` text NOT NULL,
	`answers` text NOT NULL,
	`difficulty` enum('MUDAH','SEDANG','SULIT') NOT NULL,
	`score` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_fill_the_blank_id` PRIMARY KEY(`id`)
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
	`user_id` bigint unsigned,
	`project_id` bigint unsigned NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	CONSTRAINT `game_play_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_questions_bank` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100),
	`difficulty` enum('MUDAH','SEDANG','SULIT') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_questions_bank_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `material_access_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`accessed_at` timestamp DEFAULT (now()),
	CONSTRAINT `material_access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `material_glossary` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`word` varchar(255) NOT NULL,
	`definition` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `material_glossary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `material_sections` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`sub_title` varchar(255),
	`content` longtext NOT NULL,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `material_sections_id` PRIMARY KEY(`id`)
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
CREATE TABLE `project_chats` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`sender_id` bigint unsigned NOT NULL,
	`context_type` enum('GENERAL','QUESTION') NOT NULL DEFAULT 'GENERAL',
	`context_target_id` bigint unsigned,
	`message` text NOT NULL,
	`is_actionable` boolean DEFAULT false,
	`is_resolved` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `project_chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`instructions` text,
	`game_type` enum('QUIZ','FILL_THE_BLANK','WORD_SEARCH','CROSSWORD'),
	`type` enum('GAME','MATERI') NOT NULL,
	`materi_type` enum('TEKS','VIDEO','MANUAL'),
	`category` varchar(100),
	`status` enum('DRAFT','REVIEW_PAKAR','REVISI_PAKAR','ACCEPTED_PAKAR','REVIEW_KETUA','REVISI_KETUA','PUBLISHED','UNPUBLISHED') NOT NULL DEFAULT 'DRAFT',
	`revision_count` int DEFAULT 0,
	`started_at` timestamp,
	`completed_at` timestamp,
	`deadline` timestamp,
	`thumbnail_url` longtext,
	`id_pembuat` bigint unsigned NOT NULL,
	`id_pakar` bigint unsigned,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
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
	`difficulty` enum('MUDAH','SEDANG','SULIT','BONUS') NOT NULL,
	`score` int NOT NULL,
	`explanation` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `question_bank_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_duels` (
	`id` varchar(36) NOT NULL,
	`challenger_id` bigint unsigned NOT NULL,
	`opponent_id` bigint unsigned,
	`quiz_id` bigint unsigned NOT NULL,
	`question_ids` text NOT NULL,
	`challenger_score` int DEFAULT 0,
	`challenger_time_sec` int DEFAULT 0,
	`opponent_score` int,
	`opponent_time_sec` int,
	`status` enum('WAITING_OPPONENT','COMPLETED') NOT NULL DEFAULT 'WAITING_OPPONENT',
	`winner_id` bigint unsigned,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `quiz_duels_id` PRIMARY KEY(`id`)
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
CREATE TABLE `user_journals` (
	`id` varchar(36) NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`reference_type` enum('QUIZ','MATERIAL') NOT NULL,
	`reference_id` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`reflection_text` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_journals_id` PRIMARY KEY(`id`)
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
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` varchar(100),
	`password` varchar(255),
	`google_id` varchar(255),
	`role` enum('KETUA_TIM','PEMBUAT_GAME','PEMBUAT_MATERI','PAKAR','USER') NOT NULL DEFAULT 'USER',
	`is_verified` boolean DEFAULT false,
	`profile_picture` varchar(255),
	`avatar_url` text,
	`has_onboarded` boolean DEFAULT false,
	`interests` varchar(500),
	`total_xp` int DEFAULT 0,
	`current_streak` int DEFAULT 0,
	`last_active_at` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_google_id_unique` UNIQUE(`google_id`)
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `verification_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `verification_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `achievements` ADD CONSTRAINT `achievements_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `achievements` ADD CONSTRAINT `achievements_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bank_soal_ftb` ADD CONSTRAINT `bank_soal_ftb_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bank_soal_quiz` ADD CONSTRAINT `bank_soal_quiz_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bank_soal_tts` ADD CONSTRAINT `bank_soal_tts_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_crossword` ADD CONSTRAINT `game_crossword_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_fill_the_blank` ADD CONSTRAINT `game_fill_the_blank_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_fill_the_blank` ADD CONSTRAINT `game_fill_the_blank_question_bank_id_game_questions_bank_id_fk` FOREIGN KEY (`question_bank_id`) REFERENCES `game_questions_bank`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_interests` ADD CONSTRAINT `game_interests_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_play_logs` ADD CONSTRAINT `game_play_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_play_logs` ADD CONSTRAINT `game_play_logs_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `game_word_search` ADD CONSTRAINT `game_word_search_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materi_contents` ADD CONSTRAINT `materi_contents_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materi_read_progress` ADD CONSTRAINT `materi_read_progress_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materi_read_progress` ADD CONSTRAINT `materi_read_progress_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_access_logs` ADD CONSTRAINT `material_access_logs_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_glossary` ADD CONSTRAINT `material_glossary_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_sections` ADD CONSTRAINT `material_sections_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_chats` ADD CONSTRAINT `project_chats_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_chats` ADD CONSTRAINT `project_chats_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_id_pembuat_users_id_fk` FOREIGN KEY (`id_pembuat`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_id_pakar_users_id_fk` FOREIGN KEY (`id_pakar`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_bank` ADD CONSTRAINT `question_bank_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_duels` ADD CONSTRAINT `quiz_duels_challenger_id_users_id_fk` FOREIGN KEY (`challenger_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_duels` ADD CONSTRAINT `quiz_duels_opponent_id_users_id_fk` FOREIGN KEY (`opponent_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_duels` ADD CONSTRAINT `quiz_duels_quiz_id_projects_id_fk` FOREIGN KEY (`quiz_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_duels` ADD CONSTRAINT `quiz_duels_winner_id_users_id_fk` FOREIGN KEY (`winner_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews_history` ADD CONSTRAINT `reviews_history_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews_history` ADD CONSTRAINT `reviews_history_reviewer_id_users_id_fk` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_journals` ADD CONSTRAINT `user_journals_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_journals` ADD CONSTRAINT `user_journals_reference_id_projects_id_fk` FOREIGN KEY (`reference_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_scores` ADD CONSTRAINT `user_scores_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_scores` ADD CONSTRAINT `user_scores_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verification_tokens` ADD CONSTRAINT `verification_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `category_idx` ON `game_interests` (`interest_category`);