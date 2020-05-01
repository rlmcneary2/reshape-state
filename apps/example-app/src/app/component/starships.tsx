import * as React from "react";
import useCharacter from "../swapi/use-character";

export default function Starships() {
  const { value: starships } = useCharacter(state => state && state.starships);

  console.log("Starships: render=", starships);

  return (
    <>
      {starships ? (
        typeof starships === "string" ? (
          starships
        ) : (
          <ul>
            {starships.map(s => (
              <li key={s.url}>{s.name}</li>
            ))}
          </ul>
        )
      ) : (
        <div>busy...</div>
      )}
    </>
  );
}
