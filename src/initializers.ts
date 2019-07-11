import {
  initDatabase,
  dropTables,
  createTables,
  seedFacets,
  insertFacetValues,
  insertUsers,
  queryForUsers,
  queryForFacetNumbers,
  queryForUsersWithFacets,
  queryForFacetNumbersWithUserIds
} from "./db";
import { getUserData } from "./api";
import { User, Facet, FacetWithFacetValueCount, FacetValue } from "./types";
import {
  userQueryResultToDomain as userQueryResultToUsers,
  userQueryResultToFacets
} from "./domain-converters";
import _ from "lodash";

export const initializeData = async () => {
  const db = await initDatabase();
  await dropTables(db);
  await createTables(db);
  await seedFacets(db);
  const { users, genders, nationalities } = await getUserData();
  await insertFacetValues(db, { gender: genders, nat: nationalities });
  await insertUsers(db, users);
};

type AppInfo = {
  users: User[];
  facets: FacetWithFacetValueCount[];
};

export const getInformation = async (
  selectedFacetValues?: number[]
): Promise<AppInfo> => {
  const db = await initDatabase();
  const queriedUsers = await (selectedFacetValues &&
  selectedFacetValues.length > 0
    ? queryForUsersWithFacets(db, selectedFacetValues)
    : queryForUsers(db));
  const users = userQueryResultToUsers(queriedUsers);
  const facetsWithoutCount = userQueryResultToFacets(queriedUsers);
  const facets: FacetWithFacetValueCount[] = await Promise.all(
    _.map(facetsWithoutCount, async facet => {
      return {
        ...facet,
        values: await Promise.all(
          _.map(facet.values, async value => {
            return {
              id: value.id,
              name: value.name,
              count: await queryForFacetNumbersWithUserIds(
                db,
                [value.id],
                _.map(users, user => user.id)
              )
            };
          })
        )
      };
    })
  );
  return { users, facets };
};
