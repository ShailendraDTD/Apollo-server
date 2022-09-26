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

      getCarePlanDetails: async (parent, args, context, info) => {
        const response = await fetch(`${process.env.BASEURL}api/v1/CarePlan?patientId=${args.patientId}`, {
          method: 'get',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + context?.token
          }
        });
        const data = await response.json();
        return data;
      },

      getHomeData: async (parent, args, context, info) => {
        const response = await fetch(`${process.env.BASEURL}api/v1/CarePlan?patientId=${args.patientId}`, {
          method: 'get',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + context?.token
          }
        });
        const data = await response.json();
        const patientCarePlan = DecodeCarePlan(data.data);
        const surveys1 = flatten(patientCarePlan?.procedure?.map(({ components }) => components.filter((row) => row.type === 'Questionnaire')))
          .map((row) => {
            return {
              id: row.id,
              value: row.topic,
              display: row.topic,
              logo: `${process.env.IMAGE_BUCKET}${row.topic}.svg`,
            };
          })
        const surveys =  surveys1.filter(row =>
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
        return {tiles};
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