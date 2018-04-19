// ** creating the graphql query string
// a synchronous function for turning buffered queries into graphql queries

import set from "lodash.set";
import unset from "lodash.unset";
import get from "lodash.get";

export default function parseBuffer(buffer, buffer_sub, buffer_vars) {
  const obj = {};
  // form the obj
  buffer
    // initial toplevel queries
    .forEach(item => {
      const curval = get(obj, item);
      if (!curval) {
        // this trace is not accounted for
        set(obj, item, buffer_sub.get(item) || null)
      }
    })
  buffer_vars
    .forEach((item, key) => {
      // simply rename anything with query vars(like: 'this')
      const curval = get(obj, key);
      const qv = Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(',')
      set(obj, `${key}(${qv})`, curval);
      unset(obj, key)
    })

  console.log("parseBuffer", buffer, 'obj', obj, 'buffer_sub', buffer_sub);
  console.log('JSON.stringify(obj)', JSON.stringify(obj))
  const ans = JSON.stringify(obj)
    .replace(/"/g, " ")
    .replace(/:null/g, "")
    // .replace(/:[^{]?/g, " ")
    .replace(/:{/g, "{")
    .replace(/(\s)+/g, " ")
    .replace(/(\s),/g, ",");
  return ans;
}

// { todos(id 23,text four) { id, text }}
// without
//  { todos(id: 23,text: four) :{ id, text }}

// helpful
// https://stackoverflow.com/questions/28058519/javascript-convert-dot-delimited-strings-to-nested-object-value?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa

// for testing
// JSON.stringify({a:1,b:{c:'3'}}).replace(/"/g,'').replace(/:[^{]?/g,' ').replace(/,/g,'')



// obj.__trace = obj.__trace + `.${prop} {${value.toString()}}`