# CI

GitHub Actions workflows for Jellify. Most jobs run on GitHub-hosted
`macos-latest` runners. The Maestro end-to-end tests and release-note
generation run on Jellify's own self-hosted Mac runners instead.

## Workflows

| Workflow | Runs on | Trigger |
|---|---|---|
| [Build Android APK](build-android.yml) | `macos-latest` | PRs touching `android/**` or `package.json` |
| [Build JS Bundle](build-bundle.yml) | `macos-latest` | Every PR |
| [Build iOS IPA](build-ios.yml) | `macos-latest` | PRs touching `ios/**` or `package.json`; manual |
| [Run Maestro Tests](maestro-test.yml) | **self-hosted** | Every PR; manual (smoke or full flow); nightly at 03:00 UTC (full flow) |
| [Publish Android APK and TestFlight Betas](publish-beta.yml) | **self-hosted** (`generate-release-notes`), `macos-latest` (the rest) | Manual |
| [Publish Over-the-Air Update PR](publish-ota-update-pr.yml) | `macos-latest` | PRs touching `src/**`, `App.tsx` or the OTA scripts |
| [Publish Over-the-Air Update](publish-ota-update.yml) | `macos-latest` | Manual |
| [Run Jest Unit Tests](run-jest-test-suite.yml) | `macos-latest` | Pushes to any branch except `main` |

The build and test workflows cancel their in-progress run when a newer one
starts for the same PR or branch; the publish workflows always run to the
end. Different PRs never block each other.

### Shared actions

| Action | What it does |
|---|---|
| [`install-deps`](../actions/install-deps/action.yml) | Sets up bun (GitHub-hosted runners only), restores `node_modules` keyed on `bun.lock` and `patches/**`, and runs `bun i` |
| [`setup-xcode`](../actions/setup-xcode/action.yml) | Selects the Xcode version |
| [`generate-release-notes`](../actions/generate-release-notes/action.yml) | Writes release notes with OpenAI from the PRs merged since the last release |

## Self-hosted runners

Jobs with `runs-on: [self-hosted, macOS]` run on Apple Silicon Macs in the
Jellify Nomad cluster:

| Host | Labels |
|---|---|
| `hopper` | `self-hosted`, `macOS`, `ARM64` |
| `galileo` | `self-hosted`, `macOS`, `ARM64` |

Each host runs one runner, so **two self-hosted jobs can run at once** and
any more wait in the queue. Runners are ephemeral: each one registers for a
single job, then deregisters, and the next starts with an empty work
folder. They show up in the repo's runner settings as `<host>-<unix time>`.

### Toolchain

The runners come with their toolchain installed, so self-hosted jobs must
**not** set these up themselves (no `setup-bun`, `setup-node`, `setup-java`,
Maestro installs or SDK downloads). Bump versions in the repos below, not in
a workflow.

| Tool | Version |
|---|---|
| bun | `github_runner_bun_version` in Nomadable |
| Node | Homebrew `node@24` |
| JDK | Homebrew `openjdk@17`, on `JAVA_HOME` |
| Maestro | `github_runner_maestro_version` in Nomadable |
| Android SDK, emulator, API 34 arm64 system image | `android_sdk_packages` in Nomadable |

Use [`install-deps`](../actions/install-deps/action.yml) to install
dependencies: it skips `setup-bun` on self-hosted runners and pins the same
bun version for GitHub-hosted ones.

The runners' `HOME` persists between jobs, so `~/.gradle`, the Maestro
emulator's AVD and bun's install cache are reused without `actions/cache`.

### Where the runners are configured

| Repo | What it owns |
|---|---|
| [Jellify-Music/Nomad-Jobs](https://github.com/Jellify-Music/Nomad-Jobs/tree/main/actions-runner) | The `actions-runner` Nomad job: registration, labels, `PATH` and `HOME`, and which hosts get a runner |
| [Cosmonautical-Cloud/Nomadable](https://github.com/Cosmonautical-Cloud/Nomadable/blob/main/group_vars/github_runners.yml) | The `github_runners` inventory group and its toolchain versions. Adding a runner host is an inventory change here |
| [Cosmonautical-Cloud/Nomadintosh](https://github.com/Cosmonautical-Cloud/Nomadintosh) | The Ansible roles that install it all on macOS (`homebrew_packages`, `release_archives`, `android_sdk`, `nomad`) |
