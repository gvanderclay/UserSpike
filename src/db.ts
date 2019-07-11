import SQLite, { SQLiteDatabase } from "react-native-sqlite-storage";
import { User } from "./types";
import * as _ from "lodash";

export const initDatabase = async (): Promise<SQLiteDatabase> => {
  return await SQLite.openDatabase({
    name: "TestDatabase",
    location: "default"
  });
};

export function dropTables(
  db: SQLite.SQLiteDatabase
): Promise<SQLite.Transaction> {
  return db.transaction(transaction => {
    transaction.executeSql("DROP TABLE IF EXISTS Users;");
    transaction.executeSql("DROP TABLE IF EXISTS Facets;");
    transaction.executeSql("DROP TABLE IF EXISTS FacetValues;");
    transaction.executeSql("DROP TABLE IF EXISTS UserFacets;");
  });
}

export function createTables(
  db: SQLite.SQLiteDatabase
): Promise<SQLite.Transaction> {
  return db.transaction(transaction => {
    transaction.executeSql(`
      CREATE TABLE Users(
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT,
        user_id TEXT NOT NULL UNIQUE
      );
    `);

    transaction.executeSql(`
      CREATE TABLE Facets(
        facet_id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE
      );
    `);

    transaction.executeSql(`
      CREATE TABLE FacetValues(
        facet_value_id INTEGER PRIMARY KEY NOT NULL,
        facet_id INTEGER,
        facet_value TEXT NOT NULL,
        FOREIGN KEY(facet_id) REFERENCES Facets(facet_id)
      );
    `);

    transaction.executeSql(`
      CREATE TABLE UserFacets(
        user_id INTEGER NOT NULL,
        facet_value_id INTEGER NOT NULL,
        FOREIGN KEY(facet_value_id) REFERENCES FacetValues(facet_value_id)
        FOREIGN KEY(user_id) REFERENCES Users(user_id)
      );
    `);
  });
}

export function seedFacets(
  db: SQLite.SQLiteDatabase
): Promise<SQLite.Transaction> {
  return db.transaction(transaction => {
    transaction.executeSql(`
      INSERT into Facets (name)
      VALUES ('gender');
    `);

    transaction.executeSql(`
        INSERT into Facets (name)
        VALUES ('nat');
    `);
  });
}

export function insertFacetValues(
  db: SQLite.SQLiteDatabase,
  facetValues: { gender: string[]; nat: string[] }
): Promise<SQLite.Transaction> {
  return db.transaction(async transaction => {
    for (const value of facetValues.gender) {
      await transaction.executeSql(
        `
            INSERT into FacetValues (facet_id, facet_value)
            SELECT facet_id, ?
            FROM Facets as f where f.name = 'gender';
          `,
        [value]
      );
    }
    for (const value of facetValues.nat) {
      await transaction.executeSql(
        `
            INSERT into FacetValues (facet_id, facet_value)
            SELECT facet_id, ?
            FROM Facets as f where f.name = 'nat';
          `,
        [value]
      );
    }
  });
}

export async function insertUsers(
  db: SQLite.SQLiteDatabase,
  users: User[]
): Promise<void> {
  await db.transaction(transaction => {
    _.forEach(users, user => {
      transaction.executeSql(
        `
          INSERT into Users (name, user_id)
          VALUES(?, ?);
        `,
        [user.name.first, user.id]
      );
    });
  });
  await db.transaction(transaction => {
    _.forEach(users, user => {
      transaction.executeSql(
        `
            INSERT into UserFacets (user_id, facet_value_id)
            SELECT ?, fv.facet_value_id
            FROM FacetValues fv
            JOIN Facets f ON fv.facet_id = f.facet_id
            WHERE f.name = 'gender' and fv.facet_value = ?;,
        `,
        [user.id, user.gender]
      );
      transaction.executeSql(
        `
            INSERT into UserFacets (user_id, facet_value_id)
            SELECT ?, fv.facet_value_id
            FROM FacetValues fv
            JOIN Facets f ON fv.facet_id = f.facet_id
            WHERE f.name = 'nat' and fv.facet_value = ?;,
        `,
        [user.id, user.nat]
      );
    });
  });
}

export type UserQueryResult = {
  usersName: string;
  userId: string;
  facetValue: string;
  facetValueId: number;
  facetName: string;
};

