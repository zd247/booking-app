import { NavBar } from "../components/NavBar"

import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostQuery } from "../generated/graphql";

const Index = () => {
  const [{data}] = usePostQuery()
  
  return (
  <>
    <NavBar/>
    <div>Hello world</div>
    <br/>
    <hr/>
    {!data ? (<div>loading...</div>) : 
    data.posts.map(p =>(
      <div key={p._id}>{p.title}</div>
    ))}
  </>
)}

// for SSR
export default withUrqlClient(createUrqlClient, {ssr: true})(Index)
