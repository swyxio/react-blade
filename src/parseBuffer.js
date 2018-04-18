// ** creating the graphql query string
// a synchronous function for turning buffered queries into graphql queries

import set from "lodash.set";
import get from "lodash.get";

export default function parseBuffer(buffer) {
  const obj = {};
  // form the obj
  buffer.forEach(item => {
    const curval = get(obj, item);
    if (!curval) {
      // is not accounted for
      set(obj, item, 1);
    }
  });
  console.log("parseBuffer", buffer);
  const ans = JSON.stringify(obj)
    .replace(/"/g, " ")
    .replace(/:[^{]?/g, " ")
    .replace(/(\s)+/g, " ")
    .replace(/(\s),/g, ",");
  return ans;
}

// helpful
// https://stackoverflow.com/questions/28058519/javascript-convert-dot-delimited-strings-to-nested-object-value?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa

// for testing
// JSON.stringify({a:1,b:{c:'3'}}).replace(/"/g,'').replace(/:[^{]?/g,' ').replace(/,/g,'')
