const { gql } = require('apollo-server-express');

const typeDefs = gql`

    type Query {
        "Get tracks array for homepage grid"
        tracksForHome: [Track!]!
        tracksForHomeFetch: [Track!]!
        getCarePlanDetails: CarePlanResponse,
        getHomeData(patientId: ID!): HomeData     
    }

    "A track is a group of Modules that teaches about a specific topic"
    type Track {
        id: ID!
        "The track's title"
        title: String!
        "The track's main author"
        author: Author!
        "The track's main illustration to display in track card or track page detail"
        thumbnail: String
        "The track's approximate length to complete, in minutes"
        length: Int
        "The number of modules this track contains"
        modulesCount: Int
    }

    "Author of a complete Track"
    type Author {
        id: ID!
        "Author's first and last name"
        name: String!
        "Author's profile picture url"
        photo: String
    }

    "Care Plan Details"
    type CarePlanResponse {
        data: Data
        message: String
        outcome: String
    }

    type Data {
        entry: [Entry]
        type: String
        resourceType: String
    }

    type Entry {
        fullUrl: String!
        resource: Resource
    }

    type Resource {
        id: ID!
        status: String
        resourceType: String
        created: String
    }

    type HomeData {
        tiles: [Tile]
    }

    type Tile {
        id: String
        value: String
        display: String
        logo: String
    }
`;

module.exports = typeDefs;