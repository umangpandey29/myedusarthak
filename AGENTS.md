# Project implementation rules

- Put client-called privileged operations in client-safe `*.functions.ts` modules, protect them with `requireSupabaseAuth`, and dynamically import the server admin client inside the authorized handler; this keeps secrets out of browser bundles and scopes destructive actions to the verified user.