import React from 'react'
import {Flex, Box, Link, Button} from "@chakra-ui/react"
import NextLink from 'next/link'
import {useMeQuery} from '../generated/graphql'

interface NavBarProps {

}

export const NavBar: React.FC<NavBarProps> = ({}) => {
    const [{data, fetching}] = useMeQuery()
    let body = null

    if (fetching) {
    // user is not logged in
    }else if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link mr={2}>Login</Link>
                </NextLink>
                <NextLink href="/register">
                    <Link mr={2}>Register</Link>               
                </NextLink>
            </>
        )
    // user ok
    }else {
        body = (
            <Box>
                <Box>{data.me.username}</Box>
                <Button variant='link'>logout</Button>
            </Box>
            
        )
    }
    
    return (
        <Flex bg="tomato" p={4}>
            <Box ml={"auto"}>
                {body}      
            </Box>
        </Flex>
        
    );
}