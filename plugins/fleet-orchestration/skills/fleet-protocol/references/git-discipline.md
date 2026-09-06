# Git discipline, with the incident behind each rule

Rules without their incidents get argued away. Each rule below is followed by
what it cost when it was absent. Repository names are configuration; the
incidents are stated in terms of roles.

## 1. One repo per lane

Scope is exactly one repository from `lanes[]`. Never edit another lane's
repo, and never touch a repository in `handsOff.repos`.

*Why:* two lanes editing one file overwrite each other. Task claiming locks
the claim, not the file.

## 2. Never switch a shared checkout's HEAD

Do not check out a branch, commit, or stash in the shared clone. Create a
worktree per task:

```
git -C <repo> fetch origin
git -C <repo> worktree add <worktreeRoot>/<repo>-<slug> -b <type>/<slug> origin/<base>
```

If a predecessor's worktree already holds your branch, continue **there**.
Git refuses two worktrees on one branch, so a second attempt silently blocks
whoever holds it.

*Why:* another session's build, test run or running application is pointed at
that checkout. Switching HEAD under it produces failures that look like code
defects and are not.

*Corollary — never dispatch a build or test run into a worktree another
process already holds.* Check for a live process against that path first. Two
concurrent service starts in one tree wedged each other.

## 3. Push and open the PR in ONE action

```
git push -u origin <branch> && <forge> pr create --base <base> --title "<conventional>" --body-file <file>
```

Not two steps. Not "push now, PR later".

*Why:* a pushed branch with no PR is invisible work. It accumulates,
conflicts, and is eventually deleted by someone who cannot tell whether it
holds anything unique. Draft is the parking spot; a bare branch is not.

*Never delete a branch that still holds unique content.* In a fleet that
squash-merges, `git branch --merged` is the wrong instrument — a squashed
branch commit is never an ancestor of the squashed base, however absorbed.
A merge trial is also wrong, in the other direction: it reports a conflict on
a perfectly absorbed branch once the base rewrites its files. Absorption
needs **both** halves — content identical to the squash commit, **and** that
squash commit contained in the base. See `merge-discipline.md`.

## 4. Prove on the committed tree

`git diff HEAD --stat` must be empty when the proof runs.

*Why:* a soft reset without staging shipped a head that lacked the edits its
PR body described. The worktree was correct; the commit was not; every proof
in the body was run against the worktree.

## 5. Freshness before the write, not before the read

Re-check the branch against the remote immediately before **pushing**, not at
the start of the turn.

*Why:* a squash-merged branch that was deleted must not be recreated by a
late push. Squash-and-delete races an in-flight push: the branch comes back
with no PR, and the coverage sweep that ran a minute earlier says everything
is fine.

## 6. Force is prohibited; the lease has a mandatory form

`--force`, `reset --hard`, `clean` and `worktree remove --force`: never.

`--force-with-lease` is permitted **only** on a lane-owned feature branch —
one this lane created, is the sole pusher of, and which carries its own PR —
and **only** as:

```
--force-with-lease=<ref>:<expected-sha>
```

with the SHA written out.

*Why:* a bare `--force-with-lease` takes its expectation from the
remote-tracking ref, and any background fetch silently updates that ref, so
the lease validates against a value that already absorbed someone else's
push. It is a guard-shaped no-op.

After every rebase-and-lease, verify and state in the PR: single parent,
contains the base tip, and a three-dot diff matching the claimed file count.

*Deleting and recreating a branch to dodge a lease is worse and is
prohibited*: it destroys the PR's review history.

## 7. A child of a squash-merged parent rebases, never merges

When a parent branch was squash-merged, its child's merge base falls back and
a merge produces add/add conflicts across files nobody touched. Rebase
`--onto` the base instead.

*Why:* gates run green on a conflicted tree. The conflict is discovered at
merge time, on a tree that already passed.

## 8. Fix root causes

Never weaken, skip, quarantine or retry-loop a test to reach green. Name the
rejected "fixes" in the PR body — the ones that would have hidden the problem
rather than solved it.

*Why:* a green test that enshrines the defect is a defect, and it is worse
than a red one because it consumes the budget that would have found the bug.

## 9. Verify the symptom before building

Before creating a worktree for an issue, verify the issue's named symptom in
the current base — in code, config, or a live check. Absent → close the issue
with the evidence (the fixing commit or the command showing the symptom gone)
and build nothing.

*Why:* open state is not evidence the defect exists. In one run, 4 of ~40
assigned items were already fixed. And **verify the symptom, not the file it
lives in**: presence of the file, script or component is not presence of the
defect.

*Related:* search the repository's issues **before investigating**, not only
before filing. Three retrieval misses in one day, each time the answer was
already open in the repo under investigation.

## 10. Never act on a PR you merely discovered

Act only on a PR a lane announced by message. Honour `handsOff.authors` and
`handsOff.pullRequests`.

*Why:* under a shared credential every fleet PR shows the same author, so
scanning finds human PRs and fleet PRs in one undifferentiated list. The
author field answers "is this ours"; the branch answers "which lane".

## 11. Committed files carry no machine-absolute paths and no time estimates

Relative paths only. Sequence work by dependency, never by duration.

*Why:* an absolute path makes the repo open differently on the next machine.
A time estimate is a claim nobody can falsify and everybody plans against.

## 12. Read the owning repo's own instructions before the first edit

Its `CLAUDE.md` and rules directory outrank this protocol inside that
repository.

## 13. Do not spam CI

Before pushing, check the queue depth for that repository. Above the
configured threshold, wait and heartbeat `waiting`. One push per task, not
per commit.

*Caution on any such cap, learned by getting it wrong:* count the right
noun. A cap built on a count of **runs** is blind to work, because one run
spawns jobs without moving that number. Before adding a coarse control,
check whether a precise one already exists and is already going red at the
moment of actual exhaustion — a correct gate's red can be misread as a defect
and get built on top of.
