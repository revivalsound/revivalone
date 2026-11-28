# Post interaction fixture

Run `node tests/serve-post-ui.mjs`, then open `http://localhost:5194/tests/post-ui.html`.
This uses an in-memory service, not the real Supabase project. No real accounts,
posts, files, likes, or comments are modified. The fixture is not a production entry point.

Check desktop and narrow layouts:

- Add portrait/landscape photos and a browser-supported video. Confirm Original shows the entire frame.
- Preview, crop, rotate, adjust brightness/contrast, reset, cancel, and save. Reopen to verify saved settings.
- For video, play/pause, seek, set a playback range, and mute. Publish and verify the same edits remain visible.
- Type a paragraph, choose Serif/Display without selecting text, and confirm visible changes without losing text or the caret. Repeat with a selected phrase and text size.
- Publish, like/unlike, add/delete a comment, and navigate from a card's comment action.
- Check regular and compact cards: independent actions remain at the left footer and do not open the card-wide link.
- Test sharing on a real device; the native share sheet is platform-dependent.

For the real app, apply `supabase/posts-rich.sql` and `supabase/post-engagement.sql`
in the project's Supabase SQL editor. Verify with two real accounts that likes and
comments survive refresh and that members cannot delete another member's comments.

Unit checks: `node --test tests/*.test.mjs`.
