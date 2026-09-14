import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const events = sqliteTable('share_events', {id:integer('id').primaryKey({autoIncrement:true}),event:text('event').notNull(),language:text('language').notNull(),platform:text('platform').notNull(),store:text('store').notNull(),createdAt:text('created_at').notNull()});
