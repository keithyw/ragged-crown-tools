#!/bin/sh
# SessionStart hook: if any scratch file in a .sandbox/ folder is older than
# 7 days, tell Claude to ask the owner which ones can go. Deletes nothing.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

old=$(find . -path ./node_modules -prune -o -path '*/node_modules' -prune \
	-o -path '*/.sandbox/*' -type f -mtime +7 -print 2>/dev/null | sort)
[ -z "$old" ] && exit 0

count=$(printf '%s\n' "$old" | wc -l | tr -d ' ')
msg="Scratch-file cleanup due: $count file(s) in .sandbox/ folders are older than 7 days:
$old

Before anything else this session, show the owner this list (grouped by folder is fine) and ask which can be deleted. Delete only the ones they approve, one rm per file or folder they name (rm asks for permission). Never delete without approval, and leave the rest alone."

jq -n --arg ctx "$msg" \
	'{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}'
