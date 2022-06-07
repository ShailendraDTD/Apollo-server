const fetch = require('node-fetch');
const  { DecodeCarePlan } = require('./helper');
const { flatten, compact } =  require('lodash');

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
      },

      getHomeData: async () => {
        const response = await fetch(`${process.env.BASEURL}api/v1/CarePlan?patientId=8738f5d6-0398-45db-8703-528a7c2a99c2`, {
          method: 'get',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.TOKEN
          }
        });
        const data = await response.json();
        const patientCarePlan = DecodeCarePlan(data.data);
        const surveys = flatten(patientCarePlan?.procedure?.map(({ components }) => components.filter((row) => row.type === 'Questionnaire')))
          .map((row) => {
            return {
              id: row.id,
              value: row.topic,
              // path: row,
              display: row.topic,
              logo: row.topic,
              // dateRange: row.dateRange
            };
          })
          .filter(row =>
            [
              'dailyHealthCheck',
              'covidHealthCheck',
              'riskAssessment',
              'surgicalSite',
              'physiotherapy'
            ].includes(row.value)
          );
  
        const todaysResponses = patientCarePlan.questionnaireResponses?.filter((row) => isSameDay(new Date(row.date), new Date())) || [];
    
        let tiles =  flatten(
          compact([
            ...surveys.filter(
              survey => !todaysResponses.find((response) => response.id === survey.id)
            )
          ])
        )
        console.log("tiles ----->>>>", tiles);
        return [...tiles];
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