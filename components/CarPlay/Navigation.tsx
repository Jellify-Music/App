import { CarPlay, TabBarTemplate } from "react-native-carplay";
import CarPlayHome from "./Home";
import CarPlayDiscover from "./Discover";

const CarPlayNavigation : TabBarTemplate = new TabBarTemplate({
    title: 'Navigation',
    templates: [
        CarPlayHome,
        CarPlayDiscover
    ],
    onTemplateSelect(template, e) {
        if (template)
            CarPlay.pushTemplate(template, true)
    },
});

export default CarPlayNavigation;