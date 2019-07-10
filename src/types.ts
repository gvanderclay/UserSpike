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
  values: string[];
};
