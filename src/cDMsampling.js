// this one works but its janky and i don't really like it

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
export class ConnectWithoutPlaceholder extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    console.log("scu");
  }
  getSnapshotBeforeUpdate() {
    console.log("gsbu");
  }
  componentDidUpdate(prevProps, prevState) {
    console.log("buffer", buffer);
  }
  componentDidMount() {
    setTimeout(
      () => buffer.size && console.log("sldkjsl", buffer) && this.forceUpdate(),
      100
    );
  }
  render() {
    return <React.Fragment>{this.props.children({ query })}</React.Fragment>;
  }
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
