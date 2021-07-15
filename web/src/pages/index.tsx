import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import { IconButton } from "@chakra-ui/react"
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import React, { useState } from "react";
import { UpdootSection } from "../components/UpdootSection";



const Index = () => {
  const [variables, setvariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });

  // is triggered when at the fresh start or by the "load more" button
  const [{ data, fetching }] = usePostsQuery({ variables });

  if (!fetching && !data) {
    return (
      <Flex>
        <Box>
          <Text>Your query failed for some reason</Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Layout>
      {/* headers */}

      <Flex>
        <Heading>LiReddit</Heading>
        <NextLink href="/create-post">
          <Link ml="auto">Create Post</Link>
        </NextLink>
      </Flex>

      {/* list of posts */}

      {!data && fetching ? (
        <div>loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) => (
            <Flex p={5} shadow="md" borderWidth="1px" flex="1" borderRadius="md">
              <UpdootSection post={p}/>
              <Box>
                <Heading fontSize="xl" marginEnd={2}>{p.title}</Heading>
                <Text fontSize='small'> by {p.creator.username}</Text>
                <Text mt={4}>{p.textSnippet} ...</Text>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}

      {/* load more button */}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            onClick={() => {
              // trigger change in passed in variables with cursor and limit
              setvariables({
                limit: 10,
                cursor: data!.posts.posts[data.posts.posts.length - 1].createdAt,
              });
            }}
            m="auto"
            my={8}
          >
            Load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

// turn on SSR for this page
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
