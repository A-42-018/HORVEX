# Phase starter prompt

Open a **new session** in the `HORVEX` folder, pick the model shown for the next phase in `plan.md`, and paste this. It is written to keep token use low, so free-tier sessions can finish a block B sub-phase.

```text
Start the next HORVEX phase. Keep token use low: read only what this phase needs.

1. Read plan.md (it is short). Take the phase under "Next Up"; if one is "in progress", resume it from its session note. Don't read docs/history.md, and don't re-read CLAUDE.md (it's already loaded).
2. Tell me the phase ID, name and model in one line. If you aren't on that model, stop and tell me to switch.
3. Read only that phase's row: grep -n "^| \*\*<ID>\*\*" roadmap.md. For each ref, find its line range with grep -n "^##" roadmap.md and read just that range (for "§6.1 #3", read only item 3).
4. If the row has a 👤 You step I haven't done, give me exact steps and wait.
5. Open only the files you will change or directly use. Search with grep instead of reading whole folders. Show a short task list, then build only this phase, following CLAUDE.md.
6. Verify once at the end: npm run build and npm run lint. In the browser check the affected page at desktop and 375px: use read_page and the console log, and take at most one screenshot per width.
7. Update plan.md: the phase's status row, "Next Up", and a 3–5 line session note (keep only the 5 newest notes; move older ones to docs/history.md). Commit as "Phase <ID>: <name>".
8. Finish in a few lines: what was done, what I should check, and the next phase with its model.

If usage is running low before the phase is complete, stop at a working state, mark it "in progress" in plan.md with what's done and what's left, and commit as "WIP Phase <ID>".
```
