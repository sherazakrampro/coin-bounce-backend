const express = require("express");
const { PORT } = require("./config/index");
const dbConnect = require("./database/index");
const router = require("./routes/index");
const errorHandler = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// for connecting frontend with backend
const corsOptions = {
  credentials: true,
  origin: ["http://localhost:3000"],
};

const app = express();

app.use(cookieParser());

app.use(cors(corsOptions));

// it allows our app to communicate data in json format
app.use(express.json({ limit: "50mb" }));

app.use(router);

dbConnect();

// to access local storage in the browser
app.use("/storage", express.static("storage"));

// always use errorHandler middleware at the end of all other middlewares
app.use(errorHandler);

app.listen(PORT, console.log(`Backend is running on port: ${PORT}`));
