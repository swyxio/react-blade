// sample every 10 milliseconds to generate the query
// this one works but its janky and i don't really like it

import React, { Timeout } from "react";
import parseBuffer from "./parseBuffer";
const cache = new Map();
const buffer = new Set();

function makeNewProxy(newTrace) {
  return new Proxy(
    {
      __trace: newTrace,
      read() {
        if (cache.has(newTrace)) return cache.get(newTrace);
        if (buffer.has(newTrace)) return "loading";
        // console.log("codetrace 1");
        // console.log("codetrace 2");
        throw new Promise(resolve => {
          // console.log("codetrace 3");
          buffer.add(newTrace);
          resolve();
        });
        return "you shouldnt see this";
      },
      map(callback) {
        callback(makeNewProxy(newTrace));
      }
    },
    handler
  );
}

var handler = {
  get: function(obj, prop, receiver) {
    // console.log("prop", typeof prop, prop, "obj.trace", obj.__trace);
    // console.log("cache", cache, "buffer", buffer);
    // if (!isString(prop)) return console.log("propprop", prop) || null;
    // if (!isString(prop)) return noopProxy();
    if (typeof prop === "symbol" || prop in Object.prototype) return obj[prop];
    // console.log("prop", typeof prop, prop, "obj.trace", obj.__trace);
    const newTrace = obj.__trace === "" ? `${prop}` : `${obj.__trace}.${prop}`;
    return prop in obj ? obj[prop] : makeNewProxy(newTrace);
  }
};

const query = new Proxy({ __trace: "" }, handler);

// use this if you want control over your own placeholder
export class ConnectWithoutPlaceholder extends React.Component {
  componentDidMount() {
    // i really dont want to have to make this setInterval.
    // with some user restrictions i wont have to
    setTimeout(() => {
      // console.log("sldkjsl", buffer);
      if (buffer.size) {
        const graphqlQuery = parseBuffer(buffer);
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
