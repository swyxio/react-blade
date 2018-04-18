// i got stuck here because the screen would freeze for some reason when
// <Never /> expired
// my best guess is that the throwing of Never bubbles up and resets Delay
// when i need the Throw to be contained within Delay BUT also for Delay to throw

// things i tried:
// - using sCU in Delay
// - others i cant remember

import React, { Timeout } from "react";
const cache = new Map();
const buffer = new Set();
let loopcount = 0;
let loopcount2 = 0;

function makeNewProxy(newTrace) {
  return new Proxy(
    {
      __trace: newTrace,
      read() {
        console.log("newTrace", newTrace, "buffer", buffer, "cache", cache);
        if (cache.has(newTrace)) return cache.get(newTrace);
        if (buffer.has(newTrace)) return "loading";
        console.log("codetrace 1");
        if (loopcount++ < 20) {
          console.log("codetrace 2");
          throw new Promise(resolve => {
            console.log("codetrace 3");
            buffer.add(newTrace);
            resolve();
          });
          return "you shouldnt see this";
        } else {
          return "ERRORORORORORORO";
        }
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
  return (
    <React.Fragment>
      <Delay ms={10} buffer={buffer} />
      {props.children({ query })}
    </React.Fragment>
  );
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

// https://github.com/acdlite/react/blob/7166ce6d9b7973ddd5e06be9effdfaaeeff57ed6/packages/react-reconciler/src/__tests__/ReactSuspense-test.js#L550
function Delay({ ms, buffer }) {
  return (
    <Timeout ms={ms}>
      {didTimeout => {
        if (didTimeout) {
          if (buffer.size) {
            // temporary
            console.log("codetrace 4", buffer, cache);
            buffer.forEach(item => {
              cache.set(item, item + ":response");
            });
            buffer.clear();
            console.log("codetrace 5", buffer, cache);
            // throw new Promise(res => res()); // whut
          }
          // Once ms has elapsed, render null. This allows the rest of the
          // tree to resume rendering.
          return null;
        }
        return <Never />;
      }}
    </Timeout>
  );
}

function Never() {
  // Throws a promise that resolves after some arbitrarily large
  // number of seconds. The idea is that this component will never
  // resolve. It's always wrapped by a Timeout.
  throw new Promise(resolve => setTimeout(() => resolve(), 8000));
}

// unused

// function DebouncedText({text, ms}) {
//   return (
//     <Fragment>
//       <Delay ms={ms} />
//       <Text text={text} />
//     </Fragment>
//   );
// }

// function debounce(fn, ms = 500) {
//   let timeout;

//   return event => {
//     clearTimeout(timeout);
//     event.persist();
//     timeout = setTimeout(() => {
//       fn(event);
//     }, ms);
//   };
// }
