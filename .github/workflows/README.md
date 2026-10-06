# CI

GitHub Actions workflows for Jellify. Anything that can run on Linux (JS
bundles, Jest, OTA updates, release notes, the PR Android build) runs on
Jellify's self-hosted Linux runners. Maestro runs on the self-hosted Macs.
iOS builds and the fastlane publish jobs stay on GitHub-hosted
`macos-latest`.

## Workflows

GitHub only loads workflows from the top level of `.github/workflows/`, so
they're grouped by filename prefix (`build-`, `test-`, `publish-`) and by
display name (`Build / …`, `Test / …`, `Publish / …`), which keeps each group
together in the Actions sidebar.

| Workflow | Runs on | Trigger |
|---|---|---|
| [Build / Android APK](build-android.yml) | **self-hosted Linux** (fork PRs: `ubuntu-latest`) | PRs touching `android/**` or `package.json` |
| [Build / JS Bundle](build-bundle.yml) | **self-hosted Linux** (fork PRs: `ubuntu-latest`) | Every PR |
| [Build / iOS IPA](build-ios.yml) | `macos-latest` | PRs touching `ios/**` or `package.json`; manual |
| [Test / Jest](test-jest.yml) | **self-hosted Linux** | Pushes to any branch except `main` |
| [Test / Maestro](test-maestro.yml) | **self-hosted macOS** | Every non-fork PR and nightly at 03:00 UTC (both platforms); manual (pick `both`, `android` or `ios`) |
| [Publish / Android APK and TestFlight Betas](publish-beta.yml) | **self-hosted Linux** (`generate-release-notes`), `macos-latest` (the rest) | Manual |
| [Publish / OTA Update PR](publish-ota-update-pr.yml) | **self-hosted Linux** (fork PRs: `ubuntu-latest`) | PRs touching `src/**`, `App.tsx` or the OTA scripts |
| [Publish / OTA Update](publish-ota-update.yml) | **self-hosted Linux** | Manual |

Required status checks are job IDs, not workflow names or filenames, so
renaming a workflow file is safe; renaming a job is not. The default branch
ruleset requires `run-jest-test-suite`, `build-bundle`, `maestro-android` and
`maestro-ios`.

### Test / Maestro

Both jobs run the full flow (`maestro/flow-full.yaml`) against a Release
build with OTA updates disabled, and cache that build keyed on everything that
goes into it:

- `maestro-android` builds an APK and runs it on the API 34 emulator via
  `scripts/run-maestro-android-ci.sh`.
- `maestro-ios` builds the `Jellify - Release` scheme for the simulator and
  runs it on a throwaway simulator via `scripts/run-maestro-ios-ci.sh`.

Each uploads its screenshots, video, device logs and crash reports as
`maestro-<platform>-results`. See [maestro/README.md](../../maestro/README.md)
for keeping the flows cross-platform.

The build and test workflows cancel their in-progress run when a newer one
starts for the same PR or branch; the publish workflows always run to the
end. Different PRs never block each other.

### Shared actions

| Action | What it does |
|---|---|
| [`install-deps`](../actions/install-deps/action.yml) | Sets up bun (everywhere but the self-hosted Macs) and Node (self-hosted Linux only), restores `node_modules` keyed on `bun.lock` and `patches/**`, and runs `bun i` (with `--backend=copyfile` on self-hosted Linux) |
| [`setup-xcode`](../actions/setup-xcode/action.yml) | Selects the Xcode version |
| [`generate-release-notes`](../actions/generate-release-notes/action.yml) | Writes release notes with OpenAI from the PRs merged since the last release |

## Self-hosted runners

Self-hosted runners live in the Jellify Nomad cluster, one per host:

| Host | Labels | Pick with |
|---|---|---|
| `hopper` | `self-hosted`, `macOS`, `ARM64` | `runs-on: [self-hosted, macOS]` |
| `galileo` | `self-hosted`, `macOS`, `ARM64` | `runs-on: [self-hosted, macOS]` |
| `fibonacci` | `self-hosted`, `Linux`, `X64` | `runs-on: [self-hosted, Linux]` |
| `dijkstra` | `self-hosted`, `Linux`, `X64` | `runs-on: [self-hosted, Linux]` |

**Two jobs of each OS can run at once**; any more wait in the queue.

### Fork PRs

