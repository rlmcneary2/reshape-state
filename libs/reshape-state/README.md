# reshape-state

A small state management library. Use a reshaper to manage acquiring data for a
state object from multiple asynchronous sources.

## Install

```bash
yarn add reshape-state
```

## Usage

### Create

Create a reshaper that will manage state change actions, manipulating state, and
notifying subscribers when it changes.

```ts
import { create } from "reshape-state";

const reshaper = create<State>();
```

### Listen for changes

Add an OnChange callback to be notified when state changes.

```ts
reshaper.addOnChange(state => console.log("state changed=", state));
```

### Dispatch actions

When state needs to be changed use dispatch with one or more actions as
parameters. The action has one required property `id` which can be a string or
number. The optional `payload` contains information used to update state.

```ts
reshaper.dispatch({ id: "name", payload: "Alice" }, { id: "age", payload: 30 });
```

### Update state

Add handler functions to change state.

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
  },
]);
```

The handler functions must be synchronous and return at least a state object but
they can start asynchronous code and dispatch an action when they finish (i.e
they can have "side-effects"). In fact handlers don't have to react to an
action, they can do something based on the current shape of the state. In the
example below once state contains a `name` the address associated with that name
will be fetched. The idea is that changing one piece of state can cause another
one to be updated without requiring an intermediate action.

```ts
reshaper.addHandlers([
  (state, _, dispatch) => {
    if (state.name && !state.address) {
      fetch(`${address_url}?name=${state.name}`).then(response =>
        dispatch({ id: "address", payload: response })
      );
    }

    return [state];
  },
  (state, action) => {
    if (action.id === "address") {
      state.address = action.payload;
      return [state, true];
    }

    return [state];
  },
]);
```

You may have noticed state can be mutated - or not - it's up to you. State
change is indicated by the optional second element in the return array not by
object equality. If the second element is not provided the default is that state
has not changed.

### Dispatch inline handlers

Typically after starting asynchronous code in a handler the convention is to
dispatch another action which will inform all handlers of the asynchronous
code's completion and one or more of the handlers will use the action to update
state. Sometimes there is no no need to inform all the handlers about the
asynchronous result but simply to update state with the asynchroouse result. In
this case an `InlineHandler` can be dispatched which will be invoked with the
current state. Like other handler functions it must synchronously return a state
object and an indication if the state has changed.

```ts
reshaper.addHandlers([
  (state, action, dispatch) => {
    if (action.id === "address") {
      fetch(`${address_url}?name=${state.name}`).then(response =>
        // Dispatch an InlineHandler that will update state with the
        // asynchronous result when it is invoked.
        dispatch(state => {
          state.address = response;
          return [state, true];
        });
      );
    }

    return [state];
  },
]);
```

### Remove listeners and handlers

If the reshaper is no longer needed the OnChange callback and handlers should be
removed.

```ts
reshaper.removeHandlers(handlers);
reshaper.removeOnChange(handleChange);
```
