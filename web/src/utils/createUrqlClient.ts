import { dedupExchange, fetchExchange } from "urql"
import { cacheExchange, Resolver, Cache } from "@urql/exchange-graphcache";
import { LogoutMutation, MeQuery, MeDocument, LoginMutation, RegisterMutation } from "../generated/graphql"
import { betterUpdateQuery } from "./betterUpdateQuery"

import { pipe, tap } from 'wonka';
import { Exchange } from 'urql';
import  Router from "next/router"


/* -------------------------------------------------------------------------- */
/*                         Add-on components for URQL                         */
/* -------------------------------------------------------------------------- */

// global error handling from URQL
// basically just log the error for now ..
export const errorExchange: Exchange = ({ forward }) => ops$ => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      // If the OperationResult has an error send a request to sentry
      if (error?.message.includes("not authenticated")) {
        // Router.replace('/login') // like redirecting
        console.log ("authentication is not valid")
      }
      console.log (error?.message)
    })
  );
};

// const cursorPagination = (): Resolver => {
//   return (_parent, fieldArgs, cache, info) => {
//     const { parentKey: entityKey, fieldName } = info;
//     const allFields = cache.inspectFields(entityKey);
//     const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
//     const size = fieldInfos.length;
//     if (size === 0) {
//       return undefined;
//     }

//     const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
//     const isItInTheCache = cache.resolve(
//       cache.resolveFieldByKey(entityKey, fieldKey) as string,
//       "posts"
//     );
//     info.partial = !isItInTheCache;
//     let hasMore = true;
//     const results: string[] = [];
//     fieldInfos.forEach((fi) => {
//       const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string;
//       const data = cache.resolve(key, "posts") as string[];
//       const _hasMore = cache.resolve(key, "hasMore");
//       if (!_hasMore) {
//         hasMore = _hasMore as boolean;
//       }
//       results.push(...data);
//     });

//     return {
//       __typename: "PaginatedPosts",
//       hasMore,
//       posts: results,
//     };
//   };
// };


/* -------------------------------------------------------------------------- */
/*                           URQL client declaration                          */
/* -------------------------------------------------------------------------- */

// This central Client manages all of our GraphQL requests and results.
export const createUrqlClient = (ssrExchange: any) => ({
  url: 'http://localhost:4000/graphql',
	fetchOptions: {
		credentials: 'include' as const,
	},
  // see this doc for better understanding about URQL exchanges
  // https://formidable.com/open-source/urql/docs/api/core/#exchanges
	exchanges: [
    dedupExchange, // eliminating duplicate copies of repeating data.
    // apply cache updates (Cache Exchange) for auth mutations
    // this is because urql client does not update the cache automatically after each request
    // see https://formidable.com/open-source/urql/docs/graphcache/cache-updates/
    // reference 3:26:21 https://www.youtube.com/watch?v=I6ypD7qv3Z8&t=9813s
    cacheExchange({
      updates: {
        Mutation: {
          logout: (_result: LogoutMutation, args, cache, info) => {
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              {query: MeDocument},
              _result,
              () => ({me: null})
            )
          },

          login: (_result: LoginMutation, args, cache, info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              {query: MeDocument},
              _result,
              (result, query) => {
                if (result.login.errors) {
                  return query
                }else {
                  return {
                    me: result.login.user
                  }
                }
              })
          },

          register: (_result: RegisterMutation, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              {query: MeDocument},
              _result,
              (result, query) => {
                if (result.register.errors) {
                  return query
                }else {
                  return {
                    me: result.register.user
                  }
                }
              })
          },
        }
      }
    }),
    errorExchange, // global error handling for each URQL request
    ssrExchange, // reduce browser load, better UX
    fetchExchange //  is responsible for sending operations of type 'query' and 'mutation' to a GraphQL API using fetch 
  ],
})