Code from forks never runs on these hosts:

- Jobs that trigger on `pull_request` and normally use the Linux runners
  pick `ubuntu-latest` for a fork PR (the `runs-on` expression in
  `build-bundle`, `build-android` and `publish-ota-update-pr`). Copy it into
  any new `pull_request` job that uses them.
- `maestro-android` and `maestro-ios` skip fork PRs, since they need the
  self-hosted Macs. A skipped job satisfies a required check, so test a
  fork's changes end-to-end by pushing its branch to this repo.
- None of this is enforced by the workflows, because a fork PR runs its own
  copy of them and can change `runs-on`. The enforcement is the repo's
  **Settings → Actions → General → Approval for running fork pull request
  workflows from contributors**, set to require approval for all external
  contributors. Before approving a fork's run, check that it doesn't touch
  `.github/`.

Where a job runs:

- **Self-hosted Linux**: anything that only needs bun, Node, a JDK or the
  Android SDK.
- **Self-hosted macOS**: Maestro.
- **GitHub-hosted `macos-latest`**: iOS builds, plus jobs that run fastlane
  through bundler (`publish-android`, `finalize-release`). The Linux
  runners have no C compiler for the native gems in `Gemfile.lock`. Runners are ephemeral: each one registers for a
single job, then deregisters, and the next starts with an empty work
folder. They show up in the repo's runner settings as `<host>-<unix time>`.

### Toolchain (macOS)

The Macs come with their toolchain installed, so jobs on them must
**not** set these up themselves (no `setup-bun`, `setup-node`, `setup-java`,
Maestro installs or SDK downloads). Bump versions in the repos below, not in
a workflow.

| Tool | Version |
|---|---|
| bun | `github_runner_bun_version` in Nomadable, matching `packageManager` in `package.json` |
| Node | Homebrew `node@24` |
| JDK | Homebrew `openjdk@17`, on `JAVA_HOME` |
| Maestro | `github_runner_maestro_version` in Nomadable |
| Android SDK, emulator, API 34 arm64 system image | `android_sdk_packages` in Nomadable |
| Xcode and an iOS simulator runtime (for `maestro-ios`) | Installed on the hosts; `maestro-ios` uses the newest iOS runtime and fails its toolchain step if either is missing |

Use [`install-deps`](../actions/install-deps/action.yml) to install
dependencies: it skips `setup-bun` on self-hosted runners and installs the
`packageManager` version from `package.json` on GitHub-hosted ones.

The Macs' `HOME` persists between jobs, so `~/.gradle`, the Maestro
emulator's AVD and bun's install cache are reused without `actions/cache`.

### Toolchain (Linux)

The Linux runners are the official `ghcr.io/actions/actions-runner` image
with nothing added: `git`, `curl`, `jq` and `unzip`, no sudo, and no Docker
daemon. Jobs set up what they need: `install-deps` installs bun and Node 24,
and `build-android` uses `actions/setup-java` and
`android-actions/setup-android`. Downloads under the tool cache and bun's
install cache last until the runner's container is replaced (which is why
`install-deps` installs with `--backend=copyfile` there: bun's default
hardlinks would let `patch-package` edit the shared cache), but every job
gets a fresh work folder and anything it leaves running is killed, so use
`actions/cache` for anything else worth keeping.

### Where the runners are configured

| Repo | What it owns |
|---|---|
| [Jellify-Music/Nomad-Jobs](https://github.com/Jellify-Music/Nomad-Jobs/tree/main/actions-runner) | The `actions-runner` Nomad job: registration, labels, `PATH` and `HOME`, the Linux runner image, and which hosts get a runner |
| [Cosmonautical-Cloud/Nomadable](https://github.com/Cosmonautical-Cloud/Nomadable/blob/main/group_vars/github_runners.yml) | The `github_runners` inventory group and its toolchain versions. Adding a runner host is an inventory change here |
| [Cosmonautical-Cloud/Nomadintosh](https://github.com/Cosmonautical-Cloud/Nomadintosh) | The Ansible roles that install it all on macOS (`homebrew_packages`, `release_archives`, `android_sdk`, `nomad`) |
| [Cosmonautical-Cloud/nomaduntu](https://github.com/Cosmonautical-Cloud/nomaduntu) | Nomad and Docker on the Linux hosts. No runner toolchain |
