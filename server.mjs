import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import indexRouter from "./routes/index.mjs";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", indexRouter);
// Connect to MongoDB
mongoose
  .connect(process.env.database_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:"));

// Basic route
app.get("/", (req, res) => {
  res.send("Welcome to the Hackathon Server!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
