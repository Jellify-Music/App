import { ListItem, ScrollView, Separator, YGroup } from 'tamagui'
import { SettingsTabList } from '../types'
import Icon from '../../Global/components/icon'
import { ThemeTokens } from 'tamagui'
import React from 'react'

interface SettingsListGroupProps {
	settingsList: SettingsTabList
	footer?: React.JSX.Element
	borderColor?: ThemeTokens
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
				borderColor={borderColor ?? '$borderColor'}
				borderWidth={'$1'}
				borderRadius={'$4'}
				margin={'$4'}
			>
				{settingsList.map((setting, index, self) => (
					<>
						<YGroup.Item key={setting.title}>
							<ListItem
								size={'$5'}
								title={setting.title}
								icon={<Icon name={setting.iconName} color={setting.iconColor} />}
								subTitle={setting.subTitle}
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

						{index !== self.length - 1 && <Separator />}
					</>
				))}
			</YGroup>
			{footer}
		</ScrollView>
	)
}
