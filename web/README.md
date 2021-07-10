### Technology used
1.  [URQL](https://formidable.com/open-source/urql/): connect typescript graphql client to NextJS client, URQL client is basically a middle man for express-graphQL server and the Next.js client
2.  [URQL-Graphcache](https://formidable.com/open-source/urql/docs/graphcache/): update the cache automatically in a normalized structure with each request to graphql Server
3.  [Next.js](https://nextjs.org/) + [Chakra-UI](https://chakra-ui.com/docs/getting-started): Front-end framework and css
4.  [URQL-SSR] (https://formidable.com/open-source/urql/docs/advanced/server-side-rendering/): 
Server-side rendering (SSR) is a performance optimization for modern web apps. It enables you to render your app's initial state to raw HTML and CSS before serving it to a browser. This means users don't have to wait for their browser to download and initialize React (or Angular, Vue, etc.) before content is available.
To better understand, see this [link](https://www.apollographql.com/docs/react/performance/server-side-rendering/)

- The withUrqlClient(...) hook connects URQL client with the Next's pages. To enable ssr for that page, we pass in the ssr option and set it to true.

URQL related..
- https://formidable.com/open-source/urql/docs/api/core/#exchanges
- https://formidable.com/open-source/urql/docs/graphcache/cache-updates/

Serverside-rendering: so the idea of rendering the pages in Next (or React or whatever framework) to raw HTML and CSS is to improve SEO, see 4:00:00 in Ben's lireddit tutorial. When we not applying SSR, the page source only shows the HTML and has to evaluate javascript, thus the javascript data won't show in source (Really bad for SEO)