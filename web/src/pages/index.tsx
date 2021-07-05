import { NavBar } from "../components/NavBar"

import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";

import {Link} from '@chakra-ui/react'
import  NextLink from 'next/link'

const Index = () => {
  const [{data, fetching}] = usePostsQuery({variables: {
    limit: 30,
  }})
  
  return (
  <Layout>
    <NextLink href='/create-post'>
      <Link>
        Create Post
      </Link>
    </NextLink>
    <hr/>
    Posts
    <hr/>
    {!data && !fetching? (<div>loading...</div>) : 
    data.posts.map(p =>(
      <div key={p._id}>
        {p._id} + {p.title}
      </div>

    ))}
  </Layout>
)}

// for SSR
export default withUrqlClient(createUrqlClient, {ssr: true})(Index)
