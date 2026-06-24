#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  bin/rebuild-short-history.sh -n <count> -e <end-commit> -b <new-branch> [--squash <oldest>..<newest> [--squash-msg <message>]]... [--drop <commit>]... [--switch] [--force]

Create a new branch whose history contains only the last <count> commits ending
at <end-commit>, optionally replacing commit ranges passed with --squash by a
single commit. The final file tree is identical to <end-commit>.

Examples:
  bin/rebuild-short-history.sh -n 20 -e HEAD -b new
  bin/rebuild-short-history.sh --count 20 --end edd22aa7 --branch github-main --switch
  bin/rebuild-short-history.sh -n 20 -e HEAD -b github-main --squash abc123..def456
  bin/rebuild-short-history.sh -n 20 -e HEAD -b github-main --squash abc123..def456 --squash-msg "remove leaked secret"
  bin/rebuild-short-history.sh -n 20 -e HEAD -b github-main --drop abc123 --drop def456

Options:
  -n, --count       Number of commits to keep.
  -e, --end         Last commit of the new history, for example HEAD or a SHA.
  -b, --branch      New branch name to create or update with --force.
      --squash      Commit range to replace with one commit. Repeatable.
                    The range must be ordered oldest..newest.
      --squash-msg  Commit message for the previous --squash range.
      --drop        Commit to exclude from the rebuilt history. Repeatable.
      --switch      Switch to the new branch after creating it.
      --force       Replace the branch if it already exists.
  -h, --help        Show this help.
USAGE
}

