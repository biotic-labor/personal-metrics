CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`cover_url` text,
	`status` text DEFAULT 'backlog' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`started_at` text,
	`finished_at` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `habit_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`date` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`icon` text NOT NULL,
	`target_per_month` integer DEFAULT 10 NOT NULL,
	`sort_order` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `health_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`steps` integer,
	`calories` integer,
	`resting_hr` integer,
	`workout_minutes` integer,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);