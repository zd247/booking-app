import router from "next/router"
import { useEffect } from "react"
import { useMeQuery } from "../generated/graphql"

export const useIsAuth = () => {
    const [{data, fetching}] = useMeQuery()

    // when receive this error, perform this ?next=... method
    useEffect(() => {
        if (!data?.me && !fetching) {
            router.replace('/login?next=' + router.pathname)
        }
    }, [data, fetching, router])
}