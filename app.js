import "dotenv/config";

import express from "express";
import cors from "cors";
import morgan from "morgan";


import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

console.log("byee")

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
 
await connectDB(process.env.MONGO_URI);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


console.log("hello")