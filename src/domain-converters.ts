import _ from "lodash";
import { User, Facet } from "./types";
import { UserQueryResult } from "./db";

export const userQueryResultToDomain = (
  queryResult: UserQueryResult[]
): User[] => {
  const groupedQueryResults = _.groupBy(queryResult, "userId");
  return _.compact(
    _.map(
      groupedQueryResults,
      (queryResults): User | undefined => {
        const genderQueryResult = _.find(
          queryResults,
          q => q.facetName === "gender"
        );
        const natQueryResult = _.find(queryResults, q => q.facetName === "nat");
        if (genderQueryResult && natQueryResult) {
          return {
            gender: genderQueryResult.facetValue,
            nat: natQueryResult.facetValue,
            id: genderQueryResult.userId,
            name: {
              first: genderQueryResult.usersName,
              last: "smith"
            }
          };
        }
      }
    )
  );
};

export const userQueryResultToFacets = (
  queryResult: UserQueryResult[]
): Facet[] => {
  const groupedQueryResults = _.groupBy(queryResult, "facetName");
  return _.map(
    groupedQueryResults,
    (queryResults, key): Facet => {
      return {
        name: key,
        values: _.chain(queryResults)
          .map(result => ({
            name: result.facetValue,
            id: result.facetValueId
          }))
          .uniqBy("id")
          .value()
      };
    }
  );
};
