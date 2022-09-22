require('dotenv').config();
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const TrackAPI = require('./datasources/track-api');


const http = require('http')
const express = require('express')
const { ApolloServer  } = require('apollo-server-express')
const { ApolloServerPluginDrainHttpServer  } = require('apollo-server-core')

async function startApolloServer(typeDefs, resolvers) {
  // Required logic for integrating with Express
  const app = express();
  const httpServer = http.createServer(app);

  // Same ApolloServer initialization as before, plus the drain plugin.
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => {
          return {
            trackAPI: new TrackAPI(),
          };
        },
    context: ({ req }) => {
      // Note: This example uses the `req` argument to access headers,
      // Get the user token from the headers.
      const token = req.headers.authorization || '';
    
      // Add the token to the context
      return { token };
    },
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  // More required logic for integrating with Express

  app.use("/checkServer", (req, res) => {
    res.send({status: 'true'})
  })

  await server.start();
  server.applyMiddleware({
    app,

    // By default, apollo-server hosts its GraphQL endpoint at the
    // server root. However, *other* Apollo Server packages host it at
    // /graphql. Optionally provide this to match apollo-server.
    path: '/',
  });

  // Modified server startup
  await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
    console.log(`
    🚀  Server is running!
    🔉  Listening on port 4000
    📭  Query at https://studio.apollographql.com/dev
  `);
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startApolloServer(typeDefs, resolvers);