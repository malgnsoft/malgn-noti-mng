CREATE TABLE `wbs_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`step` integer NOT NULL,
	`grp` text NOT NULL,
	`name` text NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`start` text,
	`end` text,
	`progress` integer DEFAULT 0 NOT NULL,
	`note` text,
	`href` text,
	`sort` integer DEFAULT 0 NOT NULL
);
