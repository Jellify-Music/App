import { Button as TamaguiButton } from 'tamagui';

// Hardcoded theme for focus - not ideal

interface ButtonProps {
    children?: Element | string | undefined;
    onPress?: () => void | undefined;
    disabled?: boolean | undefined;
    danger?: boolean | undefined;
    focus?: boolean | undefined;
}

export default function Button(props: ButtonProps): React.JSX.Element {

    return (
        <TamaguiButton 
            disabled={props.disabled}
            bordered
            onPress={props.onPress}
            theme={props.focus ? "dark_inverted_purple" : undefined}
        >
            { props.children }
        </TamaguiButton>
    )
}