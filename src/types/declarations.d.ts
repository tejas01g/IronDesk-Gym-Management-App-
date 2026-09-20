import 'react-native';
import '@shopify/flash-list';

declare module 'react-native' {
  export const StatusBar: any;
  export type StatusBar = any;
}

declare module '@shopify/flash-list' {
  interface FlashListProps<TItem> {
    estimatedItemSize?: number;
  }
}
