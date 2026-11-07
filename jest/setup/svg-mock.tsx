import React from 'react'
import Svg, { SvgProps } from 'react-native-svg'

export default function SvgMock(props: SvgProps): React.JSX.Element {
	return <Svg {...props} />
}
