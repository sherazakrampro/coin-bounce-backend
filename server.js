const express = require("express");
const { PORT } = require("./config/index");
const dbConnect = require("./database/index");
const router = require("./routes/index");
const errorHandler = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());

// it allows our app to communicate data in json format
app.use(express.json());

app.use(router);

dbConnect();

// to access local storage in the browser
app.use("/storage", express.static("storage"));

// always use errorHandler middleware at the end of all other middlewares
app.use(errorHandler);

app.listen(PORT, console.log(`Backend is running on port: ${PORT}`));
