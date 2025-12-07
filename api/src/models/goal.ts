import { Schema, Document } from 'mongoose';
export interface IGoalMilestone {
  mark: number; // the token value to reach
  gifUrl?: string;
  wavUrl?: string;
}
export interface IGoal extends Document {
  total: number; // session goal
  milestones: IGoalMilestone[]; // up to 5 user-defined for progress triggers
}
export const GoalMilestoneSchema = new Schema<IGoalMilestone>({
  mark: { type: Number, required: true },
  gifUrl: { type: String },
  wavUrl: { type: String },
});
export const GoalSchema = new Schema<IGoal>({
  total: { type: Number, required: true },
  milestones: { type: [GoalMilestoneSchema], default: [] },
});
export default GoalSchema;
