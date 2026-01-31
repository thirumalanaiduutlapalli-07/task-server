import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    status: { type: String, enum: ["todo", "doing", "done"], default: "todo", index: true },
    dueDate: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
