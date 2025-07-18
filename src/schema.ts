import { SchemaComposer } from 'graphql-compose'
import { getEnergyByBlock, getDailyEnergyUsage } from './blockchain_api_utils'

const schemaComposer = new SchemaComposer()

schemaComposer.createObjectTC({
  name: 'EnergyPerTransaction',
  fields: {
    hash: 'String!',
    size: 'Int!',
    energyKwh: 'Float!',
  }
});

schemaComposer.createObjectTC({
  name: 'DailyEnergyUsage',
  fields: {
    date: 'String!',
    totalEnergyKwh: 'Float!',
  }
});

schemaComposer.Query.addFields({
  energyByBlock: {
    type: () => "[EnergyPerTransaction!]!",
    args: {
      hash: "String!",
    },
    resolve: async (_, { hash }) => await getEnergyByBlock(hash),
    description: "Returns the total energy spent on a specific block."
  },

  dailyEnergyUsage: {
    type: '[DailyEnergyUsage!]!',
    args: {
      days: 'Int!',
    },
    resolve: async (_, { days }) => await getDailyEnergyUsage(days),
    description: 'Returns total energy consumption per day in the last X days.'
  }
})

export const schema = schemaComposer.buildSchema()
