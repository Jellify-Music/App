import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ListItem, Separator, Spacer, XStack, YGroup, YStack } from 'tamagui'
import ItemImage from './image'
import Icon from './icon'
import { H5, Text } from '../helpers/text'

interface ListGroupProps {
	items: BaseItemDto[] | undefined
	limit?: number
	circularImages?: boolean | undefined
	seeMore?: () => void | undefined
}

export default function ListGroup({
	items,
	limit = 5,
	circularImages,
	seeMore,
}: ListGroupProps): React.JSX.Element {
	return (
		<YGroup
			marginHorizontal={'$2'}
			separator={<Separator />}
			borderRadius={'$5'}
			borderWidth={'$1'}
			borderColor={'$borderColor'}
		>
			{items?.slice(0, limit).map((item) => {
				return (
					<YGroup.Item key={item.Id}>
						<ListItem>
							<XStack flex={1}>
								<ItemImage
									item={item}
									circular={circularImages}
									imageOptions={{ maxWidth: 85, maxHeight: 85, quality: 90 }}
								/>
								<Spacer />
								<YStack justifyContent='center' flex={1}>
									<XStack>
										<Text bold fontSize={'$7'}>
											{item.Name ?? 'Untitled'}
										</Text>
										<Text>{item.RecursiveItemCount?.toString() ?? ''}</Text>
									</XStack>

									{item.Genres && (
										<Text>{item.Genres.slice(0, 1).join(', ') ?? ''}</Text>
									)}
								</YStack>
								<Spacer />

								<YStack justifyContent='center' alignContent='flex-end'>
									<Icon name='arrow-right-circle' />
								</YStack>
							</XStack>
						</ListItem>
					</YGroup.Item>
				)
			})}

			{seeMore && (
				<YGroup.Item>
					<ListItem onPress={seeMore}>
						<XStack alignItems='center' height={'$6'} marginHorizontal={'$2.5'}>
							<Icon name='arrow-right-bottom' large />

							<Spacer />
							<Text bold fontSize={'$7'} margin={'$1'} marginTop={'$2.5'}>
								See More
							</Text>
						</XStack>
					</ListItem>
				</YGroup.Item>
			)}
		</YGroup>
	)
}
