# React-Blade

> Inline GraphQL for the age of Suspense

[![NPM](https://img.shields.io/npm/v/react-blade.svg)](https://www.npmjs.com/package/react-blade) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

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
          <TodoList todos={query.todos} />
        </div>
      );
    }}
  </Connect>
);
```

**How this works**: `query` is actually wrapped with ES6 Proxies that throw a Promise wrapping a graphql query when asked for properties it does not have. Once it resolves, React Suspense's behavior is to rerender and the query succeeds as it is stored in cache.

---

# API Walkthrough

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
      query.todos = ["id", "text"]; // setting subfields that we also want in our response
      return (
        <div>
          <TodoList todos={query.todos} />
        </div>
      );
    }}
  </Connect>
);
```

Because of our usage of React Suspense, the fetched data is normalized in our cache "for free" based on our usage. Here's an example of a query with multiple fields:

```js
// Blade-style query with multiple fields
const Home = () => (
  <Connect>
    {({ query }) => {
      return (
        <>
          <h3>{query.user.name}</h3>
          <TodoList todos={query.todos} />
        </>
      );
    }}
  </Connect>
);
```

React suspends twice and the cache stores both `query.user` and `query.todos` separately. In the future we will have batching algorithms to execute suspenders in parallel.

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
      query.getTodoByText = {text: 'Todo Text Content'}
      return <TodoItem todo={query.getTodoByText} />
      );
    }}
  </Connect>
);
```

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

## Prior Art

### urql

This library wouldn't be possible without [urql](<(https://github.com/FormidableLabs/urql)>). Ken Wheeler and Team Formidable are an inspiration to us all. Specifically, watching Ken mess up repeatedly during a live coding session demonstrating Urql gave me the original inspiration for solving the double declaration problem. Enormous amounts of inspiration for this lib came from urql and its architecture.

### HowToGraphQL/GraphCool

I learned GraphQL on the lap of Nick Burke's extensive [HowToGraphQL.com](http://HowToGraphQL.com) tutorial and even [made my own tutorial](http://graphql-of-thrones.herokuapp.com) as a capstone project.

## License

MIT © [swyx](https://twitter.com/swyx)
