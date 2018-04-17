import React from "react";
import { Connect } from "react-blade";

export default ({ name }) => {
  return (
    <Connect>
      {({ query }) => (
        // this is a graphql query; doesn't render til its ready
        <h1>Hello {query.user.name.read()}</h1>
      )}
    </Connect>
  );
};
