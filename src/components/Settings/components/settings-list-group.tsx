import { ListItem, ScrollView, Separator, YGroup } from 'tamagui'
import { SettingsTabList } from '../types'
import Icon from '../../Global/components/icon'
import React from 'react'
import { Text } from '../../Global/helpers/text'

interface SettingsListGroupProps {
	settingsList: SettingsTabList
	footer?: React.JSX.Element
}

function SettingsListItem({ setting }: { setting: SettingsTabList[number] }) {
	return (
		<>
			<YGroup.Item>
				<ListItem
					size={'$4'}
					title={setting.title}
					icon={<Icon name={setting.iconName} color={setting.iconColor} margin={'$2'} />}
					subTitle={
						setting.subTitle && <Text color={'$borderColor'}>{setting.subTitle}</Text>
					}
					onPress={setting.onPress}
					iconAfter={
						setting.onPress ? (
							<Icon name='chevron-right' color={'$borderColor'} />
						) : undefined
					}
				>
					{setting.children}
				</ListItem>
			</YGroup.Item>
		</>
	)
}

export default function SettingsListGroup({
	settingsList,
	footer,
}: SettingsListGroupProps): React.JSX.Element {
	return (
		<ScrollView>
			<YGroup>
				{settingsList.map((setting, index, self) => {
					return (
						<>
							<SettingsListItem key={setting.title} setting={setting} />
							{index < settingsList.length - 1 && (
								<Separator marginHorizontal={'$4'} borderColor={'$borderColor'} />
							)}
						</>
					)
				})}
			</YGroup>
			{footer}
		</ScrollView>
	)
}
