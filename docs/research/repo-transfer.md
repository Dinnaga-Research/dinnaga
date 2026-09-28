# Moving `weytani/dinnaga` into Dinnaga-Research: what changes, what breaks, and the checklists

As of 2026-09-28. Resolves ticket #13 (research). Nothing described here has been run: no transfer, no settings change, no writes. Every probe below was a read-only `gh api` GET, a file read, or a public-docs fetch.

## Answer

**The move is safe.** Almost nothing on the repo depends on its owner, and everything the wayfinder map needs comes along with it: issues, comments, sub-issues, the 21 same-repo blocking edges, labels, and assignees. The assignees stay because the operator is an org owner. Nothing can be lost in the move because the repo has no secrets, variables, webhooks, deploy keys, rulesets, branch protection, releases, stars, or Pages site. `ci.yml` needs no secrets, and Actions minutes are free on a public repo. The "Dinnaga Refresh" Project can only be linked to the repo *after* the move, because a Project can only be listed in a repo that has the same owner.

**Two things don't carry over cleanly:**
1. **The org's PR review gate cannot run on this repo as it is installed today.** `dinnaga-review` is a private action, and GitHub only lets private repositories use a private action.
2. **The cross-owner dependency** (`weytani/arxiv-prospector#17` blocked by #18) should survive, but GitHub doesn't document what happens to it. Check it after the move.

**Around the move:** get the local clone back to a clean `main`, stay clear of the Saturday 08:30 publish, and snapshot the issue graph first. Then run one `POST`, then `git remote set-url`, then diff the snapshot, then update 4 memory files. Don't ever create or fork anything at `weytani/dinnaga` afterwards (see F1.4).

---

## Findings

Legend: **[Docs]** = stated by GitHub Docs or the changelog (linked). **[Observed]** = read-only probe run on 2026-09-28. **[Undocumented]** = the docs don't say, so this is inferred and must be verified after the move.

### F1. What survives a transfer

Source for everything in F1 unless noted: [Transferring a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository).

| Item | Current state [Observed] | After the move |
|---|---|---|
| Issues, PRs, comments | 20 issues (#6–#25) + 5 merged PRs (#1–#5) | **Transfer.** [Docs] "its issues, pull requests, wiki, stars, and watchers are also transferred." |
| Git history, contributions | 121 commits on `main` | **Preserved, unchanged.** [Docs] "Git information about commits, including contributions, is preserved." |
| Sub-issues | #6 parent of 19 sub-issues (#7–#25), all in this repo | **Move with the issues** [Undocumented, but low risk]. The transfer article doesn't mention sub-issues. The whole hierarchy is inside one repo, so no relationship crosses the move boundary. Note: the REST API requires a sub-issue to "belong to the same repository owner as the parent issue" ([Docs: sub-issues REST](https://docs.github.com/en/rest/issues/sub-issues)). After the move, `weytani/*` issues therefore can't be made sub-issues of Dinnaga-Research issues through the API. |
| Issue dependencies, same repo | 21 "blocked by" edges among #13–#25 | **Expected to survive** [Undocumented]. Dependencies are keyed by issue `id`, not URL ([Docs: dependencies REST](https://docs.github.com/en/rest/issues/issue-dependencies): "`issue_id` … The id of the issue that blocks"). Issue IDs don't change when a repo transfers. Verify with the snapshot diff (post-move step 4). |
| Issue dependency, cross-repo | `weytani/arxiv-prospector#17` (PRIVATE, stays with the user account) blocked by #18 | **Should survive, but check** [Undocumented]. Unlike sub-issues, the REST docs state no same-owner rule for dependencies, and the [changelog](https://github.blog/changelog/2025-08-21-dependencies-on-issues/) and [how-to](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies) are silent on cross-owner edges. This one edge already crosses a visibility boundary (private → public) and will now also cross owners. Re-add command if it's lost: post-move step 5. |
| Labels | 14 (9 defaults + 5 `wayfinder:*`) | **Move with the repo** [Undocumented]: labels aren't in the article's list, but they are repository-scoped objects. Verify the count (14). |
| Milestones | 0 today | Nothing to lose. The 5 milestones get created after the move. |
| Assignees | #8–#13 assigned to the operator | **Kept.** [Docs] "When you transfer a repository from a personal account to an organization, issues assigned to members in the organization remain intact, and all other issue assignees are cleared. Only owners in the organization are allowed to create new issue assignments." The operator's org role is `admin` (owner) [Observed]. |
| Stars / watchers / forks | 0 / 0 / 0 | [Docs] Stars and watchers transfer (there are none). |
| Actions secrets / variables | none (repo); none visible at env level | [Docs] "secrets … will remain associated." Nothing to carry. |
| Webhooks, deploy keys, autolinks | none | [Docs] "webhooks, services, secrets, or deploy keys … will remain associated." Nothing to carry. |
| Branch protection / rulesets | `main` unprotected; 0 rulesets | Nothing to lose. Newly *available*: branch protection on public repos in a Free org ([Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)). See decision Q3. |
| Releases / tags / packages | none | Nothing to carry. |
| GitHub Pages | **Disabled.** `GET …/pages` and `…/pages/builds` → 404. DNS: apex → `76.76.21.21`, `www` → `cname.vercel-dns.com` (Vercel) | [Docs] "we don't redirect GitHub Pages associated with the repository." That doesn't matter here. No DNS record points at GitHub, so the article's domain-takeover warning doesn't apply. Leftover: a `github-pages` **environment** plus 6 old deployment records (last one 2026-07-02). They move with the repo and are harmless (optional cleanup, Q6). |
| Wiki / Discussions | Wiki enabled but empty (no wiki git repo); Discussions off | Nothing to carry. |
| Secret scanning + push protection | enabled | [Undocumented] Should persist. Verify (post-move step 9). |
| Repo ID | `1243102374` | Unchanged, so it's the clean post-move check (`GET /repositories/1243102374`). |

**F1.1 Collaborators and permissions.** [Docs] "The original owner of the repository is added as a collaborator on the transferred repository," and "the organization's default repository permission settings and default membership privileges will apply to the transferred repository." The org's base permission is `read`, it has 2 members, 0 teams and 0 outside collaborators [Observed]. On a public repo, `read` grants nothing new. The other org member does count as an org member for the fork-PR approval policy.

**F1.2 No acceptance step.** [Docs] Only transfers to a *personal* account need the new owner to accept by email. Moving into an org needs "permission to create a repository in the target organization." The operator is an org admin, and the org allows members to create public repos [Observed]. [Docs: REST](https://docs.github.com/en/rest/repos/repos#transfer-a-repository): the call returns **202** and "the transfer will continue asynchronously."

**F1.3 Redirects.** [Docs] "All links to the previous repository location are automatically redirected … `git clone`, `git fetch`, or `git push` … will redirect … we strongly recommend updating any existing local clones." [Observed] I probed three repos that were transferred long ago (`twitter/bootstrap`, `atom/electron`, `jmorganca/ollama`), unauthenticated:
- These **redirect (301)**: repo root, `/issues` list, `/pull/N`, `/blob/…`, `/commits/…`, plus REST, GraphQL, `gh issue view --repo OLD/…` and `git ls-remote`.
- **Individual issue pages at the old path (`/OLD-OWNER/REPO/issues/N`) returned 404** on all three repos, while the same issue at the new path returned 200. I didn't test a signed-in browser.

**Consequence:** API- and git-based couplings survive on redirects. Hard-coded *issue URLs* (memory files, issue bodies) shouldn't rely on them. Update them.

**F1.4 Name retirement, and the redirect trap.** [Docs] A repo name is retired only if it had "more than 100 clones or more than 100 uses of GitHub Actions in the week prior." This repo had 42 clones in 14 days and about one CI run a week [Observed], so `weytani/dinnaga` will **not** be retired and can be re-created. [Docs] "If you create a new repository or fork at the previous repository location, the redirects to the transferred repository will be permanently deleted." Two ways that could happen: forking `Dinnaga-Research/dinnaga` back into the personal account (the default fork name is `dinnaga`), or running `gh repo create dinnaga`. Either one silently kills every redirect.

### F2. Org Projects (v2) on the Free plan

- **Linking requires the same owner.** [Docs: [Adding your project to a repository](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/adding-your-project-to-a-repository)] "You can only list projects that are owned by the same user or organization that owns the repository." So an org Project can't be linked to the repo until the move happens. This is the actual reason for the move.
- **Issues from outside the org can be added as items.** [Docs: [Adding items](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-items-in-your-project/adding-items-to-your-project)] "you can include issues and pull requests from any organization." The org Project could therefore also carry `weytani/arxiv-prospector#17`.
- **Visibility is two-layered.** [Docs: [Managing visibility](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-visibility-of-your-projects)] A public project is visible to everyone. Separately, "Only people with access to a private repository will be able to view project items from that private repository." So adding the private arxiv-prospector issue to a public Project leaks nothing: it shows as a hidden item. The org already has one public Project (#1) [Observed].
- **Auto-add doesn't backfill.** [Docs: [Adding items automatically](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/adding-items-automatically)] The Free plan gets **1** auto-add workflow, and "existing items matching your criteria will not be added." The 20 existing issues need a bulk `gh project item-add` (post-move step 13).
- **Token:** the `project` scope "Grants read/write access to user and organization projects" ([Docs: OAuth scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)). It's present.

### F3. Actions/CI after the move

- **`ci.yml`** runs lint, test, and build with bun on `pull_request` and on `push` to `main`. It uses `actions/checkout@v4` and `oven-sh/setup-bun@v2` (tag-pinned, not SHA-pinned), declares no `permissions:`, and uses **no secrets**. 26 runs so far, the last 5 green [Observed].
- **Cost:** [Docs: [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)] "free … for public repositories that use standard GitHub-hosted runners."
- **Org Actions policy can't be read with the current token.** `GET orgs/Dinnaga-Research/actions/permissions` returns 403, because it needs `admin:org` [Observed]. [Docs: [Org Actions policy](https://docs.github.com/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization)] An org can "disable GitHub Actions for all repositories … or only allow specific repositories," can allow only in-org actions ("would block … `actions/checkout`"), or can require full-SHA pinning. Any of these would stop `ci.yml`.
  - Indirect evidence: all 4 other org repos report `enabled: true, allowed_actions: all, sha_pinning_required: false` [Observed].
  - Residual risk: if the policy is "selected repositories", a newly arrived repo might not be selected. Check right after the move (post-move step 8).
- **Fork PRs on a now-public org repo:** [Docs: [Repo Actions settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)] "By default, all first-time contributors require approval to run workflows." [Docs: [Events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)] "With the exception of `GITHUB_TOKEN`, secrets are not passed to the runner when a workflow is triggered from a forked repository." `ci.yml` needs neither, so this is fine.

### F4. The org's PR review gate (`dinnaga-review`)

- **How it's installed** [Observed]: one caller workflow per repo, `.github/workflows/dinnaga-review.yml`, present in `project-planning`, `openskill`, `genome` and `rhisearch-center`. It runs `uses: Dinnaga-Research/dinnaga-review@main` with `openai-api-key: ${{ secrets.OPENAI_API_KEY }}`. The key is a **repo-level secret** (e.g. `project-planning` has one; org secrets visible to that repo: 0). The composite action runs the CLI with `--dry-run`, so it's advisory only (`~/code/dinnaga-review/action.yml`).
- **It does not auto-apply.** Nothing at org level (no org rulesets readable, no required workflows) would push it onto a transferred repo. The repo would need the caller workflow and its own secret.
- **It cannot run on a public repo as built today.** The `dinnaga-review` repo is **private**, with Actions access level `organization` [Observed]. [Docs: [Repo Actions settings § Allowing access to components in a private repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)] "Accessible from repositories in the 'ORGANIZATION NAME' organization … **Access is allowed only from private repositories.**" A `uses: Dinnaga-Research/dinnaga-review@main` step in the public `dinnaga` would therefore fail to resolve the action.
- **Making it reachable has two more problems.** On a public repo, fork PRs get no `OPENAI_API_KEY` (F3), and the review would error. Also, `dinnaga-review`'s own design assumes private repos: `~/code/dinnaga-review/docs/design.md:254` says "dinnaga repos are private/internal, sidestepping this; if a public-fork repo is ever added, use `pull_request_target` … and never execute PR head code."
- **Net effect:** the move doesn't break any review that exists today, because `dinnaga` never had the gate. It just can't join the gate without a decision (Q1).

### F5. The org's first public repository: visibility and anonymity

- **Org profile.** The org currently has `public_repos: 0` [Observed]; after the move the repo appears on its Repositories tab. There is no profile README (`.github` repo) today. [Docs: [Org profile](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/customizing-your-organizations-profile)] Non-members see the `public` view. The org is already publicly visible through its public Project #1.
- **Member visibility.** 0 of 2 members are public [Observed]. Membership visibility is set per member ([Docs](https://docs.github.com/en/account-and-profile/how-tos/organization-membership/publicizing-or-hiding-organization-membership)), and the move doesn't change it. It hides little in practice, though. The repo's public [contributors graph](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-a-projects-contributors), commit authors, and issue authorship all show the operator's account.
- **Anonymity.** The move rewrites nothing: the repo's existing public history and authorship stay as they are. What's new is that the org becomes publicly bound to that history, and the old path permanently redirects to the org (F1.3). Public issue text written from now on appears under the org's banner, so the map keeps its "the operator" convention.

### F6. Token scopes

`gh auth status` [Observed]: OAuth token (`gho_…`, keyring) with scopes `gist, project, read:org, repo, workflow`.

| Action | Needs | Have? |
|---|---|---|
| `POST repos/{owner}/{repo}/transfer` | admin on the repo + create-repo rights in the org. `repo` = "full access to public and private repositories" ([Docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)). The endpoint is absent from the [fine-grained PAT permission list](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens), so use this classic OAuth token rather than a fine-grained PAT. | yes |
| Create org Project, link, add items | `project` | yes |
| Create milestones, labels, edit issues/deps | `repo` | yes |
| Push to the org repo over HTTPS | git credential helper = `gh auth git-credential`; the token already has `push: true` on org repos [Observed] | yes |
| Commit workflow files (only if adding `dinnaga-review.yml`) | `workflow` | yes |
| Read org Actions policy / org rulesets | `admin:org` | **no** (optional, Q5) |

---

## Local couplings

The file-by-file inventory of local references to the old path is kept off this public repo, in a local copy of this note. Summary:
- **Git and API couplings survive on redirects.** Still, re-point the clone's `origin` (post-move step 3).
- **One coupling fails regardless of the move:** the Saturday week-in-review publish refuses to run unless the clone is on a clean `main`. An untracked `CONTEXT.md` fails that check today.
- **The Vercel project has no Git link** (`link: null`, deploys come from the CLI), so deploys are unaffected.
- **Hard-coded issue URLs** in local notes and in issue bodies should be rewritten, because old-path issue pages 404 in an anonymous browser (F1.3). Everything else is historical text.

---

## Pre-move checklist

Do these in order. Every command here is read-only except the optional token refresh in step 6. The commands are POSIX/zsh syntax (`snap() {…}`, `$(…)`, `for …; do`). From fish, paste them into `zsh` or wrap them in `bash -c '…'`. The read-only pre-move commands were run against the current repo on 2026-09-28 and returned the values shown. The post-move checks could only be exercised in their pre-move form, since the org path doesn't exist yet. The transfer, set-url, Project and milestone writes were not run.

1. **Gate:** #13 resolved, and the operator explicitly confirms the transfer (the ticket #14 gate).
2. **Timing:** not between Saturday 08:25 and 09:00 local (`week-in-review` publish), and not while an agent is mid-push.
3. **Clean clone on `main`:**
   ```sh
   git -C ~/code/dinnaga status --porcelain   # expect: empty (today: "?? CONTEXT.md", so commit or remove it first)
   git -C ~/code/dinnaga symbolic-ref --short HEAD   # expect: main
   git -C ~/code/dinnaga fetch origin && git -C ~/code/dinnaga status -sb | head -1   # expect: ## main...origin/main (no ahead/behind)
   ```
   Push any `research/*` branches you want kept; branches transfer with the repo.
4. **Snapshot the issue graph** (normalised by repo *name*, so the post-move diff is owner-agnostic):
   ```sh
   snap() { gh api graphql -F owner="$1" -f query='query($owner:String!){repository(owner:$owner,name:"dinnaga"){issues(first:100){nodes{number state assignees(first:5){nodes{login}} labels(first:10){nodes{name}} milestone{title} parent{number} blockedBy(first:50){nodes{number repository{name}}} blocking(first:50){nodes{number repository{name}}}}}}}' --jq '.data.repository.issues.nodes | sort_by(.number) | map({n:.number, s:.state, a:[.assignees.nodes[].login], l:([.labels.nodes[].name]|sort), m:.milestone.title, p:.parent.number, bb:([.blockedBy.nodes[]|"\(.repository.name)#\(.number)"]|sort), bl:([.blocking.nodes[]|"\(.repository.name)#\(.number)"]|sort)})'; }
   snap weytani > /tmp/dinnaga-premove.json
   jq 'length, (map(.bb|length)|add), (map(.bl|length)|add)' /tmp/dinnaga-premove.json   # 2026-09-28: 20, 21, 22
   gh label list --repo weytani/dinnaga --limit 100 --json name --jq length   # 14
   gh issue view 17 --repo weytani/arxiv-prospector --json blockedBy --jq '.blockedBy.nodes[].url'   # .../weytani/dinnaga/issues/18
   ```
5. **Preconditions:**
   ```sh
   gh api user/memberships/orgs/Dinnaga-Research --jq .role   # admin
   gh api repos/Dinnaga-Research/dinnaga --silent; echo $?     # non-zero (404): name is free
   gh auth status 2>&1 | grep scopes                            # includes repo, project
   ```
6. **Optional (Q5), org Actions policy:** either read it in the web UI (Org → Settings → Actions → General), or widen the token and read it by API. The refresh changes token scope, so it's a deliberate choice:
   ```sh
   gh auth refresh -h github.com -s admin:org
   gh api orgs/Dinnaga-Research/actions/permissions   # want enabled_repositories: "all", allowed_actions: "all"
   ```
7. **Confirm there's nothing to lose** (re-check that all are still empty):
   ```sh
   for p in hooks keys actions/secrets actions/variables rulesets releases; do printf '%s ' $p; gh api repos/weytani/dinnaga/$p --jq 'if type=="array" then length else .total_count end'; done   # all 0
   gh api repos/weytani/dinnaga/pages --silent; echo $?   # non-zero (404)
   ```
8. **Decide Q1–Q4** (below) before running #14, so the Project, milestones and any workflow file are created once.

## Transfer command (documented, NOT run)

```sh
gh api --method POST repos/weytani/dinnaga/transfer -f new_owner=Dinnaga-Research
# 202 Accepted; the transfer finishes asynchronously. Poll until the owner flips:
gh api repositories/1243102374 --jq '.full_name'   # repeat until: Dinnaga-Research/dinnaga
```

Equivalent UI path: Repo → Settings → Danger Zone → Transfer → "Select one of my organizations" → Dinnaga-Research ([Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)). Don't pass `new_name`; keep `dinnaga`.

## Post-move checklist (each item has its verification)

1. **Moved and still public:** `gh api repositories/1243102374 --jq '[.full_name,.visibility]|@tsv'` → `Dinnaga-Research/dinnaga	public`.
2. **Redirects are live:**
   - `gh api repos/weytani/dinnaga --jq .full_name` → `Dinnaga-Research/dinnaga`
   - `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://github.com/weytani/dinnaga` → `301 https://github.com/Dinnaga-Research/dinnaga`
   - `git ls-remote https://github.com/weytani/dinnaga.git HEAD` gives the same SHA as `git ls-remote https://github.com/Dinnaga-Research/dinnaga.git HEAD`.
3. **Re-point the clone:**
   - `git -C ~/code/dinnaga remote set-url origin https://github.com/Dinnaga-Research/dinnaga.git`
   - Verify: `git -C ~/code/dinnaga fetch origin && git -C ~/code/dinnaga push --dry-run origin main` (expect "Everything up-to-date").
4. **Issue graph is intact:** `snap Dinnaga-Research > /tmp/dinnaga-postmove.json && diff /tmp/dinnaga-premove.json /tmp/dinnaga-postmove.json && echo IDENTICAL`. This covers sub-issues, the 21 same-repo edges, labels per issue and assignees. The only acceptable differences are ticket states you changed on purpose in between.
5. **Cross-owner dependency:** `gh issue view 17 --repo weytani/arxiv-prospector --json blockedBy --jq '.blockedBy.nodes[].url'` → `https://github.com/Dinnaga-Research/dinnaga/issues/18`.
   - If it's missing, re-add it: `gh issue edit 17 --repo weytani/arxiv-prospector --add-blocked-by https://github.com/Dinnaga-Research/dinnaga/issues/18`
   - Then confirm the reverse side: `gh issue view 18 --repo Dinnaga-Research/dinnaga --json blocking --jq '.blocking.nodes[].url'`.
6. **Labels:** `gh label list --repo Dinnaga-Research/dinnaga --limit 100 --json name --jq length` → `14`.
7. **Assignees:** `gh issue list --repo Dinnaga-Research/dinnaga --assignee @me --state all --json number --jq 'map(.number)|sort'` → `[8,9,10,11,12,13]` (less any you reassigned).
8. **Actions enabled:**
   - `gh api repos/Dinnaga-Research/dinnaga/actions/permissions --jq '[.enabled,.allowed_actions,.sha_pinning_required]'` → `[true,"all",false]`.
   - After the next push to `main`: `gh run list --repo Dinnaga-Research/dinnaga --limit 1` shows CI `success`. `ci.yml` has no `workflow_dispatch`, so a push or PR is the trigger.
9. **Security settings carried:** `gh api repos/Dinnaga-Research/dinnaga --jq '.security_and_analysis|{s:.secret_scanning.status,p:.secret_scanning_push_protection.status}'` → both `enabled`.
10. **Nothing new attached / Pages still off:** rerun pre-move step 7 against `repos/Dinnaga-Research/dinnaga`. All should be 0, and `pages` should be 404.
11. **Org view:**
    - `gh api orgs/Dinnaga-Research --jq .public_repos` → `1`
    - `gh api repos/Dinnaga-Research/dinnaga/collaborators --jq '.[].login'` lists the operator.
12. **Create the Project and link it** (ticket #14; `project` scope):
    ```sh
    N=$(gh project create --owner Dinnaga-Research --title "Dinnaga Refresh" --format json --jq .number)
    gh project link "$N" --owner Dinnaga-Research --repo dinnaga
    gh api graphql -f query="query{organization(login:\"Dinnaga-Research\"){projectV2(number:$N){title public repositories(first:5){nodes{nameWithOwner}}}}}"
    # expect repositories → Dinnaga-Research/dinnaga
    ```
    Set visibility per Q2 (it's in Project settings).
13. **Milestones and items:**
    ```sh
    for t in "Honesty" "Doc viewer" "Visual system" "Pages" "Cromulon"; do gh api --method POST repos/Dinnaga-Research/dinnaga/milestones -f title="$t" --jq .title; done
    gh api repos/Dinnaga-Research/dinnaga/milestones --jq 'length'   # 5
    for n in $(seq 6 25); do gh project item-add "$N" --owner Dinnaga-Research --url "https://github.com/Dinnaga-Research/dinnaga/issues/$n"; done
    gh project item-list "$N" --owner Dinnaga-Research --format json --jq '.totalCount'   # 20 (+1 if Q4 = yes)
    ```
14. **Local notes:** rewrite `weytani/dinnaga` to `Dinnaga-Research/dinnaga` wherever the local inventory lists it, and record the transfer date. Check the rewritten status probe:
    `gh issue view 6 --repo Dinnaga-Research/dinnaga --json labels --jq '.labels[].name' | grep -q wayfinder:map; echo $?` → `0`.
15. **Publish path is ready for Saturday:**
    - `git -C ~/code/dinnaga status --porcelain` → empty; branch `main`.
    - `/bin/zsh -n ~/.claude/week-in-review/run.sh && python3 -m py_compile ~/.claude/week-in-review/publish.py` passes.
    - The next Saturday log shows `To https://github.com/Dinnaga-Research/dinnaga.git`.
16. **Local staleness check still reads:** `git -C ~/code/dinnaga show origin/main:src/data/zords.json | jq '.zords|length'` returns a number.
17. **Vercel untouched:** `cd ~/code/dinnaga && vercel api /v9/projects/$(jq -r .projectId .vercel/project.json) | sed -n '/^{/,$p' | jq '.link'` → `null`. `curl -sI https://dinnaga.ai | grep -i x-vercel-id` still matches.
18. **Standing rule from here on:** never create or fork a repo named `dinnaga` under the personal account (F1.4). If you ever need a personal fork, give it a different name.

---

## Open questions for the operator

- **Q1. Review gate on `dinnaga`.** The org gate can't reach a public repo (F4). Options:
  - (a) Leave `dinnaga` out of the gate and rely on the deterministic `ci.yml`. **Recommended:** single-author site, no secrets needed.
  - (b) Make `dinnaga-review` public. This exposes its prompts and design, and it would still need fork-PR hardening per its `design.md:254`.
  - (c) Vendor a copy into `dinnaga`. That makes it public anyway.
- **Q2. "Dinnaga Refresh" Project visibility.** Public (like Atisha #1; the issues are public anyway) or private?
- **Q3. Protect `main` now that it's free** (public repo in a Free org, F1)? A required-status-check rule on the `gates` job would make CI blocking. Admins bypass by default ([Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)), so the Saturday direct push keeps working unless "Do not allow bypassing" is enabled.
- **Q4.** Should the org Project also carry `weytani/arxiv-prospector#17` as a cross-owner item? It would show as a hidden item to anyone without access (F2).
- **Q5.** Widen the `gh` token with `admin:org` to read the org Actions policy before the move, or check it in the web UI instead?
- **Q6.** Delete the leftover `github-pages` environment and its old deployment records after the move, or keep them as history?
- **Q7.** Local automation that tests repo ownership by owner name should also treat the org as owned (see the local inventory).
- **Q8.** Edit the bodies of `dinnaga#6` and `arxiv-prospector#1` to the new issue URLs, since old-path issue URLs 404 in an anonymous browser (F1.3)?
- **Q9.** Commit `CONTEXT.md` to `main` (it's public-safe glossary text) or keep it out of the repo? Either way, the clone has to be clean before the next Saturday publish.
