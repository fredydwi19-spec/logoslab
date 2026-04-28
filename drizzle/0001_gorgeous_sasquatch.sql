ALTER TABLE `users` MODIFY COLUMN `name` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;