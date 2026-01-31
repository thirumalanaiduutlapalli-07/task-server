import { z } from "zod";
import Task from "../models/Task.js";
import { AppError } from "../utils/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTaskSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  dueDate: z.string().datetime().optional().nullable()
});

const updateTaskSchema = createTaskSchema.partial();

export const createTask = asyncHandler(async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Validation error", 400, parsed.error.flatten());

  const { title, description = "", status = "todo", dueDate = null } = parsed.data;

  const task = await Task.create({
    userId: req.user.id,
    title,
    description,
    status,
    dueDate: dueDate ? new Date(dueDate) : null
  });

  res.status(201).json({ task });
});

export const listTasks = asyncHandler(async (req, res) => {
  const { status, sort = "-createdAt" } = req.query;

  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
  const skip = (page - 1) * limit;

  const filter = { userId: req.user.id };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Task.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Task.countDocuments(filter)
  ]);

  const pages = Math.ceil(total / limit) || 1;

  res.json({
    tasks: items,
    meta: { total, page, limit, pages }
  });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) throw new AppError("Task not found", 404);
  res.json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Validation error", 400, parsed.error.flatten());

  const update = { ...parsed.data };
  if (Object.prototype.hasOwnProperty.call(update, "dueDate")) {
    update.dueDate = update.dueDate ? new Date(update.dueDate) : null;
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: update },
    { new: true }
  );

  if (!task) throw new AppError("Task not found", 404);

  res.json({ task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!task) throw new AppError("Task not found", 404);
  res.json({ message: "Task deleted" });
});
