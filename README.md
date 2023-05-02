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
   isActiveYes([Exit])
   start[["dispatch(Action)"]]
   addAction[add Action to<br/>task-queue]
   firstTimeout["setTimeout()<br/>to process<br/>the next task"]
   isActive{is active?}
   isActiveNo[set active = true]

   loopAction[/Action=null<br/>State=next State/]
   invokeInline[invoke <br/>InlineHandler]
   getAction[get oldest<br/>Action from<br/>task-queue]
   getState["getState()"]
   isActionInlineHandler{is Action an<br/>InlineHandler}
   isStateChanged{was state<br/>changed?}
   isLoopUntilSettled{is<br/>loopUntilSettled<br/>true?}
   onChange["onChange(State)"]
   invokeActionHandler[invoke<br/>ActionHandler]
   isAnotherActionHandler{is there another<br/>ActionHandler?}
   nextAction[/State=next State/]

   isMoreActions{more Actions<br/>in the<br/>task-queue?}
   isMoreActionsNo[Set active=false]
   noMoreActions([Done])
   secondTimeout["setTimeout()<br/>to process<br/>the next task"]
   
   subgraph finished[Finished?]
      isMoreActions-->|no| isMoreActionsNo
      isMoreActionsNo-->noMoreActions
      isMoreActions-->|yes| secondTimeout
   end
   subgraph processAction[Process Action]
      getAction-->getState
      loopAction-->isActionInlineHandler
      getState-->isActionInlineHandler
      isLoopUntilSettled-->|yes| loopAction
      isActionInlineHandler-->|yes| invokeInline
      isActionInlineHandler-->|no| invokeActionHandler
      invokeActionHandler-->isAnotherActionHandler
      isAnotherActionHandler-->|no| isStateChanged
      isStateChanged-->|yes| isLoopUntilSettled
      invokeInline-->isStateChanged
      isAnotherActionHandler-->|yes| nextAction
      nextAction-->invokeActionHandler
      isLoopUntilSettled-->|no| onChange
      onChange-->isMoreActions
      isStateChanged-->|no| isMoreActions
      secondTimeout-.->|<i>async</i>| getAction
   end
   subgraph addTask[Start]
      start-->addAction
      addAction-->firstTimeout
      firstTimeout-.->|<i>async</i>| isActive
      isActive-->|yes| isActiveYes
      isActive-->|no| isActiveNo
      isActiveNo-->getAction
   end

   classDef asyncNode stroke:#F00;
   classDef endNode color:#FFF,fill:#000,stroke:#000
   class firstTimeout,secondTimeout asyncNode
   class isActiveYes,noMoreActions endNode
   linkStyle 2 stroke:#F00,stroke-width:4px
   linkStyle 24 stroke:#F00,stroke-width:4px
```