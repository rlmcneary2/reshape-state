import * as React from "react";
import Homeworld from "./homeworld";
import Person from "./person";
import Starships from "./starships";
import useCharacter from "../swapi/use-character";
import { CharacterContext } from "../swapi/character-context";
import { create } from "../swapi/character-reshaper";

export default function Character(props: Props) {
  return (
    <CharacterContext reshaper={create()}>
      <CharacterInner {...props} />
    </CharacterContext>
  );
}

function CharacterInner({ id }: Props) {
  const { getPerson } = useCharacter();

  console.log("CharacterInner: render.");

  React.useEffect(() => {
    getPerson(id);
  }, [getPerson, id]);

  return (
    <>
      <Person />
      <Homeworld />
      <Starships />
    </>
  );
}

export type Props = {
  id: number;
};
