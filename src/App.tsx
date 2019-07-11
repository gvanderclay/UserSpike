import React, { Fragment, useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity
} from "react-native";

import * as _ from "lodash";
import { User, Facet, FacetWithFacetValueCount } from "./types";
import { initializeData, getInformation } from "./initializers";

const App = () => {
  const [title, setTitle] = useState("waiting");
  const [users, setUsers] = useState<User[]>([]);
  const [facets, setFacets] = useState<FacetWithFacetValueCount[]>([]);
  const [didInit, setDidInit] = useState(false);
  const [selectedFacetValues, setSelectedFacetValues] = useState<number[]>([]);
  useEffect(() => {
    async function getData(selectedFacetValues: number[]) {
      try {
        if (!didInit) await initializeData();
        const { users, facets } = await getInformation(selectedFacetValues);
        setTitle("Done");
        setUsers(users);
        setFacets(facets);
        setDidInit(true);
      } catch (e) {
        setTitle(`Error initializing:\n${JSON.stringify(e, null, 2)}`);
      }
    }
    getData(selectedFacetValues);
  }, [selectedFacetValues]);
  const onFacetPressed = (selectedId: number) => {
    if (_.find(selectedFacetValues, id => id === selectedId)) {
      setSelectedFacetValues(
        _.filter(selectedFacetValues, id => id !== selectedId)
      );
    } else {
      setSelectedFacetValues(_.concat(selectedFacetValues, selectedId));
    }
  };
  return (
    <Fragment>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <Text>{title}</Text>
          <View>
            <FacetFilters
              selectedFacetValues={selectedFacetValues}
              facets={facets}
              onFacetPressed={onFacetPressed}
            />
            {users.map((user, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  alignItems: "flex-start"
                }}
              >
                <Text>{user.name.first}</Text>
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

const FacetFilters = (props: {
  facets: FacetWithFacetValueCount[];
  selectedFacetValues: number[];
  onFacetPressed: (facetId: number) => void;
}) => {
  return (
    <View
      style={{
        justifyContent: "space-around",
        flexDirection: "row"
      }}
    >
      {_.map(props.facets, (facet, index) => (
        <FacetFilter
          facet={facet}
          key={index}
          selectedFacetValues={props.selectedFacetValues}
          onFacetPressed={props.onFacetPressed}
        />
      ))}
    </View>
  );
};

const FacetFilter = (props: {
  facet: FacetWithFacetValueCount;
  selectedFacetValues: number[];
  key: number;
  onFacetPressed: (id: number) => void;
}): JSX.Element => {
  const valueColor = (id: number): "grey" | "black" => {
    return _.includes(props.selectedFacetValues, id) ? "grey" : "black";
  };
  return (
    <View>
      <Text>{props.facet.name}</Text>
      {_.map(props.facet.values, (value, index) => (
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => props.onFacetPressed(value.id)}>
            <Text style={{ color: valueColor(value.id) }}>{value.name}</Text>
          </TouchableOpacity>
          <Text> ID {value.id} : </Text>
          <Text> COUNT {value.count}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({});

export default App;
