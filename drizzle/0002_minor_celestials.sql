CREATE TABLE `member_agreements` (
	`uid` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `policy_events` (
	`id` text PRIMARY KEY NOT NULL,
	`uid` text NOT NULL,
	`content` text NOT NULL,
	`recorded_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seller_applications` (
	`uid` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`submitted_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `support_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`uid` text NOT NULL,
	`topic` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
