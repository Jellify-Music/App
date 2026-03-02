import { ListItem, ScrollView, Separator, YGroup } from 'tamagui'
import { SettingsTabList } from '../types'
import Icon from '../../Global/components/icon'
import { ThemeTokens } from 'tamagui'
import React from 'react'
import { Text } from '../../Global/helpers/text'

interface SettingsListGroupProps {
	settingsList: SettingsTabList
	footer?: React.JSX.Element
	borderColor?: ThemeTokens
}

function SettingsListItem({ setting }: { setting: SettingsTabList[number] }) {
	return (
		<>
			<YGroup.Item>
				<ListItem
					size={'$5'}
					title={setting.title}
					icon={<Icon name={setting.iconName} color={setting.iconColor} />}
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
	borderColor,
	footer,
}: SettingsListGroupProps): React.JSX.Element {
	return (
		<ScrollView>
			<YGroup
				alignSelf='center'
				borderWidth={'$1'}
				borderColor={'$borderColor'}
				margin={'$3'}
			>
				{settingsList.map((setting, index, self) => (
					<SettingsListItem key={setting.title} setting={setting} />
				))}
			</YGroup>
			{footer}
		</ScrollView>
	)
}
