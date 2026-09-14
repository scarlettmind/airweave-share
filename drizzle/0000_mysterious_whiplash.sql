CREATE TABLE `share_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event` text NOT NULL,
	`language` text NOT NULL,
	`platform` text NOT NULL,
	`store` text NOT NULL,
	`created_at` text NOT NULL
);
