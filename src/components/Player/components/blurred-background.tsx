import React from 'react';
import { Image } from 'react-native';
import { JellifyBlurView } from 'jellify-blur';
import { usePlayerContext } from '../../../providers/Player';
import { useJellifyContext } from '../../../providers';
import { View } from 'tamagui';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api';


interface BlurredBackgroundProps {
  width: number;
  height: number;
}

export default function BlurredBackground({ width, height }: BlurredBackgroundProps): React.JSX.Element {
  const { nowPlaying } = usePlayerContext();
  const { api } = useJellifyContext();

  // Get the artwork URL for the current playing item
  const getArtworkUrl = () => {
    return getImageApi(api!).getItemImageUrlById(nowPlaying!.item.AlbumId!)
  };

  const artworkUrl = getArtworkUrl();

  return (
    <View
      position="absolute"
      top={0}
      left={0}
      width={width}
      height={height}
      zIndex={-1}
    >
      {artworkUrl ? (
        <JellifyBlurView
          blurType="dark"
          blurAmount={90}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
          }}
        >
          <Image
            source={{ uri: artworkUrl }}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
            }}
            resizeMode="cover"
          />
          {/* Additional dark overlay for better text readability */}
          <View
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            backgroundColor="rgba(0, 0, 0, 0.3)"
          />
        </JellifyBlurView>
      ) : (
        // Fallback background when no artwork is available
        <JellifyBlurView
          blurType="dark"
          blurAmount={95}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
          }}
        >
          <View
            width="100%"
            height="100%"
            backgroundColor="$background"
          />
        </JellifyBlurView>
      )}
    </View>
  );
} 