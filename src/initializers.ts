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
import { User } from "./types";
import { userQueryResultToDomain } from "./domain-converters";

export const initializeData = async () => {
  const db = await initDatabase();
  await dropTables(db);
  await createTables(db);
  await seedFacets(db);
  const { users, genders, nationalities } = await getUserData();
  await insertFacetValues(db, { gender: genders, nat: nationalities });
  await insertUsers(db, users);
};

export const getUserInformation = async (): Promise<User[]> => {
  const db = await initDatabase();
  const queriedUsers = await queryForUsers(db);
  return userQueryResultToDomain(queriedUsers);
};
