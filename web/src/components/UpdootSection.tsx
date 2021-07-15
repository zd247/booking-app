import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import React from "react";
import {
  PostSnippetFragment,
  PostsQuery,
  useVoteMutation,
} from "../generated/graphql";

interface UpdootSectionProps {
  post: PostSnippetFragment;
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  const [, vote] = useVoteMutation();


  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        aria-label="upvote post"
        icon={<ChevronUpIcon size="24px" />}
        bgColor = {post.voteStatus === 1 ? "green": undefined }
        onClick = {async () => {
            if (post.voteStatus === 1) {
                return
            }
            await vote({
                postId: post._id,
                value: 1
            })
        }}
      />
      {post.points}
      <IconButton
        aria-label="downvote post"
        icon={<ChevronDownIcon size="24px" />}
        bgColor = {post.voteStatus === -1 ? "red": undefined }
        onClick = {async () => {
            if (post.voteStatus === -1) {
                return
            }
            await vote({
                postId: post._id,
                value: -1
            })
        }}
      />
    </Flex>
  );
};
