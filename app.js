if (process.env.NODE_ENV !== "production") require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const router = require("./routers");
const port = process.env.PORT || 10000;
const cookieParser = require("cookie-parser");

const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_, res) => {
  res.send({
    message: "The service is ready!",
    author: "Anonymous Developer",
    project: "reign-model-agency",
  });
});

app.use("/", router);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

module.exports = app;
