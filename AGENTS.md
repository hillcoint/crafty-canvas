<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Frontend-only: all data lives in localStorage via `src/lib/store.ts` (useSyncExternalStore, null on SSR); no backend, because the client requested it.
- Business calculations live in `src/lib/calc.ts`, kept pure so they can be unit-tested and reused across screens.
- Demo seed in `src/lib/seed.ts` uses a deterministic PRNG and is only built lazily (never at module scope) to stay Worker-safe.
- Each trip stores its own `capacidad` so editing a truck never changes history.
- Admin key is a visible constant in `src/routes/admin.tsx` (UI gate only, per spec).
