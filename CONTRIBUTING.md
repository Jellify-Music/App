# Contributing

We are open to any developer that wants to lend their hand at _Jellify_ development, and developers can join our [Discord server](https://discord.gg/jellify) to get in contact with us.

Here's the best way to get started:

- Fork this repository
- Follow the instructions for [Running Locally](#️running-locally)
- Check out the [issues](https://github.com/Jellify-Music/App/issues) if you need inspiration
- Hack, hack, hack
- ???
- Submit a Pull Request to sync the main repository with your fork
- Profit! 🎉

## Running Locally

### Universal Dependencies

- [NodeJS v22](https://nodejs.org/en/download) for React Native
- [Bun](https://bun.sh/) for managing dependencies

### 🍎 iOS

#### Dependencies

- [Xcode](https://developer.apple.com/xcode/) for building

#### Instructions

##### Setup

- Clone this repository
- Run `bun init-ios` to initialize the project
  - This will install `npm` packages, install `bundler` and required gems, and install required CocoaPods with [React Native's New Architecture](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here#what-is-the-new-architecture)

##### Running

- Run `bun start` to start the dev server
- Open the `Jellify.xcodeworkspace` with Xcode, _not_ the `Jellify.xcodeproject`
- Run either on a device or in the simulator
  - _You will need to wait for Xcode to finish it's "Indexing" step_

##### Building

- To create a build, run `bun fastlane:ios:build` to use fastlane to compile an `.ipa`

### 🤖 Android

#### Dependencies

- [Android Studio](https://developer.android.com/studio)
- [Java Development Kit](https://www.oracle.com/th/java/technologies/downloads/)

#### Instructions

##### Setup

- Clone this repository
- Run `bun install` to install `npm` packages

##### Running

- Run `bun start` to start the dev server
- Open the `android` folder with Android Studio
  - _Android Studio should automatically grab the "Run Configurations" and initialize Gradle_
- Run either on a device or in the simulator

##### Building

- To create a build, run `bun fastlane:android:build` to use fastlane to compile an `.apk` for all architectures
- Alternatively, run `cd android; ./gradlew assembleRelease` to use Gradle to compile an `.apk`

#### References

- [Setting up Android SDK](https://developer.android.com/about/versions/14/setup-sdk)
- [ANDROID_HOME not being set](https://stackoverflow.com/questions/26356359/error-android-home-is-not-set-and-android-command-not-in-your-path-you-must/54888107#54888107)
- [Android Auto app not showing up](https://www.reddit.com/r/AndroidAuto/s/LGYHoSPdXm)
