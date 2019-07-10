import { User } from "./types";
import uuid from "react-native-uuid";
import * as _ from "lodash";

type GetUserDataResult = {
  users: User[];
  genders: string[];
  nationalities: string[];
};

export function getUserData(): Promise<GetUserDataResult> {
  return new Promise((res, rej) => {
    fetch("https://randomuser.me/api/?results=50").then(response => {
      response.json().then(data => {
        const genders: string[] = _.uniq(
          data.results.map((user: User) => user.gender)
        );

        const nationalities: string[] = _.uniq(
          data.results.map((user: User) => user.nat)
        );

        const users: User[] = _.map(data.results, (user: User) => ({
          ...user,
          id: uuid.v1()
        }));

        res({ users, genders, nationalities });
      });
    });
  });
}
