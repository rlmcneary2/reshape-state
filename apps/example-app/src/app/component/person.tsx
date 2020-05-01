import * as React from "react";
import useCharacter from "../swapi/use-character";

export default function Person() {
  const { value: person } = useCharacter(state => state && state.person);

  console.log("Person: render=", person);

  return <div>{person ? person.name : "busy..."}</div>;
}
