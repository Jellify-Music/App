# 🪼 Jellify

![Jellify App Icon](assets/icon_dark_60pt_3x.png)

[![Latest Version](https://img.shields.io/github/package-json/version/anultravioletaurora/jellify?label=Latest%20Version&color=indigo)](https://github.com/anultravioletaurora/Jellify/releases)
[![publish-beta](https://github.com/anultravioletaurora/Jellify/actions/workflows/publish-beta.yml/badge.svg?branch=main)](https://github.com/anultravioletaurora/Jellify/actions/workflows/publish-beta.yml) [![Sponsors](https://img.shields.io/github/sponsors/anultravioletaurora?label=Project%20Sponsors&color=magenta)](https://github.com/sponsors/anultravioletaurora) [![Patreon](https://img.shields.io/badge/Patreon-F96854?logo=patreon&logoColor=white)](https://patreon.com/anultravioletaurora?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink)

## 🔗 Quick Links

[TestFlight](https://testflight.apple.com/join/etVSc7ZQ)

[![Discord Server](https://dcbadge.limes.pink/api/server/https://discord.gg/yf8fBatktn)](https://discord.gg/yf8fBatktn)

## 📄 Contents

- [Info](#ℹ️-info)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Built with](#-built-with-good-stuff)
- [Support](#-support-the-project)
- [Running Locally](#️running-locally)
- [Special Thanks](#-special-thanks-to)

## ℹ️ Info

> **jellify** (verb) - _to make gelatinous_ <br>
> [see also](https://www.merriam-webster.com/dictionary/jellify)

_Jellify_ is a free and open source music player for the [Jellyfin Media Server](https://jellyfin.org/). Built with [React Native](https://reactnative.dev/), it is available for both iOS and Android.

> _Jellify_ requires a connection to a [Jellyfin Media Server](https://jellyfin.org/) server to work. [See also](https://jellyfin.org/docs/)

Showcasing the artwork of your library, it has a user interface congruent to what _the big guys_ do. _Jellify_ also provides algorithmic curation of your music (not that you have to use _Jellify_ that way). It's designed to be lightweight, and scale to even the largest of music libraries (...like 100K tracks large).

### 😇 Background

This app was designed with me and my dad in mind. I wanted us to have a sleek, one stop shop for live recordings of bands we like (read: the Grateful Dead). The UI was designed so that we'd find it instantly familiar and useful. CarPlay / Android Auto support was also a must for us, as we both use CarPlay religiously.


## 📱 Screenshots

*Screenshots taken on iPhone 15 Pro Max*

### Home

<img src="screenshots/home.png" alt="Jellify Home" width="275" height="600">

### Library

Artists

<img src="screenshots/library_artists.png" alt="Library Artists" width="275" height="600">

Downloaded Tracks

<img src="screenshots/library_downloaded_tracks.PNG" alt="Library Tracks" width="275" height="600">

Artist

<img src="screenshots/artist.png" alt="Artist" width="275" height="600">

Similar Artists

<img src="screenshots/artist_similarto.png" alt="Similar Artists" width="275" height="600">

Album

<img src="screenshots/album.png" alt="Album" width="275" height="600">

Album (Multiple Artists)

<img src="screenshots/album_multiple_artists.png" alt="MultiArtist Album" width="275" height="600">

Album (Offline Mode)

<img src="screenshots/offline_album.png" alt="Offline Album" width="275" height="600">

Track Options

<img src="screenshots/track_options.png" alt="Track Options" width="275" height="600">

Playlist

<img src="screenshots/playlist.png" alt="Playlist" width="275" height="600">

### Search

<img src="screenshots/search.png" alt="Search" width="275" height="600">

### Player

<img src="screenshots/player.png" alt="Player" width="275" height="600">

<img src="screenshots/player_queue.png" alt="Queue" width="275" height="600">

<img src='screenshots/favorite_track.png' alt='Favorite Track' width='275' height='600”'>

### CarPlay

<img src="screenshots/carplay_home.png" alt="Home (CarPlay)" width="400" height="250">

### On the Server

<img src="https://github.com/user-attachments/assets/741884a2-b9b7-4081-b3a0-6655d08071dc" alt="Playback Tracking" width="300" height="200">


## 💡 Features

### ✨ Current

- Available via Testflight and Android APK
  - APKs are associated with each [release](https://github.com/anultravioletaurora/Jellify/releases)
- Light and Dark modes
- Home screen access to previously played tracks, artists, and your playlists
- Quick access to similar artists and items for discovering music in your library
- Jellyfin playback reporting and [Last.FM Plugin](https://github.com/jesseward/jellyfin-plugin-lastfm) support
- Full Library Browsing
- Playlist support, including creating, updating, and reordering
- Offline Playback
- Support for Jellyfin Instant Mixes

### 🛠 Roadmap (in order of priority)

- ["Smart Shuffle"](https://github.com/anultravioletaurora/Jellify/issues/57)
- [CarPlay / Android Auto Support](https://github.com/anultravioletaurora/Jellify/issues/5)
- [App Store / Google Play / FDroid Release](https://github.com/anultravioletaurora/Jellify/issues/361)
- [Web / Desktop support](https://github.com/anultravioletaurora/Jellify/issues/71)
- [Shared, Public, and Collaborative Playlists](https://github.com/anultravioletaurora/Jellify/issues/175)
- [Watch (Apple Watch / WearOS) Support](https://github.com/anultravioletaurora/Jellify/issues/61)
- [TV (Android, Apple, Samsung) Support](https://github.com/anultravioletaurora/Jellify/issues/85)

## 🏗 Built with Good Stuff

[![Made with React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org) [![React Native](https://img.shields.io/badge/React-Native-079?logo=react)](https://reactnative.dev) [![Made with TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://typescriptlang.org) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier) [![GitHub License](https://img.shields.io/github/license/anultravioletaurora/jellify?color=indigo)](https://github.com/anultravioletaurora/jellify/blob/main/LICENSE)

### 🎨 Frontend

[Tamagui](https://tamagui.dev/)\
[React Navigation](https://reactnavigation.org/)\
[React Native CarPlay](https://github.com/birkir/react-native-carplay)\
[React Native Draggable Flatlist](https://github.com/computerjazz/react-native-draggable-flatlist)\
[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)\
[React Native Toast Message](https://github.com/calintamas/react-native-toast-message)\
[React Native Vector Icons](https://github.com/oblador/react-native-vector-icons)

- Specifically using [Material Community Icons](https://oblador.github.io/react-native-vector-icons/#MaterialCommunityIcons)

### 🎛️ Backend

[Jellyfin SDK](https://typescript-sdk.jellyfin.org/)\
[Tanstack Query](https://tanstack.com/query/latest/docs/framework/react/react-native)\
[React Native File Access](https://github.com/alpha0010/react-native-file-access)\
[React Native MMKV](https://github.com/mrousavy/react-native-mmkv)\
[React Native Track Player](https://github.com/doublesymmetry/react-native-track-player)\
[React Native URL Polyfill](https://github.com/charpeni/react-native-url-polyfill)

### 👩‍💻 Opt-In Monitoring

All logging and metrics gathering is _opt-in_ __by default__. This is merely here to help us make _Jellify_ better. 

All logs and metrics are completely anonymized. No data can be traced back to you.

[GlitchTip](https://glitchtip.com/)\
[TelemetryDeck](https://telemetrydeck.com)

### 💜 Love from Wisconsin 🧀

This is undoubtedly a passion project of [mine](https://github.com/anultravioletaurora), and I've learned a lot from working on it (and the many failed attempts before it). I hope you enjoy using it! Feature requests and bug reports are welcome :)

## 🙏 Support the Project

You can support _Jellify_ development via [Patreon](https://patreon.com/anultravioletaurora?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink) or [GitHub Sponsors](https://github.com/sponsors/anultravioletaurora) starting at $1.

This allows me to prioritize specific features, acquire additional hardware for testing and development, and helps cover operational costs like Apple Developer Licenses.


## 🏃‍♀️Running Locally

### ⚛️ Universal Dependencies

- [Ruby](https://www.ruby-lang.org/en/documentation/installation/) for Fastlane
- [NodeJS v22](https://nodejs.org/en/download) for React Native

### 🍎 iOS

#### Dependencies

- [Xcode](https://developer.apple.com/xcode/) for building

#### Instructions

##### Setup

- Clone this repository
- Run `yarn init-ios:new-arch` to initialize the project
  - This will install `npm` packages, install `bundler` and required gems, and install required CocoaPods with [React Native's New Architecture](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here#what-is-the-new-architecture)
- In the `ios` directory, run `fastlane match development --readonly` to fetch the development signing certificates
  - _You will need access to the "Jellify Signing" private repository_

##### Running

- Run `yarn start` to start the dev server
- Open the `Jellify.xcodeworkspace` with Xcode, _not_ the `Jellify.xcodeproject`
- Run either on a device or in the simulator
  - _You will need to wait for Xcode to finish it's "Indexing" step_

##### Building

- To create a build, run `yarn fastlane:ios:build` to use fastlane to compile an `.ipa`

### 🤖 Android

#### Dependencies

- [Android Studio](https://developer.android.com/studio)
- [Java Development Kit](https://www.oracle.com/th/java/technologies/downloads/)

#### Instructions

##### Setup

- Clone this repository
- Run `yarn install` to install `npm` packages

##### Running

- Run `yarn start` to start the dev server
- Open the `android` folder with Android Studio
  - _Android Studio should automatically grab the "Run Configurations" and initialize Gradle_
- Run either on a device or in the simulator

##### Building

- To create a build, run `yarn fastlane:android:build` to use fastlane to compile an `.apk` for all architectures

#### References

- [Setting up Android SDK](https://developer.android.com/about/versions/14/setup-sdk)
- [ANDROID_HOME not being set](https://stackoverflow.com/questions/26356359/error-android-home-is-not-set-and-android-command-not-in-your-path-you-must/54888107#54888107)
- [Android Auto app not showing up](https://www.reddit.com/r/AndroidAuto/s/LGYHoSPdXm)

## 🙏 Special Thanks To

- The [Jellyfin Team](https://jellyfin.org/) for making this possible with their software, SDKs, and unequivocal helpfulness.
  - Extra thanks to [Niels](https://github.com/nielsvanvelzen) and [Bill](https://github.com/thornbill)
- [James](https://github.com/jmshrv) and all other contributors of [Finamp](https://github.com/jmshrv/finamp). _Jellify_ draws inspiration and wisdom from it, and is another fantastic music app for Jellyfin.
  - James’ [API Blog Post](https://jmshrv.com/posts/jellyfin-api/) proved to be exceptionally valuable during development
- The folks in the [Margelo Community Discord](https://discord.com/invite/6CSHz2qAvA) for their assistance
- [Nicolas Charpentier](https://github.com/charpeni) for his [React Native URL Polyfill](https://github.com/charpeni/react-native-url-polyfill) module and for his assistance with getting Jest working
- The team behind [Podverse](https://github.com/podverse/podverse-rn) for their incredible open source project, of which was used as a reference extensively during development
- My fellow [contributors](https://github.com/anultravioletaurora/Jellify/graphs/contributors) who have poured so much heart and a lot of sweat into making _Jellify_ a great experience
  - Extra thanks to [John](https://github.com/johngrantdev) and [Vali-98](https://github.com/Vali-98) for shaping and designing the user experience in many places
  - Huge thank you to [Ritesh](https://github.com/riteshshukla04) for your project automation and backend expertise (and for the memes)
- The friends I made along the way that have been critical in fostering an amazing community around _Jellify_
  - [Thalia](https://github.com/PercyGabriel1129)
  - [BotBlake](https://github.com/BotBlake)
- My long time friends that have heard me talk about _Jellify_ for literally **eons**. Thank you for testing _Jellify_ during it's infancy and for supporting me all the way back at the beginning of this project
  - Tony (iOS, Android)
  - Trevor (Android)
  - [Laine](https://github.com/lainie-ftw) (Android)
  - [Jordan](https://github.com/jordanbleu) (iOS)
- My best(est) friend [Alyssa](https://www.instagram.com/uhh.lyssarae?igsh=MTRmczExempnbjBwZw==), for your design knowledge and for making various artwork for _Jellify_.
  - You’ve been instrumental in shaping it’s user experience, my rock during development, and an overall inspiration in my life
