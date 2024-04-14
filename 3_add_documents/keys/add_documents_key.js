// Dependencies
require('dotenv').config();
const axios = require('axios');
const csv = require('csvtojson');
const gql = strs => strs[0];


// Global Variables
const CSV_FILE = "states.csv";
const appId = "APP ID GOES HERE";


// This function creates the base request for making api calls into the platform
const build = axios.create({
    baseURL: `https://${process.env.DOMAIN}`,
    headers: {
        Authorization: `Bearer ${process.env.TOKEN}`
    }
});


// This graphql mutation creates a document in a given app
const INITIALIZE_WORKFLOW_MUTATION = gql `
mutation InitializeWorkflow ($args: InitializeWorkflowInput!) {
    initializeWorkflow(args: $args) {
      documentId
      actionId
    }
  }
  `;


// This graphql mutation sends data to the document that was initialized
const SUBMIT_DOCUMENT_MUTATION = gql `
mutation SubmitDocument ($documentId: ID!, $actionId: ID!, $data: JSON, $status: String) {
    submitDocument(id: $documentId, actionId: $actionId, data: $data, status: $status)
  }
  `;


// A function for running the workflow mutation and passing the appid global variable
const initializeWorkflow = () => {
    return build.post('/app/api/v0/graphql', {
        query: INITIALIZE_WORKFLOW_MUTATION,
        variables: {
            args: {
                id: appId,
            }
        }
    }).catch(err => {
        console.log("error initializing workflow", JSON.stringify(err));
    });
};


// A function for running the submit document mutation and passing the data in
const submitDoc = (actionId, documentId, data) => {
    return build.post('/app/api/v0/graphql', {
        query: SUBMIT_DOCUMENT_MUTATION,
        variables: {
            documentId,
            actionId,
            status: "completed",
            data
        }
    }).catch(err => console.log("err", JSON.stringify(err)));
};


// This is our main script function that executes the above mutations, functions, and variables
const main = async () => {


    // This reads in your CSV data and converts it to JSON
    const csvData = await csv({
        flatKeys: true
    }).fromFile(CSV_FILE);

    // This loops over our csv data rows and runs the initialize workflow and submit document functions for each row of the CSV
    for (let row of csvData) {
        const workflowData = await initializeWorkflow();
        // Once the workflow mutation runs, we need to extract the actionId and documentId from the response
        const {
            actionId,
            documentId
        } = workflowData.data.data.initializeWorkflow;

        // This is where you would specify the fields and data for each document
        const dataToSend = {

            "latitude": row.latitude,
            "longitude": row.longitude,
            "state": row.state,
            "abbr": row.abbr

        };

        const documentSubmitted = await submitDoc(actionId, documentId, dataToSend)
        // This logs the result of our submit document mutation
        console.log(JSON.stringify(documentSubmitted.data))

    };
};



main();