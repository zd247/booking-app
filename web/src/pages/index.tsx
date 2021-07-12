import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";

import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import React, { useState } from "react";

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
        data!.posts.posts.map((p) => (
          <Stack spacing={8}>
            <Box p={5} shadow="md" borderWidth="1px" flex="1" borderRadius="md">
              <Heading fontSize="xl">{p.title}</Heading>
              <Text mt={4}>{p.textSnippet} ...</Text>
            </Box>
          </Stack>
        ))
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
