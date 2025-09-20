import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors"; // <-- import cors
import indexRouter from "./routes/index.mjs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// -----------------------------
// CORS middleware
// -----------------------------
app.use(
  cors({
    origin: "http://localhost:3000", // allow only this origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // if you need to send cookies
  })
);

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", indexRouter);

mongoose
  .connect(process.env.database_url) 
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));


// Basic route
app.get("/", (req, res) => {
  res.send("Welcome to the Hackathon Server!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
