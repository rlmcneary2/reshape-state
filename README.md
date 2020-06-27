# reshape-state

A small [state management library](libs/reshape-state/README.md). Use a reshaper to manage acquiring data for a state object from multiple asynchronous sources.

Also an [example React application](apps/example-app/src/main.tsx).

## Publish

The `build` steps will generate publishable lib output to the `dist` directory. Use the local np command from the workspace root directory (same as this file).

- Delete the `dist` directory.
- Build the library: `yarn build`
- Publish with np, do **not** use global np, the local package in `node_modules` must be used: `./node_modules/.bin/np`
