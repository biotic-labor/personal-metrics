CREATE TABLE `favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` integer NOT NULL,
	`user_id` text,
	`household_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_favorites_user` ON `favorites` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_favorites_household` ON `favorites` (`household_id`);--> statement-breakpoint
CREATE INDEX `idx_favorites_recipe` ON `favorites` (`recipe_id`);--> statement-breakpoint
CREATE TABLE `household_allergens` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`allergen_key` text NOT NULL,
	`keywords` text NOT NULL,
	`severity` text DEFAULT 'exclude' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_household_allergens_household` ON `household_allergens` (`household_id`);--> statement-breakpoint
CREATE TABLE `household_members` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_household_members_household` ON `household_members` (`household_id`);--> statement-breakpoint
CREATE INDEX `idx_household_members_user` ON `household_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `households` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meal_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`date` text NOT NULL,
	`meal_slot` text NOT NULL,
	`recipe_id` integer NOT NULL,
	`servings` integer,
	`notes` text,
	`created_by` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_meal_plans_household_date` ON `meal_plans` (`household_id`,`date`);--> statement-breakpoint
CREATE TABLE `pantry_items` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`ingredient_name` text NOT NULL,
	`quantity` real,
	`unit` text,
	`expiry_date` text,
	`category` text,
	`added_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_pantry_household` ON `pantry_items` (`household_id`);--> statement-breakpoint
CREATE INDEX `idx_pantry_ingredient` ON `pantry_items` (`ingredient_name`);--> statement-breakpoint
CREATE INDEX `idx_pantry_expiry` ON `pantry_items` (`expiry_date`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`ingredients_raw` text NOT NULL,
	`ingredients_parsed` text,
	`instructions` text NOT NULL,
	`cuisine` text,
	`meal_type` text,
	`prep_time_minutes` integer,
	`cook_time_minutes` integer,
	`total_time_minutes` integer,
	`servings` integer,
	`difficulty` text,
	`dietary_tags` text,
	`allergen_flags` text,
	`normalized_ingredients` text,
	`source_url` text,
	`source_dataset` text,
	`image_url` text,
	`rating` real,
	`rating_count` integer,
	`imported_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_recipes_cuisine` ON `recipes` (`cuisine`);--> statement-breakpoint
CREATE INDEX `idx_recipes_meal_type` ON `recipes` (`meal_type`);--> statement-breakpoint
CREATE INDEX `idx_recipes_difficulty` ON `recipes` (`difficulty`);--> statement-breakpoint
CREATE INDEX `idx_recipes_total_time` ON `recipes` (`total_time_minutes`);--> statement-breakpoint
CREATE INDEX `idx_recipes_rating` ON `recipes` (`rating`);--> statement-breakpoint
CREATE INDEX `idx_recipes_source_dataset` ON `recipes` (`source_dataset`);--> statement-breakpoint
CREATE TABLE `shopping_list_items` (
	`id` text PRIMARY KEY NOT NULL,
	`shopping_list_id` text NOT NULL,
	`ingredient_name` text NOT NULL,
	`quantity` real,
	`unit` text,
	`category` text,
	`checked` integer DEFAULT false NOT NULL,
	`from_recipe_id` integer,
	`added_manually` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`shopping_list_id`) REFERENCES `shopping_lists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_shopping_list_items_list` ON `shopping_list_items` (`shopping_list_id`);--> statement-breakpoint
CREATE TABLE `shopping_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`name` text NOT NULL,
	`store_mode` text DEFAULT 'standard' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`meal_plan_start_date` text,
	`meal_plan_end_date` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_shopping_lists_household` ON `shopping_lists` (`household_id`);