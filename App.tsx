/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/emin93/react-native-template-typescript
 *
 * @format
 */

import React, { Fragment, useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar
} from "react-native";

import * as _ from "lodash";
import SQLite from "react-native-sqlite-storage";

type User = {
  gender: string;
  name: {
    first: string;
    last: string;
  };
  nat: string;
};

const App = () => {
  const [title, setTitle] = useState("waiting");
  const [data, setData] = useState<User[]>([]);
  useEffect(() => {
    async function foo() {
      try {
        await handleUpdates(setData);
        setTitle("Done");
      } catch (e) {
        setTitle("AHHH");
      }
    }
    foo();
  }, []);
  return (
    <Fragment>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <Text>{title}</Text>
          {data.map((data, index) => (
            <Text key={index}>{JSON.stringify(data)}</Text>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Fragment>
  );
};

function dropTables(db: SQLite.SQLiteDatabase): Promise<SQLite.Transaction> {
  return db.transaction(transaction => {
    transaction.executeSql("DROP TABLE IF EXISTS Users;");
    transaction.executeSql("DROP TABLE IF EXISTS Facets;");
    transaction.executeSql("DROP TABLE IF EXISTS FacetValues;");
    transaction.executeSql("DROP TABLE IF EXISTS UserFacets;");
  });
}

function createTables(db: SQLite.SQLiteDatabase): Promise<SQLite.Transaction> {
  return db.transaction(transaction => {
    transaction.executeSql(`
            CREATE TABLE Users(
              user_id INTEGER PRIMARY KEY NOT NULL,
              name TEXT
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

function seedFacets(db: SQLite.SQLiteDatabase): Promise<SQLite.Transaction> {
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

function getUserData(): Promise<[User[], { [key: string]: string[] }]> {
  return new Promise((res, rej) => {
    fetch("https://randomuser.me/api/?results=50").then(response => {
      response.json().then(data => {
        const parsedGenders: string[] = _.uniq(
          data.results.map((user: User) => user.gender)
        );

        const parsedNationalities: string[] = _.uniq(
          data.results.map((user: User) => user.nat)
        );

        res([
          data.results as User[],
          { gender: parsedGenders, nat: parsedNationalities }
        ]);
      });
    });
  });
}

function insertFacetValues(
  db: SQLite.SQLiteDatabase,
  facetValues: { [key: string]: string[] }
): Promise<SQLite.Transaction> {
  return db.transaction(transaction => {
    _.forEach(facetValues["gender"], value => {
      transaction.executeSql(
        `
          INSERT into FacetValues (facet_id, facet_value)
          SELECT facet_id, ?
          FROM Facets as f where f.name = 'gender';
        `,
        [value]
      );
    });

    _.forEach(facetValues["nat"], value => {
      transaction.executeSql(
        `
          INSERT into FacetValues (facet_id, facet_value)
          SELECT facet_id, ?
          FROM Facets as f where f.name = 'nat';
        `,
        [value]
      );
    });
  });
}

async function insertUsers(
  db: SQLite.SQLiteDatabase,
  users: User[]
): Promise<void> {
  await db.transaction(transaction => {
    _.forEach(users, user => {
      transaction.executeSql(
        `
          INSERT into Users (name)
          VALUES(?);
        `,
        [user.name.first],
        (x, y) => console.log(y.rows)
      );
    });
  });
  await db.transaction(transaction => {
    _.forEach(users, user => {
      // transaction.executeSql(
      //   `
      //       INSERT INTO UserFacets(user_id, facet_value_id)
      //       SELECT facet_value_id, user_id
      //       FROM FacetValues fv
      //       JOIN Facets f ON fv.facet_id = f.facet_id;
      //     `
      // );
    });
  });
}

const handleUpdates = async (cb: any) => {
  const db = await SQLite.openDatabase({
    name: "TestDatabase",
    location: "default"
  });
  try {
    await dropTables(db);
    await createTables(db);
    await seedFacets(db);
    const [users, facets] = await getUserData();
    await insertUsers(db, users);
    await insertFacetValues(db, facets);
    try {
      db.transaction(async tx => {
        tx.executeSql(
          `SELECT * FROM Users;`,
          undefined,
          (tx, queryResult) => {
            const items: string[] = _.map(_.range(queryResult.rows.length), x =>
              queryResult.rows.item(x)
            );
            cb(items);
          },
          (tx, error) => {
            console.error(error);
          }
        );
      });
    } catch (e) {
      console.error("HERE", e);
      throw e;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const styles = StyleSheet.create({});

export default App;
