fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android test

```sh
[bundle exec] fastlane android test
```

Runs all the tests

### android build

```sh
[bundle exec] fastlane android build
```



### android gplay

```sh
[bundle exec] fastlane android gplay
```

Deploy a new version to Google Play internal testing, then promote it to open testing

### android fdroid_check

```sh
[bundle exec] fastlane android fdroid_check
```

Fail if the FOSS (F-Droid) build resolves any non-free dependencies

### android fdroid

```sh
[bundle exec] fastlane android fdroid
```

Build the FOSS (F-Droid) release APKs: no Google Cast, OTA, or crash reporting

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
