---
name: write-tech-blog-post
description: Research, write, revise, and verify technical blog posts for this Jekyll repository using its live `_docs/rule.md` instructions. Use when Codex is asked to create a new `_posts` article, update an existing technical post, explain a technology with practical code, prepare a comparison or migration guide, or validate a post's front matter, Markdown, sources, build, and responsive rendering.
---

# Write Tech Blog Post

Create accurate, approachable technical posts that match this repository's format and tone. Keep changes limited to the requested post and assets it directly needs.

## Establish the project rules

1. Locate the repository root containing `_docs/rule.md` and `_posts`.
2. Read `_docs/rule.md` completely before planning or editing. Treat it as authoritative when it differs from this workflow.
3. Confirm whether the request is for a new post or an edit. Do not rename an existing post unless the user explicitly requests a URL change.
4. State the assumptions, intended audience, scope, and verifiable success criteria before writing. Ask only when an unresolved choice would materially change the result.

Stop and explain the missing prerequisite if `_docs/rule.md` cannot be found. Do not silently substitute generic blog conventions.

## Inspect before writing

1. Read one or two recent, relevant posts to match the repository's tone and formatting. Do not copy their factual claims without verification.
2. Preserve unrelated working-tree changes and avoid editing adjacent files.

## Research and plan

1. Verify version-sensitive, niche, security, performance, legal, or operational claims with current primary sources. Prefer official documentation, release notes, specifications, and source repositories.
2. Record an explicit as-of date when describing the latest version or current behavior.
3. Distinguish confirmed facts from inference. Do not invent links, APIs, version numbers, benchmarks, or quotations.
4. Select the smallest suitable structure from `_docs/rule.md`: concept, implementation, comparison, or operations.
5. Plan sections around reader questions rather than a feature inventory. Include practical perspectives from at least two relevant areas such as configuration, code, tests, operations, or failure handling.
6. Prefer Kotlin for backend examples unless another language is more natural or the user requests it.

## Create or edit the post

### New post

1. Choose a specific title without hype and a meaningful lowercase English slug.
2. Run the repository generator from the project root:

   ```bash
   ruby scripts/new_post.rb "Post title" meaningful-slug
   ```

3. Use the generated path and timestamp. Do not recreate its front matter manually or overwrite an existing file.
4. Fill categories, tags, and an optional concise description before writing the body.

### Existing post

1. Preserve its filename, publication date, and URL-related metadata unless the user asks to change them.
2. Make surgical edits that trace directly to the request.
3. Remove only imports, examples, links, or sections made obsolete by the current edit. Mention unrelated outdated content instead of rewriting it.

### Body

1. Follow the summary, heading, code, table, diagram, conclusion, and reference rules in `_docs/rule.md`.
2. Explain unfamiliar concepts in the order `definition → reason → use → caveat`.
3. Keep examples internally consistent: dependencies, imports, configuration, commands, expected results, and tests must describe the same version and execution flow.
4. Explain before each code block what it demonstrates and after it what should change in production.
5. Include limitations, common mistakes, and when not to use the approach.
6. Avoid filler written only to meet a length target. Expand with concrete examples, tests, tradeoffs, and operational guidance instead.
7. Use `apply_patch` for repository edits.

## Verify the result

Perform checks in proportion to the post's risk. Do not report a check as passed unless it ran successfully.

1. Re-read the post and compare it against every applicable requirement in `_docs/rule.md`.
2. Confirm front matter has no duplicate keys and contains the required title, date, categories, and tags.
3. Confirm every fenced code block has a language, every fence closes, headings use the intended levels, and the body does not duplicate the title or automatic table of contents.
4. Check that prose and code agree. When practical, compile or execute important samples in a disposable location without adding test artifacts to the repository.
5. Open every reference link or otherwise verify that it resolves to the cited authoritative content.
6. Run `bundle exec jekyll build` when the repository dependencies are available. Treat unrelated pre-existing warnings separately from failures caused by the post.
7. If the post contains Mermaid, tables, wide code, or layout-sensitive content, render the local post in a browser. Verify desktop and mobile widths, Mermaid SVG output, table scrolling, code overflow, heading order, and the absence of page-level horizontal overflow.
8. Inspect the final diff or untracked file, confirm only intended files changed, and leave unrelated user changes untouched.

## Hand off

Lead with the completed outcome. Link the post using its absolute local path, summarize the major sections, list the checks that passed, and disclose any check that could not run or any unrelated warning that remains. Do not stage, commit, publish, or push unless the user explicitly requests it.