count=
end_commit=
branch=
switch_branch=0
force=0
drop_commits=()
squash_ranges=()
squash_messages=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    -n|--count)
      count="${2:-}"
      shift 2
      ;;
    -e|--end)
      end_commit="${2:-}"
      shift 2
      ;;
    -b|--branch)
      branch="${2:-}"
      shift 2
      ;;
    --drop)
      drop_commits+=("${2:-}")
      shift 2
      ;;
    --squash)
      squash_ranges+=("${2:-}")
      squash_messages+=("")
      shift 2
      ;;
    --squash-msg)
      if [ "${#squash_ranges[@]}" -eq 0 ]; then
        echo "Error: --squash-msg must follow a --squash range." >&2
        exit 2
      fi
      squash_messages[$((${#squash_messages[@]} - 1))]="${2:-}"
      shift 2
      ;;
    --switch)
      switch_branch=1
      shift
      ;;
    --force)
      force=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if ! [[ "${count:-}" =~ ^[1-9][0-9]*$ ]]; then
  echo "Error: --count must be a positive integer." >&2
  exit 2
fi

if [ -z "${end_commit:-}" ] || [ -z "${branch:-}" ]; then
  echo "Error: --count, --end, and --branch are required." >&2
  usage >&2
  exit 2
fi

git rev-parse --is-inside-work-tree >/dev/null
end_commit=$(git rev-parse --verify "${end_commit}^{commit}")

resolved_drop_commits=()
for drop_commit in "${drop_commits[@]+"${drop_commits[@]}"}"; do
  if [ -z "$drop_commit" ]; then
    echo "Error: --drop requires a commit." >&2
    exit 2
  fi
  resolved_drop_commits+=("$(git rev-parse --verify "${drop_commit}^{commit}")")
done

is_dropped_commit() {
  local commit="$1"
  local dropped
  for dropped in "${resolved_drop_commits[@]+"${resolved_drop_commits[@]}"}"; do
    if [ "$commit" = "$dropped" ]; then
      return 0
    fi
  done
  return 1
}

resolved_squash_starts=()
resolved_squash_ends=()
resolved_squash_messages=()
for ((i=0; i<${#squash_ranges[@]}; i++)); do
  squash_range="${squash_ranges[$i]}"
  if [ -z "$squash_range" ] || [[ "$squash_range" != *..* ]]; then
    echo "Error: --squash requires a range like oldest..newest." >&2
    exit 2
  fi
  squash_start="${squash_range%%..*}"
  squash_end="${squash_range#*..}"
  if [ -z "$squash_start" ] || [ -z "$squash_end" ]; then
    echo "Error: --squash requires a range like oldest..newest." >&2
    exit 2
  fi
  resolved_squash_starts+=("$(git rev-parse --verify "${squash_start}^{commit}")")
  resolved_squash_ends+=("$(git rev-parse --verify "${squash_end}^{commit}")")
  resolved_squash_messages+=("${squash_messages[$i]}")
done

index_of_commit() {
  local commit="$1"
  local i
  for ((i=0; i<${#ordered_commits[@]}; i++)); do
    if [ "${ordered_commits[$i]}" = "$commit" ]; then
      echo "$i"
      return 0
    fi
  done
  return 1
}

if git show-ref --verify --quiet "refs/heads/${branch}" && [ "$force" -ne 1 ]; then
  echo "Error: branch '${branch}' already exists. Use --force to replace it." >&2
  exit 2
fi

selected_commits=()
while IFS= read -r commit; do
  if is_dropped_commit "$commit"; then
    continue
  fi
  selected_commits+=("$commit")
  if [ "${#selected_commits[@]}" -eq "$count" ]; then
    break
  fi
done < <(git rev-list "$end_commit")

selected_count="${#selected_commits[@]}"
if [ "$selected_count" -eq 0 ]; then
  echo "Error: no commits are reachable from ${end_commit} after exclusions." >&2
  exit 2
fi

ordered_commits=()
for ((i=${#selected_commits[@]}-1; i>=0; i--)); do
  ordered_commits+=("${selected_commits[$i]}")
done

squash_start_indexes=()
squash_end_indexes=()
squash_messages_by_start=()
covered_by_squash=()
expected_count="$selected_count"
for ((i=0; i<${#resolved_squash_starts[@]}; i++)); do
  start_index=$(index_of_commit "${resolved_squash_starts[$i]}") || {
    echo "Error: squash start ${resolved_squash_starts[$i]} is not in the selected commits." >&2
    exit 2
  }
  end_index=$(index_of_commit "${resolved_squash_ends[$i]}") || {
    echo "Error: squash end ${resolved_squash_ends[$i]} is not in the selected commits." >&2
    exit 2
  }
  if [ "$start_index" -gt "$end_index" ]; then
    echo "Error: --squash must be ordered oldest..newest." >&2
    exit 2
  fi
  if [ "$start_index" -eq "$end_index" ]; then
    echo "Error: --squash range must contain at least two commits." >&2
    exit 2
  fi
  for ((j=start_index; j<=end_index; j++)); do
    if [ "${covered_by_squash[$j]:-0}" -eq 1 ]; then
      echo "Error: --squash ranges must not overlap." >&2
      exit 2
    fi
    covered_by_squash[$j]=1
  done
  squash_start_indexes+=("$start_index")
  squash_end_indexes+=("$end_index")
  squash_messages_by_start[$start_index]="${resolved_squash_messages[$i]}"
  expected_count=$((expected_count - (end_index - start_index)))
done

squash_end_for_start() {
  local start_index="$1"
  local i
  for ((i=0; i<${#squash_start_indexes[@]}; i++)); do
    if [ "${squash_start_indexes[$i]}" -eq "$start_index" ]; then
      echo "${squash_end_indexes[$i]}"
      return 0
    fi
  done
  return 1
}

tmpdir=$(mktemp -d "${TMPDIR:-/tmp}/short-history.XXXXXX")
cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

parent=
i=0
while [ "$i" -lt "${#ordered_commits[@]}" ]; do
  if end_index=$(squash_end_for_start "$i"); then
    squash_message="${squash_messages_by_start[$i]:-}"
    commit="${ordered_commits[$end_index]}"
    i=$((end_index + 1))
  else
    squash_message=
    commit="${ordered_commits[$i]}"
    i=$((i + 1))
  fi

  msg_file="${tmpdir}/message"
  if [ -n "$squash_message" ]; then
    printf '%s\n' "$squash_message" > "$msg_file"
  else
    git log -1 --format=%B "$commit" > "$msg_file"
  fi

  tree=$(git show -s --format=%T "$commit")
  author_name=$(git show -s --format=%an "$commit")
  author_email=$(git show -s --format=%ae "$commit")
  author_date=$(git show -s --format=%aI "$commit")
  committer_name=$(git show -s --format=%cn "$commit")
  committer_email=$(git show -s --format=%ce "$commit")
  committer_date=$(git show -s --format=%cI "$commit")

  if [ -n "$parent" ]; then
    new_commit=$(
      GIT_AUTHOR_NAME="$author_name" \
      GIT_AUTHOR_EMAIL="$author_email" \
      GIT_AUTHOR_DATE="$author_date" \
      GIT_COMMITTER_NAME="$committer_name" \
      GIT_COMMITTER_EMAIL="$committer_email" \
      GIT_COMMITTER_DATE="$committer_date" \
        git commit-tree "$tree" -p "$parent" -F "$msg_file"
    )
  else
    new_commit=$(
      GIT_AUTHOR_NAME="$author_name" \
      GIT_AUTHOR_EMAIL="$author_email" \
      GIT_AUTHOR_DATE="$author_date" \
      GIT_COMMITTER_NAME="$committer_name" \
      GIT_COMMITTER_EMAIL="$committer_email" \
      GIT_COMMITTER_DATE="$committer_date" \
        git commit-tree "$tree" -F "$msg_file"
    )
  fi

  parent="$new_commit"
done

git update-ref "refs/heads/${branch}" "$parent"

rebuilt_count=$(git rev-list --count "$branch")
if [ "$rebuilt_count" -ne "$expected_count" ]; then
  echo "Error: rebuilt branch has ${rebuilt_count} commits, expected ${expected_count}." >&2
  exit 1
fi

for drop_commit in "${resolved_drop_commits[@]+"${resolved_drop_commits[@]}"}"; do
  if git merge-base --is-ancestor "$drop_commit" "$branch"; then
    echo "Error: dropped commit ${drop_commit} is still reachable from ${branch}." >&2
    exit 1
  fi
done

for ((i=0; i<${#squash_start_indexes[@]}; i++)); do
  for ((j=${squash_start_indexes[$i]}; j<=${squash_end_indexes[$i]}; j++)); do
    if git merge-base --is-ancestor "${ordered_commits[$j]}" "$branch"; then
      echo "Error: squashed commit ${ordered_commits[$j]} is still reachable from ${branch}." >&2
      exit 1
    fi
  done
done

if ! git diff --quiet "${end_commit}^{tree}" "${branch}^{tree}"; then
  echo "Error: rebuilt branch tree differs from ${end_commit}." >&2
  exit 1
fi

if [ "$switch_branch" -eq 1 ]; then
  git switch "$branch"
fi

cat <<EOF
Created branch: ${branch}
Commits requested:${count}
Commits selected: ${selected_count}
Commits rebuilt: ${rebuilt_count}
Squash ranges:  ${#resolved_squash_starts[*]}
Commits dropped:${#resolved_drop_commits[*]}
End commit:     ${end_commit}
New HEAD:       ${parent}
Tree check:     ${branch} matches ${end_commit}
EOF
