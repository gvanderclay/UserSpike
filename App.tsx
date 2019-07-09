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
    console.log("useEffect");
    SQLite.DEBUG(true);
    SQLite.enablePromise(true);

    SQLite.openDatabase({
      name: "TestDatabase",
      location: "default"
    }).then(db => {
      dropTables(db)
        .then(() => {
          createTables(db).then(() => {
            seedFacets(db).then(() => {
              getUserData().then(result => {
                const users = result[0];
                const facets = result[1];
                insertUsers(db, users).then(() => {
                  getFacetIds(db).then(facetIds => {
                    const data: { [key: string]: [string[], string] } = {
                      gender: [facets["gender"], facetIds["gender"]],
                      nat: [facets["nat"], facetIds["nat"]]
                    };
                    insertFacetValues(db, data).then(() => {
                      db.executeSql(
                        `
                        SELECT * FROM FacetValues;
                      `
                      ).then(([result]) => {
                        const items: string[] = _.map(
                          _.range(result.rows.length),
                          x => result.rows.item(x).facet_value
                        );
                        console.log(items);
                        setData(items);
                      });
                    });
                  });
                });
              });
            });
          });
        })
        .then(() => {
          setTitle("Done");
        })
        .catch(e => setTitle(e));
    });
  }, []);

  return (
    <Fragment>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <Text>{title}</Text>
          {data.map(user => (
            <View>
              <Text>{user.name}</Text>
              <Text>{user.gender}</Text>
              <Text>{user.nat}</Text>
            </View>
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
        console.log(data);

        const parsedGenders: string[] = _.uniq(
          data.results.map((user: User) => user.gender)
        );

        const parsedNationalities: string[] = _.uniq(
          data.results.map((user: User) => user.nat)
        );

        res([data.results as User[], { gender: parsedGenders, nat: parsedNationalities }]);
      });
    });
  });
}

function getFacetIds(
  db: SQLite.SQLiteDatabase
): Promise<{ [key: string]: string }> {
  return new Promise((res, rej) => {
    db.transaction(transaction => {
      transaction.executeSql(`SELECT * from Facets;`).then(([tx, result]) => {
        const items = _.map(_.range(result.rows.length), x =>
          result.rows.item(x)
        );
        const genderId = _.find(items, item => item.name === "gender");
        const natId = _.find(items, item => item.name === "nat");
        res({ genderId, natId });
      });
    });
  });
}

function insertFacetValues(
  db: SQLite.SQLiteDatabase,
  facetValues: { [key: string]: [string[], string] }
): Promise<SQLite.Transaction> {
  return db.transaction(transaction => {
    _.forEach(facetValues["gender"][0], value => {
      transaction.executeSql(
        `
          INSERT into FacetValues (facet_id, facet_value)
          VALUES(?, ?);
        `,
        [facetValues["gender"][1], value]
      );
    });

    _.forEach(facetValues["nat"][0], value => {
      transaction.executeSql(
        `
          INSERT into FacetValues (facet_id, facet_value)
          VALUES(?, ?);
        `,
        [facetValues["nat"][1], value]
      );
    });
  });
}

function insertUsers(db: SQLite.SQLiteDatabase, users: User[]) {
  return db.transaction(transaction => {
    _.forEach(users, user => {
      transaction.executeSql(
        `
          INSERT into Users (name)
          VALUES(?);
        `,
        [user.name]
      );
    });
  }).then(() => {
    db.transaction(transaction => {
      _.forEach(users, user => {
        transaction.executeSql(
          `
            INSERT INTO UserFacets(user_id, facet_value_id)
            VALUES (?, fId)
            SELECT facet_value_id FROM FacetValues fv
            JOIN Facets f ON fv.facet_id = f.facet_id;
          `
        );
      });
    });
  });
}

const styles = StyleSheet.create({});

export default App;
