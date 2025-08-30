# Android Auto Integration

Jellify now supports Android Auto using the `react-native-sportscar` library. This integration provides access to recently played tracks directly in your vehicle's Android Auto interface.

## Features

- **Recently Played Tracks**: Access your recently played music directly from Android Auto
- **Automatic Updates**: The Android Auto interface updates automatically when new tracks are played
- **Rich Metadata**: Displays track information including artist, album, and artwork
- **Seamless Integration**: Works alongside the existing CarPlay integration

## Implementation Details

### Data Formatting

The integration uses a custom formatter (`src/utils/sportscar-formatter.ts`) that first converts Jellyfin `BaseItemDto` objects to the internal track format using the existing `mapDtoToTrack` function, then converts that to the format expected by `react-native-sportscar`. This ensures consistency with the rest of the app and proper handling of:

- Downloaded tracks (prioritized over streaming)
- Device profiles for transcoding
- Media source information
- Proper URL generation for streaming

```typescript
interface SportsCarItem {
  id: string
  title: string
  subtitle?: string
  isPlayable: boolean
  mediaType?: 'audio' | 'video' | 'folder'
  layoutType?: 'list' | 'grid'
  iconUrl?: string
  mediaUrl?: string
  durationMs?: number
  metadata?: Record<string, any>
  children?: SportsCarItem[]
}
```

### Initialization

The SportsCar integration is initialized in `src/components/SportsCarInitializer.tsx` using a `useEffect` hook that:

1. Checks if the platform is Android
2. Waits for the API and recent tracks to be available (from HomeContext)
3. Formats the data using `createSportsCarData()`
4. Initializes the Android Auto media library

The `SportsCarInitializer` component is placed inside the `HomeProvider` in `src/screens/Home/index.tsx` to ensure it has access to the HomeContext. It also uses:

- `useAllDownloadedTracks()` to access downloaded tracks
- `useStreamingDeviceProfile()` to get the current device profile for transcoding
- These are passed to the formatter to ensure proper track mapping

### Event Handling

The integration includes event listeners for:
- `playbackStateChanged`: Tracks changes in playback state
- `mediaChanged`: Tracks when the current media changes
- `positionChanged`: Tracks position changes during playback

### Automatic Updates

When new tracks are played and added to the recently played list, the Android Auto interface is automatically updated using `updateMediaLibrary()`.

## Configuration

The Android Auto service is configured in `android/app/src/main/AndroidManifest.xml`:

```xml
<service
    android:name="com.sportscar.service.AndroidAutoMediaService"
    android:exported="true"
    android:foregroundServiceType="mediaPlayback">
    <intent-filter>
        <action android:name="android.media.browse.MediaBrowserService" />
    </intent-filter>
</service>
```

## Usage

1. Connect your Android device to a vehicle with Android Auto
2. Launch Jellify on your device
3. The recently played tracks will be available in the Android Auto media browser
4. Select tracks to play them through your vehicle's audio system

## Troubleshooting

- Ensure your device supports Android Auto
- Check that the Jellyfin server is accessible
- Verify that you have recently played tracks in your library
- Check the console logs for any initialization errors

## Future Enhancements

Potential future enhancements include:
- Support for playlists in Android Auto
- Artist and album browsing
- Search functionality
- Custom Android Auto themes
