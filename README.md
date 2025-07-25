<a name="readme-top"></a>

![Banner](https://github.com/user-attachments/assets/532e7ed2-9035-4d5b-9df9-b349ee41608e)

<div align="center">

# <img src="https://github.com/user-attachments/assets/e7dbfceb-63a4-42ef-8c68-f8396a2fbf2e" width="28" /> React Native Sortables

**Powerful Sortable Components for Flexible Content Reordering in React Native**

[Documentation](https://react-native-sortables-docs.vercel.app/) | [Real-World Examples](https://github.com/MatiPl01/react-native-sortables-demos) | [Simple Usage Examples](https://react-native-sortables-docs.vercel.app/grid/examples) | [Contributing](./CONTRIBUTING.md)

![npm](https://img.shields.io/npm/dw/react-native-sortables?color=36877F)
![GitHub issues](https://img.shields.io/github/issues/MatiPl01/react-native-sortables?color=36877F)
![GitHub contributors](https://img.shields.io/github/contributors/MatiPl01/react-native-sortables?color=36877F)
![GitHub Release Date](https://img.shields.io/github/release-date/MatiPl01/react-native-sortables?color=36877F)
![GitHub](https://img.shields.io/github/license/MatiPl01/react-native-sortables?color=36877F)

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

- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) (version 3.x, 4.x)
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

## Local Library Development

1. Clone and setup:

   ```bash
   git clone https://github.com/MatiPl01/react-native-sortables.git
   cd react-native-sortables
   yarn
   yarn pod  # iOS only
   ```

2. Start an example app:

   ```bash
   cd example/fabric  # or any other example
   yarn start
   ```

   Available example apps:

   - `fabric` - React Native Fabric example
   - `paper` - React Native Paper example
   - `expo` - Expo example
   - `web` - Web example

   You can also run commands from the project root using the `yarn example:<name> <command>` syntax, e.g.:

   ```bash
   yarn example:fabric start
   yarn example:paper android
   yarn example:expo ios
   ```

3. Build and run:
   - iOS: `yarn ios` or build in Xcode
   - Android: `yarn android` or build in Android Studio

## Contributing

Contributions are welcome! Please read the [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🌟 Star this repo to show support
- 🐛 Report bugs by [creating an issue](https://github.com/MatiPl01/react-native-sortables/issues)
- 💡 Request features in discussions [open a discussion](https://github.com/MatiPl01/react-native-sortables/discussions)

<p align="right">(<a href="#readme-top">back to top</a>)</p>
