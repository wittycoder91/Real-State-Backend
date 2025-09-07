const { MongoClient } = require("mongodb");
// const mongodbUri = "mongodb://localhost:27017/";
const mongodbUri =
  "mongodb://admin:tc7wz%402trs1!@64.202.188.249:27017/?authSource=admin";
const client = new MongoClient(mongodbUri);
let db;

const connectToDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB");

    // Verify connection and initialize the database
    db = client.db("student-realestate");
    if (!db) {
      throw new Error("Database 'student-realestate' is undefined. Check the database name.");
    }
    console.log("Database selected:", db.databaseName);
  } catch (e) {
    console.error("Error connecting to MongoDB:", e);
  } finally {
    if (client) {
      await client.dis;
      console.log("MongoDB connection closed");
    }
  }
};

getDb = () => {
  return db;
};

getUserCollection = () => {
  return db.collection("users");
};
getAdminCollection = () => {
  return db.collection("admins");
};

getRealEstateCollection = () => {
  return db.collection("realestate");
};

getContactCollection = () => {
  return db.collection("contacts");
};

module.exports = {
  getDb,
  connectToDatabase,
  getUserCollection,
  getAdminCollection,
  getRealEstateCollection,
  getContactCollection,
};
