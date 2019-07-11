export type User = {
  gender: string;
  name: {
    first: string;
    last: string;
  };
  nat: string;
  id: string;
};

export type Facet = {
  name: string;
  values: FacetValue[];
};

export type FacetValue = {
  id: number;
  name: string;
};

export type FacetWithFacetValueCount = Facet & {
  values: (FacetValue & { count: number })[];
};
