import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const memberProfiles = sqliteTable('member_profiles', {
  uid: text('uid').primaryKey(), displayName: text('display_name').notNull(),
  goal: text('goal').notNull(), interests: text('interests').notNull(),
  completedAt: text('completed_at').notNull(), updatedAt: text('updated_at').notNull(),
});

export const memberShowcases = sqliteTable('member_showcases', {
  uid: text('uid').primaryKey(), content: text('content').notNull(), updatedAt: text('updated_at').notNull(),
});
export const memberAgreements = sqliteTable('member_agreements', { uid:text('uid').primaryKey(), content:text('content').notNull() });
export const policyEvents = sqliteTable('policy_events', { id:text('id').primaryKey(), uid:text('uid').notNull(), content:text('content').notNull(), recordedAt:text('recorded_at').notNull() });
export const sellerApplications = sqliteTable('seller_applications', { uid:text('uid').primaryKey(), content:text('content').notNull(), submittedAt:text('submitted_at').notNull() });
export const supportRequests = sqliteTable('support_requests', { id:text('id').primaryKey(), uid:text('uid').notNull(), topic:text('topic').notNull(), message:text('message').notNull(), createdAt:text('created_at').notNull() });
