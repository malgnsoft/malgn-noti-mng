CREATE TABLE `issue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text DEFAULT 'issue' NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`priority` text,
	`author_id` integer NOT NULL,
	`author_name` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
