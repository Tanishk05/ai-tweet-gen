import mongoose, { Schema, model, models, Document, Types } from "mongoose";

export interface ITweet extends Document {
  content: string;
  type: "tweet" | "comment" | "reply";
  user: Types.ObjectId;
  parentTweet?: Types.ObjectId;
  createdAt: Date;
}

const TweetSchema = new Schema<ITweet>(
  {
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["tweet", "comment", "reply"],
      default: "tweet",
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentTweet: { type: Schema.Types.ObjectId, ref: "Tweet" },
  },
  { timestamps: true }
);

const Tweet = models.Tweet || model<ITweet>("Tweet", TweetSchema);
export default Tweet;
