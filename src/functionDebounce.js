// i got stuck here because i couldnt figure out where to
// put in the debounce funciton so that it would receive all the suspenders and queue them up nicely

import React, { Timeout } from "react";
const cache = new Map();
const buffer = new Set();

function makeNewProxy(newTrace) {
  return new Proxy(
    {
      __trace: newTrace,
      read() {
        if (cache.has(newTrace)) return cache.get(newTrace);
        if (buffer.has(newTrace)) return "loading";
        console.log("codetrace 1");
        console.log("codetrace 2");
        throw new Promise(resolve => {
          console.log("codetrace 3");
          buffer.add(newTrace);
          resolve();
        });
        return "you shouldnt see this";
      }
    },
    handler
  );
}

var handler = {
  get: function(obj, prop, receiver) {
    const newTrace = `${obj.__trace}.${prop}`;
    return prop in obj ? obj[prop] : makeNewProxy(newTrace);
  }
};

const query = new Proxy({ __trace: "topquery" }, handler);

// use this if you want control over your own placeholder

/**
 * @class ConnectWithoutPlaceholder
 */
export function ConnectWithoutPlaceholder(props) {
  return <React.Fragment>{props.children({ query })}</React.Fragment>;
}

// we choose to wrap this as default because
// it is easy to mess up the placeholder placement
// and get a difficult-to-solve error:
// "Uncaught Error: A synchronous update was suspended, but no fallback UI was provided."
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

function debounce(fn, ms = 10) {
  let timeout;
  console.log("debounce call");
  return (...props) => {
    console.log("debounce call2", props);
    clearTimeout(timeout);
    // event.persist();
    timeout = setTimeout(() => {
      console.log("debounce call3");
      fn(...props);
    }, ms);
  };
}
