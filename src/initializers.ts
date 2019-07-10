import {
  initDatabase,
  dropTables,
  createTables,
  seedFacets,
  insertFacetValues,
  insertUsers,
  queryForUsers
} from "./db";
import { getUserData } from "./api";
import { User, Facet } from "./types";
import {
  userQueryResultToDomain as userQueryResultToUsers,
  userQueryResultToFacets
} from "./domain-converters";

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
  facets: Facet[];
};

export const getInformation = async (): Promise<AppInfo> => {
  const db = await initDatabase();
  const queriedUsers = await queryForUsers(db);
  const users = userQueryResultToUsers(queriedUsers);
  const facets = userQueryResultToFacets(queriedUsers);
  return { users, facets };
};
