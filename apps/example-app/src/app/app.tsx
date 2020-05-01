import * as React from "react";
import Character from "./component/character";

const { useState } = React;

export default function App() {
  console.log("App: render.");

  const [person, setPerson] = useState(1);
  return (
    <>
      <Character id={person} />
      <hr />
      <Character id={person + 1} />
      <button onClick={() => setPerson(person + 1)}>Next</button>
    </>
  );
}
