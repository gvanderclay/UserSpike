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
import uuid from "react-native-uuid";

type User = {
  gender: string;
  name: {
    first: string;
    last: string;
  };
  nat: string;
  id: {
    value: string;
  };
};

type Facet = {
  name: string;
  values: string[];
};

const App = () => {
  const [title, setTitle] = useState("waiting");
  const [data, setData] = useState<User[]>([]);
  const [facets, setFacets] = useState<Facet[]>([]);
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
          {data.map((data, index) => [
            <Text key={index}>{JSON.stringify(data)}</Text>,
            <Text>_____________________________________</Text>
          ])}
        </ScrollView>
      </SafeAreaView>
    </Fragment>
  );
};

const FacetFilter = (facet: Facet) => {
  return (
    <View>
      <Text>{facet.name}</Text>
      {_.map(facet.values, value => (
        <Text>{value}</Text>
      ))}
    </View>
  );
};

function getFacets() {}

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

        const parsedUsers: User[] = _.map(data.results, (user: User) => ({
          ...user,
          id: {
            value: uuid.v1()
          }
        }));

        res([parsedUsers, { gender: parsedGenders, nat: parsedNationalities }]);
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
      if (!user.id.value) {
        console.log("HELLLO", user);
      }
      transaction.executeSql(
        `
          INSERT into Users (name, user_id)
          VALUES(?, ?);
        `,
        [user.name.first, user.id.value]
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
        [user.id.value, user.gender]
      );
      transaction.executeSql(
        `
            INSERT into UserFacets (user_id, facet_value_id)
            SELECT ?, fv.facet_value_id
            FROM FacetValues fv
            JOIN Facets f ON fv.facet_id = f.facet_id
            WHERE f.name = 'nat' and fv.facet_value = ?;,
        `,
        [user.id.value, user.nat]
      );
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
    await insertFacetValues(db, facets);
    await insertUsers(db, users);
    try {
      db.transaction(async tx => {
        tx.executeSql(
          `
            SELECT *
            FROM Users u
            JOIN UserFacets uf on u.user_id = uf.user_id
            JOIN FacetValues fv on uf.facet_value_id = fv.facet_value_id
           `,
          undefined,
          (tx, queryResult) => {
            const items: string[] = _.map(_.range(queryResult.rows.length), x =>
              queryResult.rows.item(x)
            );
            console.log(queryResult.rows.length);
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
