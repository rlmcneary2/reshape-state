# reshape-state

A small [state management library](libs/reshape-state/README.md). Use a reshaper to manage acquiring data for a state object from multiple asynchronous sources.

## Use and Documentation

The [README](libs/reshape-state/README.md) will get you started using reshape-state.

## Example

This repo. includes code of an [example React application](apps/example-app/src/main.tsx). Live examples can be found on [codesandbox](https://codesandbox.io/s/reshape-state-0617h).

## Publish

Execute the following steps starting in the workspace root directory (same as this file).

- Bump the package.json version field.
- Delete the `dist` directory.
- Build the library: `yarn build`
- Delete the comments that are added by Microsoft from the js files in `dist`.
- `cd` into the "dist/libs/reshape-state" directory.
- `npm publish` using the same version as in the package.json file.

## Technical Details

### Action Processing

Documents the logic implemented to process the Actions in the task-queue.

```mermaid
%%{ init: { "flowchart": { "curve": "linear" } } }%%
flowchart TD
   subgraph addTask[Add Task]
      direction LR
      start[["dispatch(Action)"]]-->
      addAction[add Action to<br/>task-queue]-->
      firstTimeout["setTimeout()<br/>to process<br/>the next task"]-.->|<i>async</i>| isActive{is active?}
      isActive-->|yes| isActiveYes([Exit])
      isActive-->|no| isActiveNo[set active = true]
   end
   subgraph processAction[Process Action]
      direction LR
      isActiveNo-->getTask
      getTask[get oldest<br/>Action from<br/>task-queue]-->
      getState["getState()"]-->
      isInline{is Action an<br/>InlineHandler}-->|no| invokeActionHandler[invoke<br/>ActionHandler]

      invokeActionHandler-->isAnotherAction{is there another<br/>ActionHandler?}
      isAnotherAction-->|yes| nextAction[/State=next State/]
      nextAction-->invokeActionHandler
      isAnotherAction-->|no| isStateChanged

      isInline-->|yes| invokeInline[invoke <br/>InlineHandler]
      invokeInline-->isStateChanged{was state<br/>changed?}
      isStateChanged-->|yes| isLoopUntilSettled{is<br/>loopUntilSettled<br/>true?}
      isLoopUntilSettled-->|yes| loopAction[/Action=null<br/>State=next State/]
      loopAction-->isInline
      isLoopUntilSettled-->|no| onChange["onChange(State)"]
   end
   subgraph finished[Finished?]
      direction LR
      isStateChanged-->|no| isMoreActions{more Actions<br/>in the<br/>task-queue?}
      onChange-->isMoreActions
      isMoreActions-->|no| isMoreActionsNo[Set active=false]
      isMoreActionsNo-->noMoreActions([Done])
      isMoreActions-->|yes| secondTimeout["setTimeout()<br/>to process<br/>the next task"]
      secondTimeout-.->|<i>async</i>| getTask
   end

   classDef asyncNode stroke:#F00;
   classDef endNode color:#FFF,fill:#000,stroke:#000
   class firstTimeout,secondTimeout asyncNode
   class isActiveYes,noMoreActions endNode
   linkStyle 2 stroke:#F00,stroke-width:4px
   linkStyle 24 stroke:#F00,stroke-width:4px
```