# Phase starter prompt

Open a **new session** in the `HORVEX` folder, pick the model shown for the next phase in `plan.md`, and paste this:

```text
Start the next HORVEX phase.

1. Read plan.md. Take the first phase whose status isn't "done". If one is "in progress", resume it from its session notes.
2. Tell me the phase ID, name and assigned model. If you aren't running on that model, stop and tell me to switch before writing any code.
3. Read that phase's row in roadmap.md §14 and only the roadmap sections it references.
4. If the phase has a 👤 You step I haven't done yet, give me exact step-by-step instructions and wait for me.
5. Show a short task list, then build only this phase, following CLAUDE.md.
6. Verify: npm run build, npm run lint, and check the affected pages in the browser at desktop and 375px mobile with no console errors.
7. Update plan.md (status, session note, decisions) and commit as "Phase <ID>: <name>".
8. Finish by telling me what was done, anything I need to check, and the next phase with its model.

If usage is running low before the phase is complete, stop at a working state, mark it "in progress" in plan.md with what's done and what's left, and commit as "WIP Phase <ID>".
```
