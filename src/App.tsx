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
import { initializeData, getInformation } from "./initializers";

const App = () => {
  const [title, setTitle] = useState("waiting");
  const [users, setUsers] = useState<User[]>([]);
  const [facets, setFacets] = useState<Facet[]>([]);
  useEffect(() => {
    async function foo() {
      try {
        await initializeData();
        const { users, facets } = await getInformation();
        setTitle("Done");
        setUsers(users);
        setFacets(facets);
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
          <View>
            <FacetFilters facets={facets} />
            {users.map((user, index) => (
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </Fragment>
  );
};

const FacetFilters = (props: { facets: Facet[] }) => {
  return (
    <View
      style={{
        justifyContent: "space-around",
        flexDirection: "row"
      }}
    >
      {_.map(props.facets, facet => (
        <FacetFilter facet={facet} />
      ))}
    </View>
  );
};

const FacetFilter = (props: { facet: Facet }): JSX.Element => {
  console.warn("ERHER");
  return (
    <View>
      <Text>{props.facet.name}</Text>
      {_.map(props.facet.values, value => (
        <Text>{value}</Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({});

export default App;
