/**
 * Migration: Add recurrence fields to posts table for recurring events
 *
 * Adds:
 * - recurrence_rule: TEXT - iCal RRULE format string (e.g., "FREQ=WEEKLY;INTERVAL=2")
 * - recurrence_end_date: TIMESTAMP - Optional end date for recurring series
 *
 * Both fields are nullable to maintain backward compatibility with existing events.
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('posts', table => {
    table.text('recurrence_rule')
    table.timestamp('recurrence_end_date')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('recurrence_rule')
    table.dropColumn('recurrence_end_date')
  })
}
