require("dotenv").config();
const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const mongoose = require("mongoose");
const cors = require("cors");
const os = require("os");
const osUtils = require("os-utils")
const Metric = require("./models/metric");
const { cpuUsage } = require("process");

// Load environment variables
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/devops_dashboard";

// GraphQL Schema
const typeDefs = `
  type ServerMetrics {
    id: ID!
    cpuUsage: Float
    memoryUsage: Float
    diskUsage: Float
    timestamp: String
  }

  type Query {
    getLatestMetrics: ServerMetrics
  }


`;
//removed it as now we will not add it manually
// type Mutation{
//     addMetrics(cpuUsage: Float!, memoryUsage:Float!, diskUsage: Float!): ServerMetrics
//   }


//function to get system metrics
const getSystemMetrics = async () => {
    return new Promise((resolve) => {
        osUtils.cpuUsage((cpuUsage) => {
            const memoryUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
            const diskUsage = Math.random() * 100 //place for real disk usage (needs another package)

            resolve({
                cpuUsage: parseFloat(cpuUsage * 100).toFixed(2),
                memoryUsage: parseFloat(memoryUsage).toFixed(2),
                diskUsage: parseFloat(diskUsage).toFixed(2),
                timestamp: new Date().toISOString(),
            });
        });
    });
};

// function to log metrics every minute 
const logMetrics=async()=>{
    const metrics=await getSystemMetrics();
    const newMetrics=new Metric(metrics);
    await newMetrics.save();
    console.log("Metrics Logged!! -> ",metrics);

};

//run the above function every minute

setInterval(logMetrics,60*1000);


// GraphQL Resolvers
const resolvers = {
    Query: {
        getLatestMetrics: async () => {
            const latestMetric = await Metric.findOne().sort({ timestamp: -1 });
            if (!latestMetric) return null;
            return {
                ...latestMetric.toObject(),
                timestamp: latestMetric.timestamp.toISOString(), // Convert to readable format
            };
        },
    },
    //not needed as we are not manually adding now
    // Mutation: {
    //     addMetrics: async (_, { cpuUsage, memoryUsage, diskUsage }) => {
    //         const newMetric = new Metric({ cpuUsage, memoryUsage, diskUsage });
    //         await newMetric.save();
    //         return {
    //             ...newMetric.toObject(),
    //             timestamp: newMetric.timestamp.toISOString(), // Convert to readable format
    //         };
    //     },
    // },
};

// Initialize Express and GraphQL
async function startServer() {
    const app = express();
    app.use(cors());

    const server = new ApolloServer({ typeDefs, resolvers });
    await server.start();
    server.applyMiddleware({ app });

    // Connect to MongoDB
    mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => console.log("MongoDB Connected"))
        .catch(err => console.error("MongoDB Connection Failed:", err));

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/graphql`));
}

startServer();
