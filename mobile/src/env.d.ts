// Type declarations for Expo public environment variables.
// Expo's Metro bundler inlines EXPO_PUBLIC_* at build time via process.env.
// We declare just enough of the `process` global to satisfy TypeScript
// without pulling in the full @types/node package.
declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    [key: string]: string | undefined;
  };
};