export const queryForUsers = async (
  db: SQLite.SQLiteDatabase
): Promise<UserQueryResult[]> => {
  return new Promise(async (res, rej) => {
    await db.transaction(async tx => {
      tx.executeSql(
        `
            SELECT u.name as usersName, u.user_id as userId, fv.facet_value as facetValue, f.name as facetName, fv.facet_value_id as facetValueId
            FROM Users u
            JOIN UserFacets uf on u.user_id = uf.user_id
            JOIN FacetValues fv on uf.facet_value_id = fv.facet_value_id
            JOIN Facets f on fv.facet_id = f.facet_id;
           `,
        undefined,
        (tx, queryResult) => {
          const items: UserQueryResult[] = _.map(
            _.range(queryResult.rows.length),
            x => queryResult.rows.item(x)
          );
          res(items);
        },
        (tx, error) => {
          console.error(error);
          rej(error);
        }
      );
    });
  });
};

export const queryForUsersWithFacets = async (
  db: SQLite.SQLiteDatabase,
  facetValueIds: number[]
): Promise<UserQueryResult[]> => {
  return new Promise(async (res, rej) => {
    await db.transaction(async tx => {
      const andQuery = _.map(facetValueIds, id => {
        return `
          AND uf.user_id IN (SELECT uf2.user_id From UserFacets uf2
          where uf2.facet_value_id = ${id})
        `;
      });
      tx.executeSql(
        `
            SELECT u.name as usersName, u.user_id as userId, fv.facet_value as facetValue, f.name as facetName, fv.facet_value_id as facetValueId
            FROM Users u
            JOIN UserFacets uf on u.user_id = uf.user_id
            JOIN FacetValues fv on uf.facet_value_id = fv.facet_value_id
            JOIN Facets f on fv.facet_id = f.facet_id
            ${andQuery.join(" ")}
           `,
        undefined,
        (tx, queryResult) => {
          const items: UserQueryResult[] = _.map(
            _.range(queryResult.rows.length),
            x => queryResult.rows.item(x)
          );
          res(items);
        },
        (tx, error) => {
          console.error(error);
          rej(error);
        }
      );
    });
  });
};

export const queryForFacetValues = async (
  db: SQLite.SQLiteDatabase
): Promise<any> => {
  return new Promise(async (res, rej) => {
    await db.transaction(async tx => {
      tx.executeSql(
        `SELECT * FROM FacetValues uf2;`,
        undefined,
        (trx, result) => {
          res(_.map(_.range(result.rows.length), i => result.rows.item(i)));
        }
      );
    });
  });
};

export const queryForFacetNumbers = async (
  db: SQLite.SQLiteDatabase,
  facetValueId: number
): Promise<number> => {
  return new Promise(async (res, rej) => {
    await db.transaction(async tx => {
      const query = `
          SELECT COUNT(*) as facetValueCount
          FROM UserFacets uf
          JOIN Users u on uf.user_id = u.user_id
          JOIN FacetValues fv on uf.facet_value_id = fv.facet_value_id
          AND uf.facet_value_id = ?
        `;
      tx.executeSql(query, [facetValueId], (trx, result) => {
        const items = _.map(_.range(result.rows.length), i =>
          result.rows.item(i)
        );
        res(items[0].facetValueCount || 0);
      });
    });
  });
};

export const queryForFacetNumbersWithUserIds = async (
  db: SQLite.SQLiteDatabase,
  facetValueIds: number[],
  userIds: string[]
): Promise<number> => {
  return new Promise(async (res, rej) => {
    await db.transaction(async tx => {
      const query = `
          SELECT COUNT(*) as facetValueCount
          FROM UserFacets uf
          JOIN Users u on uf.user_id = u.user_id
          JOIN FacetValues fv on uf.facet_value_id = fv.facet_value_id
          AND uf.facet_value_id in (${facetValueIds.map(v => `${v}`).join(",")})
          AND uf.user_id in (${userIds.map(v => `'${v}'`).join(",")})
        `;
      tx.executeSql(query, undefined, (trx, result) => {
        const items = _.map(_.range(result.rows.length), i =>
          result.rows.item(i)
        );
        res(items[0].facetValueCount || 0);
      });
    });
  });
};
