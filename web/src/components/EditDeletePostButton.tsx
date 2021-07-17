import React from "react";
import { Box, IconButton, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { useDeletePostMutation, useMeQuery } from "../generated/graphql";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { useRouter } from "next/router";

interface EditDeletePostButtonsProps {
  id: number;
  creatorId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
  creatorId,
}) => {
  const [{ data: meData }] = useMeQuery();
  const [, deletePost] = useDeletePostMutation();
  const router = useRouter()

  if (meData?.me?._id !== creatorId) {
    return null;
  }

  return (
    <Box>
      <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton as={Link} mr={4} icon={<EditIcon/>} aria-label="Edit Post" />
      </NextLink>
      <IconButton
          ml="auto"
          variantColor="red"
          icon={<DeleteIcon/>}
          aria-label="Delete Post"
          onClick={() => {
            deletePost({ id: id });
            router.back();
          }}
        />
    </Box>
  );
};
