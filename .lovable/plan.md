# Add secure account deletion

## User-facing changes
- Add a Settings page with a permanent account deletion option.
- Require two deliberate confirmations before deletion and explain that reports and account data will be removed.
- Add Settings to the existing sidebar; leave other screens and behavior unchanged.

## Technical approach
- Add an authenticated server function that verifies the current signed-in user and deletes only that user through the server-only admin client.
- Update the existing `user_roles` foreign key to cascade on account deletion so roles, reports, and profiles are removed consistently.
- Clear the local session and in-memory query cache after a successful deletion, then return to sign-in.
- Validate the preview build and deletion confirmation flow without deleting an existing user's account.
