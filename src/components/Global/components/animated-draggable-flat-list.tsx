import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Animated from 'react-native-reanimated'
import DraggableFlatList from 'react-native-draggable-flatlist'

const AnimatedDraggableFlatList = Animated.createAnimatedComponent(DraggableFlatList<BaseItemDto>)

export default AnimatedDraggableFlatList
