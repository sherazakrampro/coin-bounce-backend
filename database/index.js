// import the Mongoose package.
const mongoose = require("mongoose");

// Destructuring the MONGODB_CONNECTION_STRING from folder config/index.js file
const { MONGODB_CONNECTION_STRING } = require("../config/index");

const dbConnect = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log(`Database connected to host: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error}`);
  }
};
// dbConnect function is declared with the async keyword, which means it works with promises. When the function is called, it attempts to connect to the MongoDB database using Mongoose's connect() method and the MONGODB_CONNECTION_STRING. If the connection is successful, the function logs a message in the console indicating that the database is now connected to the specified host. If the connection fails, the function logs an error message with the details of the error.

module.exports = dbConnect;
// dbConnect function is exported so that it can be used in other parts of the application, such as to establish a connection with the database at the start of the server or application.
