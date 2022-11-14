import {
  create as createReshaper,
  Reshaper
} from "@reshape-state/reshape-state";

//
// Thank you!
// https://swapi.dev/
//

export function create(): Readonly<Reshaper<State>> {
  let getPeopleInProgress = false;
  let getHomeworldInProgress = false;
  let getStarshipsInProgress = false;

  return createReshaper<State>().addHandlers([
    (state, action, dispatch) => {
      if (action.id !== "person" || getPeopleInProgress) {
        return [state];
      }

      if (state.person && state.person.url.endsWith(`${action.payload}/`)) {
        return [state];
      }

      getPeopleInProgress = true;

      get<Person>("people", action.payload)
        .then(data => {
          dispatch({
            id: `${action.id}-received`,
            payload: data
          });
        })
        .catch(() => (getPeopleInProgress = false));

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { homeworld, person, starships, ...nextState } = state;
      return [nextState, true];
    },
    (state, action) => {
      if (action.id !== "person-received") {
        return [state];
      }

      getPeopleInProgress = false;

      state.person = action.payload;
      return [state, true];
    },
    (state, action, dispatch) => {
      if (!state.person || state.homeworld || getHomeworldInProgress) {
        return [state];
      }

      if (!state.person.homeworld) {
        state.homeworld = "?";
        return [state, true];
      }

      getHomeworldInProgress = true;

      const [, uid] = state.person.homeworld.split("/").reverse();

      get<Planet>("planets", uid)
        .then(data => {
          dispatch({
            id: "planets-received",
            payload: data
          });
        })
        .catch(() => (getHomeworldInProgress = false));

      return [state];
    },
    (state, action) => {
      if (action.id !== "planets-received") {
        return [state];
      }

      getHomeworldInProgress = false;

      state.homeworld = action.payload;
      return [state, true];
    },
    (state, action, dispatch) => {
      if (!state.person || state.starships || getStarshipsInProgress) {
        return [state];
      }

      if (!state.person.starships) {
        state.starships = "?";
        return [state, true];
      }

      getStarshipsInProgress = true;

      const uids = state.person.starships.map(s => {
        const [, uid] = s.split("/").reverse();
        return uid;
      });

      Promise.all<Starship>(
        uids.map((uid: string | number) => {
          return get("starships", uid);
        })
      )
        .then(data => {
          dispatch({
            id: "starships-received",
            payload: data
          });
        })
        .catch(() => (getStarshipsInProgress = false));

      return [state];
    },
    (state, action) => {
      if (action.id !== "starships-received") {
        return [state];
      }

      getStarshipsInProgress = false;

      state.starships = action.payload;
      return [state, true];
    }
  ]);
}

const BASE_URL = "https://swapi.dev/api/";

async function get<T = unknown>(
  path: SwapiPath,
  id: number | string
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}/${id}/`);
  return (await response.json()) as T;
}

export type Planet =
  | {
      name: string;
      url: string;
    }
  | "?";

export type Person = {
  homeworld?: string;
  name: string;
  starships?: string[];
  url: string;
};

export type Starship = {
  name: string;
  url: string;
};

export type Starships = Starship[] | "?";

export type State = {
  homeworld?: Planet;
  person?: Person;
  starships?: Starships;
};

type SwapiPath = "people" | "planets" | "starships";
