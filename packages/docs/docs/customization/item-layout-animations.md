---
sidebar_position: 2
description: ''
---

# Item Layout Animations

## Overview

Item layout animations are triggered when the new item is **added** or the item is **removed** from the sortable component.

The library provides one default animation for both cases:

- `SortableItemEntering` - triggered when the new item is **added** to the sortable component
- `SortableItemExiting` - triggered when the item is **removed** from the sortable component

## Usage

You can override default animations by passing a custom animation to the `layoutAnimation` prop of the sortable component.

To learn more about how to create custom animations, you can read the [Custom Animations](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/custom-animations) page in the `react-native-reanimated` docs.

## Props

All sortable components expose the same properties for layout animations. You can see them in the respective component's props documentation page:

- [Sortable Grid](/grid/props#layout-animations)
- [Sortable Flex](/flex/props#layout-animations)
