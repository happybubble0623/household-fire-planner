-- Make feedback contact details fully optional.
--
-- The contact form now treats the message as the only required field: a visitor
-- can submit feedback with just a comment and no name, email, or phone. The
-- original table required a name and enforced "at least one of email/phone",
-- both of which now block a comment-only submission. This migration relaxes the
-- schema to match.

-- Allow comment-only submissions (no name).
alter table feedback_messages
  alter column name drop not null;

-- Drop the "email or phone must be provided" guard so contact info is optional.
-- (email and phone are already nullable columns.)
alter table feedback_messages
  drop constraint if exists feedback_contact_required;
