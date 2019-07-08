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
import Knex from "knex";

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
  const [data, setData] = useState([]);
  useEffect(() => {
    console.log("useEffect");
    SQLite.DEBUG(true);
    SQLite.enablePromise(true);

    SQLite.openDatabase({
      name: "TestDatabase",
      location: "default"
    }).then(db => {
      db.transaction(transaction => {
        transaction.executeSql("DROP TABLE IF EXISTS Users;");
        transaction.executeSql("DROP TABLE IF EXISTS Facets;");
        transaction.executeSql("DROP TABLE IF EXISTS FacetValues;");
        transaction.executeSql("DROP TABLE IF EXISTS UserFacets;");
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

        transaction.executeSql(`
            INSERT into Facets (name)
            VALUES ('gender');
        `);

        transaction.executeSql(`
            INSERT into Facets (name)
            VALUES ('nationality');
        `);
      })
        .then(transaction => {
          fetch("https://randomuser.me/api/?results=50").then(response => {
            response.json().then(data => {
              console.log(data);

              const parsedNames = data.results.map(
                (user: User) => user.name.first
              );
              transaction.executeSql(
                `
              INSERT into USERS (name)
              VALUES(?);
            `,
                [parsedNames]
              );
              const parsedGenders = _.uniq(
                data.results.map((user: User) => user.gender)
              );
              transaction
                .executeSql(
                  `SELECT * from Facets facet where facet.name = 'gender';`
                )
                .then(([tx, result]) => {
                  if (result.rows.length > 0) {
                    let genderFacet = result.rows.item(0);
                    transaction.executeSql(
                      `
                  INSERT into FacetValues (facet_id, facet_value)
                  VALUES(${genderFacet.facet_id}, ?);
                `,
                      [parsedGenders]
                    );
                  }
                });
              const parsedNationalities = _.uniq(
                data.results.map((user: User) => user.nat)
              );
            });
          });
        })
        .then(() => setTitle("Done"))
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
            <Text>{user}</Text>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Fragment>
  );
};

const styles = StyleSheet.create({});

export default App;
