import React, { Timeout } from "react";
const cache = new Map();

function makeNewProxy(newTrace) {
  return new Proxy(
    {
      __trace: newTrace,
      read() {
        if (!cache.has(newTrace)) {
          throw new Promise(res => {
            cache.set(newTrace, `${newTrace}:99`);
            res();
          });
        } else {
          return cache.get(newTrace);
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

function debounce(fn, ms = 500) {
  let timeout;

  return event => {
    clearTimeout(timeout);
    event.persist();
    timeout = setTimeout(() => {
      fn(event);
    }, ms);
  };
}

// function Delay({ms}) {
//   return (
//     <Timeout ms={ms}>
//       {didTimeout => {
//         if (didTimeout) {
//           // Once ms has elapsed, render null. This allows the rest of the
//           // tree to resume rendering.
//           return null;
//         }
//         return <Never />;
//       }}
//     </Timeout>
//   );
// }

// function DebouncedText({text, ms}) {
//   return (
//     <Fragment>
//       <Delay ms={ms} />
//       <Text text={text} />
//     </Fragment>
//   );
// }
