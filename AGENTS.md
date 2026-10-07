# Project Instructions

## Automatic commits

- Create a local commit after completing a coherent, functional change, such as a feature, bug fix, refactor, test improvement, or documentation update.
- You are authorized to create local commits without asking for confirmation, subject to the environment's permission requirements.
- Group related changes into one commit and separate independent changes. Do not commit every small edit or create empty commits.
- Before committing, review the diff and run the available checks relevant to the change. Documentation-only changes require a content and diff review, not application tests.
- Do not commit incomplete work or changes with failing relevant checks. If verification is blocked, report the limitation before committing.
- Include only changes you made for the current task. Preserve the user's preexisting changes, including staged changes, and do not include them in your commits.
- Stage specific files or hunks and inspect the staged diff before committing. Avoid broad staging commands that could include unrelated work.
- Do not commit secrets, temporary files, or unnecessary generated artifacts.
- Do not push, amend existing commits, or rewrite Git history unless explicitly requested.
- In the final response, report the hashes and a brief summary of the commits created.

## Commit messages

- Write all commit messages, including optional bodies and footers, in English.
- Use Conventional Commits with a matching gitmoji in the description:
  `<type>[optional scope]: <gitmoji> <short imperative summary>`.
- Use an actual emoji character, not a shortcode such as `:sparkles:`.
- Choose the type and gitmoji that best describe the change. Common examples:
  - `feat: ✨ add game search filters`
  - `fix: 🐛 handle empty search results`
  - `refactor: ♻️ extract shared game card logic`
  - `docs: 📝 document local setup`
  - `test: ✅ cover pagination edge cases`
  - `chore: 🔧 update development configuration`
- Keep the summary concise and specific. Add a body when the motivation or important consequences need explanation.
