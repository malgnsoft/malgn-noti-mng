CREATE TABLE `member` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`login_id` text NOT NULL,
	`password_hash` text,
	`name` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'direct' NOT NULL,
	`office_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_login_id_unique` ON `member` (`login_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `member_office_id_unique` ON `member` (`office_id`);