# reshape-state

A small [state management library](libs/reshape-state/README.md). Use a reshaper to manage acquiring data for a state object from multiple asynchronous sources.

Also an [example React application](apps/example-app/src/main.tsx).

## Publish

The `build` steps will generate publishable lib output to the `dist` directory. Use the local np command from the workspace root directory (same as this file).

- Bump the package.json version field.
- Delete the `dist` directory.
- Build the library: `yarn build`
- `cd` into the "dist/lib/reshape-state" directory.
- Delete the comments that are added by Microsoft from the js files.
- `npm publish` use the same version as in the package.json file.
