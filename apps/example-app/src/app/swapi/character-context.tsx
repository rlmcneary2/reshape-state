import * as React from "react";
import { State } from "./character-reshaper";
import { OnChange, Reshaper } from "@reshape-state/reshape-state";

const { createContext, useCallback, useEffect, useMemo, useState } = React;

export const Context = createContext<CharacterState>({
  addOnChange: () => {},
  getPerson: () => {},
  removeOnChange: () => {},
  state: {}
});

export function CharacterContext({
  children,
  reshaper
}: React.PropsWithChildren<{ reshaper: Readonly<Reshaper<State>> }>) {
  console.log("CharacterContext: render");

  const [state, setState] = useState<State>({});
  const getPerson = useCallback(
    (id: number) => reshaper.dispatch({ id: "person", payload: id }),
    [reshaper]
  );

  useEffect(() => {
    reshaper.setGetState(() => state);
  }, [reshaper, state]);

  useEffect(() => {
    reshaper.addOnChange(setState);

    return () => {
      reshaper.removeOnChange(setState);
    };
  }, [reshaper]);

  const value = useMemo<CharacterState>(() => {
    const { addOnChange, removeOnChange } = reshaper;
    return {
      addOnChange,
      getPerson,
      removeOnChange,
      state
    };
  }, [getPerson, reshaper, state]);

  console.log("CharacterContext: value=", value);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

type CharacterState = {
  addOnChange: (handleChange: OnChange<State>) => void;
  getPerson: (id: number) => void;
  removeOnChange: (handleChange: OnChange<State>) => void;
  state: State;
};
