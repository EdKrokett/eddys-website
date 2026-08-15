#!/usr/bin/env python3
"""Nuxt 4 architecture validator (single-project repo)."""
import os
import sys

ROOT = os.getcwd()
APP_DIR = os.path.join(ROOT, "app")

# Dirs that MUST be inside app/, not at project root
APP_ONLY_DIRS = ["pages", "components", "layouts", "composables", "middleware", "plugins", "utils"]

# Files that should not exist
FORBIDDEN_FILES = ["tailwind.config.js", "tailwind.config.ts", "postcss.config.js", "postcss.config.ts"]


def check():
    violations = []

    if not os.path.isdir(APP_DIR):
        violations.append("CRITICAL: app/ does not exist. Create it.")

    # Check for misplaced dirs at project root
    for d in APP_ONLY_DIRS:
        path = os.path.join(ROOT, d)
        if os.path.isdir(path) and os.listdir(path):
            violations.append(f"MISPLACED: {d}/ has files -> move to app/{d}/")

    # Check for forbidden config files
    for f in FORBIDDEN_FILES:
        fpath = os.path.join(ROOT, f)
        if os.path.isfile(fpath):
            violations.append(f"FORBIDDEN: {os.path.relpath(fpath)} exists -> delete it (Tailwind v4 uses CSS config)")

    # Check server/ is NOT inside app/
    if os.path.isdir(os.path.join(APP_DIR, "server")):
        violations.append("MISPLACED: app/server/ -> move to server/")

    if violations:
        print("ARCHITECTURE CHECK FAILED")
        for v in violations:
            print(f"  - {v}")
        print("\nFix these issues before continuing.")
        sys.exit(1)
    else:
        print("Architecture valid")
        sys.exit(0)


if __name__ == "__main__":
    check()
