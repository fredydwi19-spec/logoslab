ALTER TABLE `game_crossword` ADD `level` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `game_fill_the_blank` ADD `level` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `game_word_search` ADD `level` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `pass_percentage` int DEFAULT 70 NOT NULL;--> statement-breakpoint
ALTER TABLE `question_bank` ADD `level` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_scores` ADD `level` int DEFAULT 1 NOT NULL;