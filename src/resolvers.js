const fetch = require('node-fetch');

const resolvers = {
    Query: {
      // Resolver Query implementation using RESRDatasource.
      tracksForHome: (_, __, {dataSources}) => {
        return dataSources.trackAPI.getTracksForHome();
      },

      // Resolver Query implementation using Fetch
      tracksForHomeFetch: async () => {
        const baseUrl = "https://odyssey-lift-off-rest-api.herokuapp.com";
        const res = await fetch(`${baseUrl}/tracks`);
        return res.json();
      },

      getCarePlanDetails: async () => {
        const response = await fetch(`${process.env.BASEURL}api/v1/CarePlan?patientId=8738f5d6-0398-45db-8703-528a7c2a99c2`, {
          method: 'get',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.TOKEN
          }
        });
        const data = await response.json();
        return data;
      }
    },
    Track: {
        author: async ({ authorId }, _, { dataSources }) => {
            const baseUrl = "https://odyssey-lift-off-rest-api.herokuapp.com";
            const res = await fetch(`${baseUrl}/author/${authorId}`);
            return res.json();
        },
    //   author: ({authorId}, _, {dataSources}) => {
    //     return dataSources.trackAPI.getAuthor(authorId);
    //   }
    }
};

module.exports = resolvers;