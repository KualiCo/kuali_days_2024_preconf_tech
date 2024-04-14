// Dependencies
require('dotenv').config();
const axios = require('axios');
const gql = strs => strs[0];


// Global Variables
const appId = "65d7e1d6f9a011013c73290b";


// This function creates the base request for making api calls into the platform
const build = axios.create({
    baseURL: `https://${process.env.DOMAIN}`,
    headers: {
        Authorization: `Bearer ${process.env.TOKEN}`
    }
});

// This graphql queries all documents in a given app and retrieves their ids
const DOCUMENT_LIST_QUERY = gql `
query APP ($id: ID!) {
    app(id: $id) {
      documentConnection{
        edges {
          node {
            id
          }
        }
      }
    }
  }
  `;

// This graphql mutation deletes a document by an id in an app
const DELETE_DOCUMENT_MUTATION = gql `
mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
  `;


// A function for running the document list query and passing the appid global variable to it
const queryDocuments = () => {
    return build.post('/app/api/v0/graphql', {
        query: DOCUMENT_LIST_QUERY,
        variables: {
            id: appId,
        }
    }).catch(err => {
        console.log("error querying app", JSON.stringify(err));
    });
};


// A function for running the delete document mutation and passing a documnet id in
const deleteDoc = (id) => {
    return build.post('/app/api/v0/graphql', {
        query: DELETE_DOCUMENT_MUTATION,
        variables: {
            id
        }
    }).catch(err => console.log("err", JSON.stringify(err)));
};


// This is our main script function that executes the above mutations, functions, and variables
const main = async () => {


    const documentData = await queryDocuments()
    // Extract the document data array from the query
    const documentArr = documentData.data.data.app.documentConnection.edges

    // Extract the ids from the document objects and push them into their own array
    let idArr = []
    documentArr.forEach(id => idArr.push(id.node.id))

    // This loops over our csv data rows and runs the initialize workflow and submit document functions for each row of the CSV
    idArr.forEach(async id => {

        const documentDeleted = await deleteDoc(id)
        // This logs the result of our submit document mutation
        console.log(JSON.stringify(documentDeleted.data))
    });
};

main();