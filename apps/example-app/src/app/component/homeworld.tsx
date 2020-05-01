import * as React from "react";
import useCharacter from "../swapi/use-character";

export default function Homeworld() {
  const { value: homeworld } = useCharacter(state => state && state.homeworld);

  console.log("Homeworld: render=", homeworld);

  return (
    <div>
      {homeworld
        ? typeof homeworld === "string"
          ? homeworld
          : homeworld.name
        : "busy..."}
    </div>
  );
}
