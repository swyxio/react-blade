# React-Blade

> Inline GraphQL for the age of Suspense

[![NPM](https://img.shields.io/badge/npm-react--blade-green.svg)](https://www.npmjs.com/package/react-blade) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Caution: This library is still being made. None of the below actually exists yet, this is just documentation-driven development.

## Why another GraphQL client?

All GraphQL client API's to date have a **double declaration problem**. Here's a sample adapted from [the urql example](https://github.com/FormidableLabs/urql/blob/6f9fa91dc2e003fba8bef1ce152f4029ed5f5726/example/src/app/home.tsx):

```js
const Home = () => (
  <Connect query={query(TodoQuery)}>
    {({ data }) => {
      return (
        <div>
          <TodoList todos={data.todos} />
        </div>
      );
    }}
  </Connect>
);

const TodoQuery = `
query {
  todos {
    id
    text
  }
}
`;
```

Everything requested in the graphql query string is then repeated in the code. On top of the ease of creating malformed queries, it is difficult to keep the query and code in sync as data needs change. There has to be a better way.

Here's the proposed Blade API:

```js
const Home = () => (
  <Connect>
    {({ query }) => {
      query.todos = ["id", "text"];
      return (
        <div>
          <TodoList todos={query.todos.read()} />
        </div>
      );
    }}
  </Connect>
);
```
## In short:

- Solve the Double Declaration problem in GraphQL
- Reduce indirection in GraphQL Query Variables
- Query-as-you-consume
- No tripups from curly braces
- = **massive win in DX**

**How this works**: `query` is actually wrapped with ES6 Proxies that throw a Promise wrapping a graphql query when asked for properties it does not have. Once it resolves, React Suspense's behavior is to rerender and the query succeeds as it is stored in cache.

---

# Full API Walkthrough

## Setting up the Provider

Blade's provider API is exactly the same as urql. But since Blade relies on React Suspense to work, to use Blade at all you must be in React's new AsyncMode.

```js
import React, { AsyncMode } from "react";
import { Provider, Client } from "react-blade";
import Home from "./home";

const client = new Client({
  url: "http://localhost:3001/graphql"
});

export const App = () => (
  <AsyncMode>
    <Provider client={client}>
      <Home />
    </Provider>
  </AsyncMode>
);
```

## Querying

```js
import { Connect } from "blade";
// Blade-style query with subfields that aren't directly used
const Home = () => (
    <Connect>
      {({ query }) => {
        // setting subfields that we also want in our response but dont explicitly request
        query.todos.subtree({ id: null, text: null });
        query.todos.abc.subtree({ foo: null, bar: null });
        // getting data as we like
        return <div>
          <h1>Hello {query.todos.read()}</h1>
          <h1>Hello {query.todos.abc.read()}</h1>
          <h1>Hello {query.todos.abc.def.read()}</h1>
        </div>
      }}
    </Connect>
);
```

Generated GraphQL:

```graphql
{ todos { id, text, abc { foo, bar, def }}}
```

Note we use `.read()` and `.subtree` for now until we figure out how to inject a tail throw within the last Proxy. Because of our usage of React Suspense, the fetched data is normalized in our cache "for free" based on our usage.

In this example, React suspends repeatedly and we build up our GraphQL query in a buffer. We send the GraphQL query once the buffer is complete, and the query populates our cache which then resolves all the suspenders.

## Query Variables

In GraphQL every query variable is usually named twice:

```js
// normal graphql query variable syntax
const GetTodo = `
query($text: String!) {
  getTodoByText(text: $text) {
    id
    text
  }
}
`;
```

Here, what we really want is to pass in a string to `getTodoByText`'s `text` field, but have to come up with awkward naming conventions like `$text` to pass it in due to the limitations of the spec. More duplication, more chances of error.

We can do better. In Blade, you can supply query variables inline without having to provide an intermediate query variable name:

```js
// Blade-style inline graphql query variable
const Home = () => (
    <Connect>
      {({ query }) => {
        query.getTodoByText.subtree({ id: null, text: null });
        query.getTodoByText.vars({ text: 'Todo1' })
        return <h3>{query.getTodoByText.read()}</h3>
      }}
    </Connect>
);
```

Generated GraphQL:

```graphql
{ getTodoByText(text: Todo1) { id, text }}
```

---
# EVERY THING BELOW HERE DOESN'T EXIST YET!
## Mutations

Mutations take pretty much the same format. Here's a GraphQL mutation:

```js
// normal graphql mutation syntax
const AddTodo = `
mutation($text: String!) {
  addTodo(text: $text) {
    id
    text
  }
}
`;
```

Here it is inline in Blade:

```js
// Blade-style mutation, note this doesn't need to use react suspense at all
// but the result of the mutation MUST return the new/changed item
// so that we can update our related cache in query.todos
const Home = () => (
  <Connect>
    {({ query, mutation }) => {
      mutation.addTodo = { text: "New Todo Added" };
      return (
        <>
          <TodoList todos={query.todos} />
          <button onClick={mutation.addTodo}>Add Todo</button>
        </>
      );
    }}
  </Connect>
);
```

## Other render args

We take similar render args as urql:

## Misc API notes

### HOC Form

If you are nostalgic for when HOC's were cool, no problem:

```js
import { connect } from "react-blade";
export default connect(MyComponent);
// define MyComponent and use the queries and mutations inline like you would anyway
```

### But I like Decorators

You're weird, but ok

```js
import { connect } from "react-blade";
@connect
class MyComponent extends React.Component {
  // define MyComponent and use the queries and mutations inline like you would anyway
}
```

---

## Development

Local development is broken into two parts.

First, we run rollup to watch the `src/` module and automatically recompile it into `dist/` whenever you make changes.

```bash
npm start # runs rollup with watch flag
```

The second part will be running the `example/` create-react-app that's linked to the local version of your module.

```bash
# (in another tab)
cd example
npm link react-blade # optional if using yarn
npm start # runs create-react-app dev server
```

Now, anytime you make a change to your component in `src/` or to the example app's `example/src`, `create-react-app` will live-reload your local dev server so you can iterate on your component in real-time.

![](https://media.giphy.com/media/12NUbkX6p4xOO4/giphy.gif)

Note: if you're using yarn, there is no need to use `yarn link`, as the generated module's example includes a local-link by default.

---

## Prior Art

### urql

This library wouldn't be possible without [urql](<(https://github.com/FormidableLabs/urql)>). Ken Wheeler and Team Formidable are an inspiration to us all. Specifically, watching Ken trip up on minor GraphQL template string syntax during a live coding session demonstrating Urql finally made me realize that there is a double declaration problem, which soon led to this solution for fixing it. As for GraphQL lib architecture, enormous amounts of inspiration for this lib came from urql and its architecture.

### HowToGraphQL/GraphCool

I learned GraphQL on the lap of Nick Burke's extensive [HowToGraphQL.com](http://HowToGraphQL.com) tutorial and even [made my own tutorial](http://graphql-of-thrones.herokuapp.com) as a capstone project.

### create-react-library

This library was made with <https://github.com/transitive-bullshit/create-react-library>. It's amazing.

## License

MIT © [swyx](https://twitter.com/swyx)
