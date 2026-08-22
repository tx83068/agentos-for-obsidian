# AgentOS

AgentOS is an Obsidian community-plugin distribution build for a server-backed AgentOS runtime.

This repository contains distribution artifacts only. The canonical source repository remains the private Forgejo project. The community build does not self-update through an AgentOS bridge; updates are delivered as reviewed GitHub Releases.

## Installation

Install the release assets into the Obsidian plugin folder `agentos` and enable the plugin. The plugin is mobile-compatible (`isDesktopOnly: false`).

## Source and review

Forgejo remains the canonical source and build system. Before submitting to the Obsidian Community Directory, the project must provide Obsidian reviewers with a public, reviewable source repository or an approved public source mirror. This distribution repository intentionally does not publish private infrastructure, credentials, server URLs, or AgentOS runtime configuration.

## Release policy

Releases are created only from version tags by GitHub Actions after validating the three complete bundle files, manifest/version consistency, mobile-safe bundle rules, artifact hashes, and a checked-in attestation from the canonical Forgejo build/test pipeline. No release is created by the workflow until those checks pass.
