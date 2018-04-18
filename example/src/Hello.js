import React from "react";
import { Connect } from "react-blade";

// // query demo
// export default ({ name }) => {
//   return (
//     <Connect>
//       {({ query }) => (
//         // this is a graphql query; doesn't render til its ready
//         <div>
//           <h1>Hello {query.user.name.read()}</h1>
//           <p>Hello2{query.user.body.read()}</p>
//           <p>Hello2{query.user.time.now.read()}</p>
//           <p>Hello2{query.user.body.read()}</p>
//           <p>Hello2{query.user.body.potato.read()}</p>
//           <p>Hello2{query.user.body.mouse.read()}</p>
//         </div>
//       )}
//     </Connect>
//   );
// };

// // map demo
// export default ({ name }) => {
//   return (
//     <Connect>
//       {({ query }) => (
//         // this is a graphql query; doesn't render til its ready
//         <div>
//           <ul className="movie-list">
//             {query.movies.map(d => (
//               <li key={d.id.read()} className="movie-list-item">
//                 <button type="button" className="button-wrapper">
//                   <img src={d.poster.uri.read()} alt="movie poster" />
//                   <h2>{d.title.read()}</h2>
//                   <p>Release: {d.releaseDate.read()}</p>
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </Connect>
//   );
// };

// query children demo
export default ({ name }) => {
  return (
    <Connect>
      {({ query }) => {
        query.todos = ["id", "text"];
        return <div>
          <h1>Hello {query.todos.read()}</h1>
        </div>
      }
      }
    </Connect>
  );
};

class Timer extends React.Component {
  start = new Date();
  state = { now: this.start };
  componentDidMount() {
    setInterval(() => this.setState({ now: new Date() }), 100);
  }
  render() {
    return <div>{this.state.now - this.start}</div>;
  }
}
