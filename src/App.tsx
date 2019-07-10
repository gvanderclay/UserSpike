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
import uuid from "react-native-uuid";
import { User, Facet } from "./types";
import { initializeData, getUserInformation } from "./initializers";

const App = () => {
  const [title, setTitle] = useState("waiting");
  const [data, setData] = useState<User[]>([]);
  const [facets, setFacets] = useState<Facet[]>([]);
  useEffect(() => {
    async function foo() {
      try {
        await initializeData();
        const users = await getUserInformation();
        setTitle("Done");
        setData(users);
      } catch (e) {
        setTitle(`Error initializing:\n${JSON.stringify(e, null, 2)}`);
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
          {data.map((user, index) => (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around"
              }}
            >
              <Text>{user.name.first + " " + user.name.last}</Text>
              <Text>{user.gender}</Text>
              <Text>{user.nat}</Text>
            </View>
          ))}
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

const styles = StyleSheet.create({});

export default App;
