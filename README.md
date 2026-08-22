# AgentOS

AgentOS is a BRAT-installed Obsidian plugin distribution for a server-backed
AgentOS runtime.

This repository contains distribution artifacts only. Forgejo remains the
canonical source, and `tx83068/agentos-for-obsidian-source` is the private
one-way source mirror. Public semver GitHub Releases are the production/private
distribution channel. The plugin never self-updates through the AgentOS bridge.

## Installation with BRAT

In Obsidian, install the BRAT community plugin, add:

`https://github.com/tx83068/agentos-for-obsidian`

Then select a tagged release and install/update the `agentos` plugin. Each
release contains the complete `manifest.json`, `main.js`, and `styles.css`
bundle and is mobile-compatible (`isDesktopOnly: false`).

The official Obsidian Community Directory is not used for this distribution
decision. Hidden File Sync, Customisation Sync and LiveSync are never used for
plugin bundle delivery.

## Release policy

GitHub Actions runs only for strict semver tags `vX.Y.Z`. Before creating a
Release it validates manifest/version consistency, BRAT-compatible plugin
metadata, complete assets, mobile-safe bundle rules, forbidden self-update
markers, SHA-256 assets, and a previous-to-next version upgrade. A checked-in
Forgejo build/test attestation is also required.
