import { dedupExchange, fetchExchange, stringifyVariables } from "urql";
import { cacheExchange, Resolver, Cache } from "@urql/exchange-graphcache";
import {
  LogoutMutation,
  MeQuery,
  MeDocument,
  LoginMutation,
  RegisterMutation,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";

import { pipe, tap } from "wonka";
import { Exchange } from "urql";
import Router from "next/router";

/* -------------------------------------------------------------------------- */
/*                         Add-on components for URQL                         */
/* -------------------------------------------------------------------------- */

// global error handling from URQL
// basically just log the error for now ..
export const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        // If the OperationResult has an error send a request to sentry
        if (error?.message.includes("not authenticated")) {
          // Router.replace('/login') // like redirecting
          console.log("authentication is not valid");
        }
        console.log(error?.message);
      })
    );
  };

// return a resolver
// this function read data from the cache and returning it
// see this custom pagination being built at 7:12:37 on https://www.youtube.com/watch?v=I6ypD7qv3Z8&t=9813s
const cursorPagination = (): Resolver => {
  // this is the shape of the client-side resolver from urql
  // fieldArgs are just variables we pass in the resolvers
  return (_parent, fieldArgs, cache, info) => {
    // i.e, entityKey == "Query" and fieldName == "posts" || "user"
    const { parentKey: entityKey, fieldName } = info;

    // get all query fields in your cache
    const allFields = cache.inspectFields(entityKey);
    // select all fieldName related fields from entityKey
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);

    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isItInTheCache = cache.resolve(
      cache.resolve(entityKey, fieldKey) as string,
      "posts"
    );
    info.partial = !isItInTheCache;
    let hasMore = true;
    const results: string[] = [];
    fieldInfos.forEach((fi) => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, "posts") as string[];
      const _hasMore = cache.resolve(key, "hasMore");
      if (!_hasMore) {
        hasMore = _hasMore as boolean;
      }
      results.push(...data);
    });

    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts: results,
    };
  };
};

/* -------------------------------------------------------------------------- */
/*                           URQL client declaration                          */
/* -------------------------------------------------------------------------- */

// This central Client manages all of our GraphQL requests and results.
export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include" as const,
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
      // this pagination function will run every time the query resolver is run in this urql cacheExchange
      // apply pagination on get many query typed resolvers. (query builder*)
      // however the pagintaion function declared above must match the mold, the design of pagination's type
      // i.e: cursor & limit vs offset & limit
      resolvers: {
        Query: {
          posts: cursorPagination(),
        },
      },
      // auto-update cache for all kind of mutations.
      updates: {
        Mutation: {
          // reset the cache and re-fetch newer data from the server 
          // once the createPost resolver action is completed.
          createPost: (_result, args, cache, info) => {
            const allFields = cache.inspectFields("Query");
            // validate fields
            const fieldInfos = allFields.filter(
              (info) => info.fieldName === "posts"
            );
            // invalidate all posts of field Query to prepare for the next server-data-fetching 
            fieldInfos.forEach(
              (fi) => {
                cache.invalidate("Query", "posts", fi.arguments || {})
              }
            )
          },
          logout: (_result, args, cache, info) => {
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              () => ({ me: null })
            );
          },

          login: (_result, args, cache, info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.login.errors) {
                  return query;
                } else {
                  return {
                    me: result.login.user,
                  };
                }
              }
            );
          },

          register: (_result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.register.errors) {
                  return query;
                } else {
                  return {
                    me: result.register.user,
                  };
                }
              }
            );
          },
        },
      },
    }),
    errorExchange, // global error handling for each URQL request
    ssrExchange, // reduce browser load, better UX
    fetchExchange, //  is responsible for sending operations of type 'query' and 'mutation' to a GraphQL API using fetch
  ],
});
