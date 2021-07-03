import { NavBar } from "../components/NavBar"

import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";

import {Link} from '@chakra-ui/react'
import  NextLink from 'next/link'

const Index = () => {
  const [{data}] = usePostQuery()
  
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
    {!data ? (<div>loading...</div>) : 
    data.posts.map(p =>(
      <div key={p._id}>
        {p.title} + {p.text}
      </div>

    ))}
  </Layout>
)}

// for SSR
export default withUrqlClient(createUrqlClient, {ssr: true})(Index)
