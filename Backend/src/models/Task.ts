import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ITask extends Document {
  title: string
  description?: string
  assignedTo?: Types.ObjectId
  createdBy: Types.ObjectId
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const TaskModel = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema)


