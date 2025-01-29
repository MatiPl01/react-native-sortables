<a name="readme-top"></a>

![Banner](https://github.com/user-attachments/assets/fe66c312-54b3-4a91-aaee-2bc48c761f34)

<div align="center">

# <img src="https://github.com/user-attachments/assets/e7dbfceb-63a4-42ef-8c68-f8396a2fbf2e" width="28" /> React Native Sortables

**Powerful Sortable Components for Flexible Content Reordering in React Native**

[Documentation](https://react-native-sortables-docs.vercel.app/) | [Examples](https://react-native-sortables-docs.vercel.app/grid/examples) | [Contributing](./CONTRIBUTING.md)

![npm](https://img.shields.io/npm/dw/react-native-sortables?color=ffd53e)
![GitHub issues](https://img.shields.io/github/issues/MatiPl01/react-native-sortables?color=ffd53e)
![GitHub contributors](https://img.shields.io/github/contributors/MatiPl01/react-native-sortables?color=ffd53e)
![GitHub Release Date](https://img.shields.io/github/release-date/MatiPl01/react-native-sortables?color=ffd53e)
![GitHub](https://img.shields.io/github/license/MatiPl01/react-native-sortables?color=ffd53e)

![GitHub forks](https://img.shields.io/github/forks/MatiPl01/react-native-sortables?style=social)
![GitHub Repo stars](https://img.shields.io/github/stars/MatiPl01/react-native-sortables?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/MatiPl01/react-native-sortables?style=social)

</div>

## Overview

React Native Sortables is a powerful and easy-to-use library that brings smooth, intuitive content reordering to React Native. It provides specialized components whose children can be dynamically reordered through natural dragging gestures.

## Key Features

- 🎯 **Flexible Layouts**

  - **Grid** and **Flex** layout options
  - Support for items with **different dimensions**

- 🚀 **Performance & Reliability**

  - Built with [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) and [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)
  - Supports both **Old** and **New Architecture**
  - Type safe with **TypeScript**
  - **Expo** compatible

- ✨ **Rich Interactions**

  - **Auto-scrolling** beyond screen bounds
  - Customizable **layout animations** for items addition and removal
  - Built-in **haptic feedback** integration (requires [react-native-haptic-feedback](https://github.com/mkuczera/react-native-haptic-feedback) dependency)
  - Different **reordering strategies** (insertion, swapping)

- 💡 **Developer Experience**

  - Simple API with powerful **customization**
  - **Minimal setup** required

- ➕ [More features](https://react-native-sortables-docs.vercel.app/#-key-features)

## Installation

- npm

```sh
npm install react-native-sortables
```

- yarn

```sh
yarn add react-native-sortables
```

### Dependencies

This library is built with:

- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) (version 3.x)
- [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/) (version 2.x)

Make sure to follow their installation instructions for your project.

## Quick Start

```tsx
import { useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

export default function Grid() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <View style={styles.card}>
        <Text>{item}</Text>
      </View>
    ),
    []
  );

  return (
    <Sortable.Grid
      columns={3}
      data={DATA}
      renderItem={renderItem}
      rowGap={10}
      columnGap={10}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#36877F',
    height: 100,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
```

For detailed usage and examples, check out the [Documentation](https://react-native-sortables-docs.vercel.app/).

## Contributing

Contributions are welcome! Please read the [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🌟 Star this repo to show support
- 🐛 Report bugs by [creating an issue](https://github.com/MatiPl01/react-native-sortables/issues)
- 💡 Request features in discussions [open a discussion](https://github.com/MatiPl01/react-native-sortables/discussions)

<p align="right">(<a href="#readme-top">back to top</a>)</p>
