CREATE TABLE `board_meta` (
	`id` integer PRIMARY KEY NOT NULL,
	`project_name` text NOT NULL,
	`last_updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stage` (
	`id` text PRIMARY KEY NOT NULL,
	`no` text NOT NULL,
	`name` text NOT NULL,
	`emoji` text,
	`summary` text,
	`weight` integer DEFAULT 0 NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`stage_id` text NOT NULL,
	`grp` text,
	`title` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`owner` text,
	`note` text,
	`target_date` text,
	`completion_date` text,
	`href` text,
	`sort` integer DEFAULT 0 NOT NULL
);
