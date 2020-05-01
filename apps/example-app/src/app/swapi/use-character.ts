import * as React from "react";
import { State } from "./character-reshaper";
import { Context } from "./character-context";

const { useContext, useEffect, useMemo, useState } = React;

export default function useCharacter<T>(
  selector?: (state: State) => T
): { getPerson: (id: number) => void; value?: T } {
  const { addOnChange, getPerson, removeOnChange } = useContext(Context);
  const [selected, setSelected] = useState<T>();

  useEffect(() => {
    function handleOnChange(nextState: State) {
      if (selector) {
        const nextSelected = selector(nextState);
        setSelected(nextSelected);
      }
    }

    addOnChange(handleOnChange);
    return () => {
      removeOnChange(handleOnChange);
    };
  }, [addOnChange, removeOnChange, selector]);

  return useMemo(
    () => ({
      getPerson,
      value: selected
    }),
    [getPerson, selected]
  );
}
