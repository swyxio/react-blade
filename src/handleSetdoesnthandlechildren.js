// sample every 10 milliseconds to generate the query
// this one works but its janky and i don't really like it

import React, { Timeout } from "react";
import parseBuffer from "./parseBuffer";
const cache = new Map();
let buffer = []; // [{trace, children, variables}]. tried using Set but needed Array methods.
let loopcount = 0;
function makeNewProxy(newTrace, obj) {
  return new Proxy(
    {
      __trace: newTrace,
      read() {
        console.log("getcache", cache, "buffer", buffer, 'newTrace', newTrace);
        if (cache.has(newTrace)) return cache.get(newTrace);
        if (buffer.find(el => el.trace === newTrace) + 1) return "loading";
        if (loopcount++ < 20) {
          throw new Promise(resolve => {
            console.log('obj.__children', obj.__children, 'obj.__variables', obj.__variables, 'newTrace', newTrace)
            const addition = {
              trace: newTrace,
              children: obj.__children,
              variables: obj.__variables
            }
            buffer.push(addition);
            resolve();
          });
        }
        return "you shouldnt see this";
      },
      map(callback) {
        callback(makeNewProxy(newTrace, obj));
      }
    },
    handler
  );
}

var handler = {
  get: function (obj, prop, receiver) {
    console.log("getprop", typeof prop, prop, "|obj.trace", obj.__trace);
    // console.log("getcache", cache, "buffer", buffer);
    if (typeof prop === "symbol" || prop in Object.prototype || prop.slice(0, 2) === '__') return obj[prop];
    const newTrace = obj.__trace === "" ? `${prop}` : `${obj.__trace}.${prop}`;
    return prop in obj ? obj[prop] : makeNewProxy(newTrace, obj);
  },
  set: function (obj, prop, value, receiver) {
    if (buffer.find(el => el.trace === obj.__trace) + 1) return true;
    console.log("setprop", typeof prop, prop, "|obj.trace", obj.__trace);
    console.log("____value", value, "obj", obj);
    if (Array.isArray(value)) {
      // query children
      obj.__children = value
    } else {
      // query variable
      obj.__variables = value
    }
    if (loopcount++ < 200) {
      return true
    } else {
      throw new Error('terminatettete')
      return false
    }
  }
};

// const qv = Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(',')
// obj.__trace = obj.__trace + `.${prop} {${value.toString()}}`

const query = new Proxy({ __trace: "" }, handler);

// use this if you want control over your own placeholder
export class ConnectWithoutPlaceholder extends React.Component {
  componentDidMount() {
    // i really dont want to have to make this setInterval.
    // with some user restrictions i wont have to
    setTimeout(() => {
      if (buffer.length) {
        console.log("buffer", buffer);
        const graphqlQuery = parseBuffer(buffer);
        // buffer = [] // buffer.clear()
        console.log("graphqlQuery", graphqlQuery);
        this.forceUpdate();
      }
    }, 500);
  }
  render() {
    return <React.Fragment>{this.props.children({ query })}</React.Fragment>;
  }
}

// we choose to wrap ConnectWithoutPlaceholder as default because
// it is easy to mess up the placeholder placement
// and get a difficult-to-solve error:
// "Uncaught Error: A synchronous update was suspended, but no fallback UI was provided."
// Understand that picking one or the other as default behavior will make someone unhappy
// and we rather make beginners' life a tiny bit easier
export function Connect(props) {
  const {
    delayMs = 500,
    fallback = <div>react-blade Fallback Loading</div>,
    ...rest
  } = props;
  return (
    <Timeout ms={delayMs}>
      {didExpire =>
        didExpire ? fallback : <ConnectWithoutPlaceholder {...rest} />
      }
    </Timeout>
  );
}
