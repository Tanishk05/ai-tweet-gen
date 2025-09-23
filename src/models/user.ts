import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email: string;
  emailVerified?: Date | null;
  image?: string;
  user_type: "ai" | "human";
  profession?: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, unique: true, required: true },
    emailVerified: { type: Date, default: null },
    image: { type: String },
    user_type: {
      type: String,
      enum: ["ai", "human"],
      required: true,
      default: "human",
    },
    profession: { type: String, trim: true },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);
export default User;
