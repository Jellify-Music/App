<p align="center">
  <img alt='Jellify logo' src='assets/transparent-banner.png' width="600" height="300" />
</p>

[![Latest Version](https://img.shields.io/github/package-json/version/anultravioletaurora/jellify?label=Latest%20Version&color=indigo)](https://github.com/anultravioletaurora/Jellify/releases)
[![publish-beta](https://github.com/anultravioletaurora/Jellify/actions/workflows/publish-beta.yml/badge.svg?branch=main)](https://github.com/anultravioletaurora/Jellify/actions/workflows/publish-beta.yml) [![Publish Over-the-Air Update](https://github.com/Jellify-Music/App/actions/workflows/publish-ota-update.yml/badge.svg)](https://github.com/Jellify-Music/App/actions/workflows/publish-ota-update.yml)

[![Sponsors](https://img.shields.io/github/sponsors/anultravioletaurora?label=Project%20Sponsors&color=magenta)](https://github.com/sponsors/anultravioletaurora) [![Patreon](https://img.shields.io/badge/Patreon-F96854?logo=patreon&logoColor=white)](https://patreon.com/anultravioletaurora?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink)


## Quick Links

[TestFlight](https://testflight.apple.com/join/etVSc7ZQ)

[![Discord Server](https://dcbadge.limes.pink/api/server/https://discord.gg/yf8fBatktn)](https://discord.gg/yf8fBatktn)

## Contents

- [Info](#info)
- [Downloading](#downloading)
- [Screenshots](#screenshots)
- [Features and Roadmap](#features)
- [Built with](#built-with-good-stuff)
- [Support](#support-the-project)
- [Special Thanks](#special-thanks)


## Info

> **jellify** (verb) - _to make gelatinous_ <br>
> [see also](https://www.merriam-webster.com/dictionary/jellify)

_Jellify_ is a free and open source music player for the [Jellyfin Media Server](https://jellyfin.org/). Built with [React Native](https://reactnative.dev/), it is available for both iOS and Android.

> _Jellify_ requires a connection to a [Jellyfin Media Server](https://jellyfin.org/) server to work. [See also](https://jellyfin.org/docs/)

Showcasing the artwork of your library, it has a user interface congruent to what _the big guys_ do. _Jellify_ also provides algorithmic curation of your music (not that you have to use _Jellify_ that way). It's designed to be lightweight, and scale to even the largest of music libraries (...like 100K tracks large).

### Background

This app was designed with me and my dad in mind. I wanted us to have a sleek, one stop shop for live recordings of bands we like (read: the Grateful Dead). The UI was designed so that we'd find it instantly familiar and useful. CarPlay / Android Auto support was also a must for us, as we both use CarPlay religiously.

### Recommended Additions

These projects are **not** required to use _Jellify_, but are recommended by us to enrich your Jellyfin music experience!

- [Apple Music Plugin](https://github.com/lyarenei/jellyfin-plugin-itunes)
  - Really good at fetching missing artist artwork for obscure / less popular artists
- [LrcLib Plugin](https://repo.jellyfin.org/files/plugin/manifest.json)
  - Available in the default plugins catalog
  - Really good at fetching song lyrics
- [Jellyfin Rewind](https://github.com/Chaphasilor/jellyfin-rewind)
  - Gives a recap of your year in music listening similar to other music streaming services
  - [A hosted version is provided here](https://jellyfin-rewind.chaphasilor.xyz/)
- [Spotify Playlist Imports](https://github.com/Viperinius/jellyfin-plugin-spotify-import)
  - Imports a user's Spotify playlists into Jellyfin
  - Can run as a scheduled task
- [AudioMuse-AI](https://github.com/NeptuneHub/AudioMuse-AI) and it's [associated plugin](https://github.com/NeptuneHub/audiomuse-ai-plugin)
  - Performs sonic analysis on your music
  - Creates "smart playlists" based on tempo and mood
- [Jellyfin-RPC](https://github.com/Radiicall/jellyfin-rpc)
  - Displays the content you're currently playing on Discord

## Downloading

### Android

Head to [releases](https://github.com/Jellify-Music/App/releases) to download the required .APK directly.

Also there is [obtanium](https://github.com/ImranR98/Obtainium) to which you can add Jellify as a repo to use the above releases as a repository.

For Obtanium, click "Add App", put "https://github.com/Jellify-Music/App" as the source URL, and on the next screen toggle "prereleases". You'll now be easily able to keep your local copy in sync with new releases.

### iOS

#### The TestFlight Way

Join the [TestFlight](https://testflight.apple.com/join/etVSc7ZQ) and install the latest version from there

#### The Sideloading Way

Head to [releases](https://github.com/Jellify-Music/App/releases) to download the required .IPA directly.

Install via [Altstore](https://altstore.io) or your favorite sideloading utility


## Screenshots

*Screenshots taken on iPhone 15 Pro Max*

---

### Home

<p align="center">
  <img src="screenshots/home.png" alt="Jellify Home" width="275" height="600">
</p>

---

### Library

**Artists**

<p align="center">
  <img src="screenshots/library_artists.png" alt="Library Artists" width="275" height="600" />
  <img src="screenshots/library_albums.PNG" alt="Library Albums" width="275" height="600" />
  <img src="screenshots/library_downloaded_tracks.PNG" alt="Library Tracks" width="275" height="600" />
</p>

**Artist View**

<p align="center">
  <img src="screenshots/artist.png" alt="Artist" width="275" height="600">
</p>

**Similar Artists**

<p align="center">
  <img src="screenshots/artist_similarto.png" alt="Similar Artists" width="275" height="600">
</p>

**Album Views**

<p align="center">
  <img src="screenshots/album.png" alt="Album" width="275" height="600">
  <img src="screenshots/album_multiple_artists.png" alt="MultiArtist Album" width="275" height="600">
  <img src="screenshots/offline_album.png" alt="Offline Album" width="275" height="600">
</p>

**Track Options & Add to Playlist**

<p align="center">
  <img src="screenshots/track_options.png" alt="Track Options" width="275" height="600">
  <img src="screenshots/playlist.png" alt="Playlist" width="275" height="600">
</p>

---

### Search

<p align="center">
  <img src="screenshots/search.png" alt="Search" width="275" height="600">
</p>

---

### Player

<p align="center">
  <img src="screenshots/player.png" alt="Player" width="275" height="600">
  <img src="screenshots/player_queue.png" alt="Queue" width="275" height="600">
</p>

---

### CarPlay

<p align="center">
  <img src="screenshots/carplay.gif" alt="CarPlay" width="400" height="250">
</p>

---


## Features

### Current

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
- Over-the-Air Updates
  - Powered by [react-native-nitro-ota](https://github.com/riteshshukla04/react-native-nitro-ota), incremental app updates are automatically fetched and applied from our [App Bundles Repository](https://github.com/Jellify-Music/App-Bundles)
- Shuffling
- Switching Music Libraries
- Google Cast Support

### Roadmap

#### 1.0.0 (We'll Do It Live!) - Dec 5, 2025
- Android Auto/CarPlay
- Quick Connect Support
- Release on App Store and Play Store
- Storage UI Manager
- Album Screen Redesign
- Playlist Screen Redesign
- Allow Self-Signed Certificates

#### 1.1.0 (Socket To Me Baby) - March '26
- Websocket Support (Server online status)
- Home Screen Updates
- Discover Screen Updates
- Artist Screen Redesign

#### 1.2.0 (We Made a Language For Us Two...) - June '26
- Collaborative Playlists
- App Customization Options
- Desktop Support (Experimental)

#### 1.3.0 (Playin' All Day) - September '26
- Autoplay Integration
- Tablet Support

#### 2.0.0  - December '26
- Gapless Playback
- Seerr (formerly Jellyseerr) Integration
- JellyJam
- EQ Controls

#### 3.0.0 - TBD
- Watch Support

\*This is subject to change


## Built with Good Stuff

[![Made with React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org) [![React Native](https://img.shields.io/badge/React-Native-079?logo=react)](https://reactnative.dev) [![Made with TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://typescriptlang.org) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier) [![GitHub License](https://img.shields.io/github/license/anultravioletaurora/jellify?color=indigo)](https://github.com/anultravioletaurora/jellify/blob/main/LICENSE)

### Frontend

[Tamagui](https://tamagui.dev/)\
[Figtree](https://github.com/erikdkennedy/figtree)\
[React Navigation](https://reactnavigation.org/)\
[React Native Blurhash](https://github.com/mrousavy/react-native-blurhash)\
[React Native CarPlay](https://github.com/birkir/react-native-carplay)\
[React Native Draggable Flatlist](https://github.com/computerjazz/react-native-draggable-flatlist)\
[React Native Nitro Image](https://github.com/mrousavy/react-native-nitro-image)\
[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)\
[React Native Toast Message](https://github.com/calintamas/react-native-toast-message)\
[React Native Vector Icons](https://github.com/oblador/react-native-vector-icons)

- Specifically using [Material Community Icons](https://oblador.github.io/react-native-vector-icons/#MaterialCommunityIcons)

### Backend

[Jellyfin SDK](https://typescript-sdk.jellyfin.org/)\
[Tanstack Query](https://tanstack.com/query/latest/docs/framework/react/react-native)\
[React Native DNS Lookup](https://github.com/tableau/react-native-dns-lookup)\
[React Native File Access](https://github.com/alpha0010/react-native-file-access)\
[React Native Google Cast](https://github.com/react-native-google-cast/react-native-google-cast)\
[React Native MMKV](https://github.com/mrousavy/react-native-mmkv)\
[React Native Nitro OTA](https://github.com/riteshshukla04/react-native-nitro-ota)\
[React Native Track Player](https://github.com/doublesymmetry/react-native-track-player)\
[React Native URL Polyfill](https://github.com/charpeni/react-native-url-polyfill)\
[Zustand](https://github.com/pmndrs/zustand)

### Opt-In Monitoring

All logging and metrics gathering is _opt-in_ __by default__. This is merely here to help us make _Jellify_ better. 

All logs and metrics are completely anonymized. No data can be traced back to you.

[GlitchTip](https://glitchtip.com/)

- [See logging statements](https://github.com/search?q=repo%3AJellify-Music%2FApp+console.&type=code&p=1)

[TelemetryDeck](https://telemetrydeck.com)

### Love from Wisconsin 🧀

This is undoubtedly a passion project of [mine](https://github.com/anultravioletaurora), and I've learned a lot from working on it (and the many failed attempts before it). I hope you enjoy using it! Feature requests and bug reports are welcome :)

## Support the Project

You can support _Jellify_ development via [Patreon](https://patreon.com/anultravioletaurora?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink) or [GitHub Sponsors](https://github.com/sponsors/anultravioletaurora) starting at $1.

Paid supporters will be recognized by having their name displayed within the Settings.

## Special Thanks

- The [Jellyfin Team](https://jellyfin.org/) for making this possible with their software, SDKs, and unequivocal helpfulness.
  - Extra thanks to [Niels](https://github.com/nielsvanvelzen) and [Bill](https://github.com/thornbill)
    - They taught me the ways of the AudioAPI and how to do audio transcoding with Jellyfin
- [James](https://github.com/jmshrv), [Chaphasilor](https://github.com/Chaphasilor) and all other contributors of [Finamp](https://github.com/jmshrv/finamp) - another music app for Jellyfin
  - James’ [API Blog Post](https://jmshrv.com/posts/jellyfin-api/) proved to be exceptionally valuable during development
  - Chaphasilor taught me everything they know about audio normalization and LUFS, and their math was referenced in _Jellify_'s audio normalization algorithm
- Marc and the rest of the [Margelo Community](https://discord.com/invite/6CSHz2qAvA) for their amazing modules and support
- [Nicolas Charpentier](https://github.com/charpeni) for his [React Native URL Polyfill](https://github.com/charpeni/react-native-url-polyfill) module and for his assistance with getting Jest working
- The team behind [Podverse](https://github.com/podverse/podverse-rn) for their incredible open source project, of which was used as a reference extensively during development
- My fellow [contributors](https://github.com/anultravioletaurora/Jellify/graphs/contributors) who have poured so much heart and a lot of sweat into making _Jellify_ a great experience
  - Extra thanks to [John](https://github.com/johngrantdev), [Vali-98](https://github.com/Vali-98), and [Erik](https://github.com/felinusfish) for shaping and designing the user experience
  - Shout out to [skalthoff](https://github.com/skalthoff) for championing many features:
    - Gapless Playback
    - Library Selection
    - Quality Selection
  - Many thanks to PDB3D for the logo design!
  - Huge thank you to [Ritesh](https://github.com/riteshshukla04) for literally so many things:
    - Over-the-Air Updates
    - Cast Support
- The friends we made along the way that have been critical in fostering an amazing community around _Jellify_
  - [Thalia](https://github.com/thaliadavar)
  - [BotBlake](https://github.com/BotBlake)
  - [Neptune1987](https://github.com/NeptuneHub)
- My long time friends that have heard me talk about _Jellify_ for literally **eons**. Thank you for testing _Jellify_ during it's infancy and for supporting me all the way back at the beginning of this project
  - Tony (iOS, Android)
  - Trevor (Android)
  - [Laine](https://github.com/lainie-ftw) (Android)
  - [Jordan](https://github.com/jordanbleu) (iOS)
- My best(est) friend [Alyssa](https://www.instagram.com/uhh.lyssarae?igsh=MTRmczExempnbjBwZw==), for your design knowledge and for making various artwork for _Jellify_.
  - You’ve been instrumental in shaping it’s user experience, my rock during development, and an overall inspiration in my life


## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=anultravioletaurora/Jellify,Jellify-Music/App&type=Date)](https://www.star-history.com/#anultravioletaurora/Jellify&Jellify-Music/App&Date)
