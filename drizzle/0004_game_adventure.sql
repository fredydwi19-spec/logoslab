CREATE TABLE `game_adventure_scenes` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`scene_key` varchar(20) NOT NULL,
	`scene_type` enum('STORY','CHALLENGE','ENDING') NOT NULL,
	`is_start` boolean NOT NULL DEFAULT false,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`choices` text,
	`question` text,
	`option_a` varchar(255),
	`option_b` varchar(255),
	`option_c` varchar(255),
	`option_d` varchar(255),
	`correct_answer` enum('A','B','C','D'),
	`explanation` text,
	`next_correct` varchar(20),
	`next_wrong` varchar(20),
	`ending_score` int,
	`verse` text,
	`reflection` text,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `game_adventure_scenes_id` PRIMARY KEY(`id`),
	CONSTRAINT `adventure_scene_unq` UNIQUE(`project_id`,`level`,`scene_key`)
);
--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `game_type` enum('QUIZ','FILL_THE_BLANK','WORD_SEARCH','CROSSWORD','ADVENTURE');--> statement-breakpoint
ALTER TABLE `game_adventure_scenes` ADD CONSTRAINT `game_adventure_scenes_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;