import mongoose from "mongoose";
import { AppError } from "../utils/error.js";

export function notFound(req, res) {
  res.status(404).json({ error: { message: "Route not found" } });
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server error";
  let details = err.details || null;

  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (err?.code === 11000) {
    statusCode = 409;
    message = "Duplicate key error";
    details = err.keyValue;
  }

  if (!(err instanceof AppError) && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ error: { message, details } });
}
