const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");
const { connectToDatabase } = require("./helpers/db-conn");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", routes);

connectToDatabase();

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});
