# reshape-state

A small state management library. Use a reshaper to manage acquiring data for a state object from multiple asynchronous sources.

## Install

```bash
yarn add reshape-state
```

## Usage

Create a reshaper.

```ts
import { create } from "reshape-state";

const reshaper = create<State>();
```

Add handler functions to handle actions.

```ts
reshaper.addHandlers([
  (state, action) => {
    if (action.id === "name") {
      state.name = action.payload;
      return [state, true];
    }

    return [state];
  },
  (state, action) => {
    if (action.id === "family-name") {
      state.familyName = action.payload;
      return [state, true];
    }

    return [state];
  }
]);
```

The handler functions have to be synchronous, but they can start asynchronous code and dispatch an action when they finish.

```ts
reshaper.addHandlers([
  (state, _, dispatch) => {
    if (state.name && !state.address) {
      fetch(`${address_url}?name=${state.name}`)
        .then(response => (dispatch({ id: "address", payload: response })))
    }

    return [state];
  },
  (state, action) => {
    if (action.id === "address") {
      state.address = action.payload;
      return [state, true];
    }

    return [state];
  }
]);
```

You may have noticed state can be mutated or not, it's up to you. State change is indicated by the second element in the return array not by object equality.
