"use server";

import dbConnect from "@/lib/mongoose";
import User from "@/models/user";
import Tweet from "@/models/tweet";
import { auth } from "@/auth";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { redirect } from "next/navigation";
import { Types } from "mongoose";

/* ============================
   Onboarding
============================ */
const OnboardingSchema = z.object({
  user_type: z.enum(["ai", "human"]),
  profession: z.string().min(2).trim(),
});

export async function updateUserOnboarding(
  prevState: unknown,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const validated = OnboardingSchema.safeParse({
    user_type: formData.get("user_type"),
    profession: formData.get("profession"),
  });

  if (!validated.success) return { error: "Invalid data" };

  try {
    await dbConnect();
    await User.findByIdAndUpdate(session.user.id, validated.data);
  } catch (err) {
    console.error(err);
    return { error: "Failed to update user" };
  }

  redirect("/home");
}

/* ============================
   Tweet Helpers
============================ */
const TweetSchema = z.object({ content: z.string().min(1) });

async function getAIHistory(userId: string, limit = 20) {
  await dbConnect();
  const history = await Tweet.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return history.reverse();
}

async function generateAITweet(userId: string) {
  const history = (await getAIHistory(userId)).map(
    (h) => `${h.type.toUpperCase()}: ${h.content}`,
  );

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-pro",
    temperature: 0.8,
  });

  const res = await llm.invoke(
    [...history, "Generate a casual tweet about your profession"].join("\n"),
  );

  return res.content as string;
}

export async function generateAIReply(comment: string, userId: string) {
  const history = (await getAIHistory(userId)).map(
    (h) => `${h.type.toUpperCase()}: ${h.content}`,
  );

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-pro",
    temperature: 0.7,
  });

  const res = await llm.invoke(
    [
      ...history,
      `Someone commented: "${comment}". Write a single reply as the original author.`,
    ].join("\n"),
  );

  return res.content as string;
}

/* ============================
   Post Tweet
============================ */
export async function postTweet(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const validated = TweetSchema.safeParse({
    content: formData.get("content") ?? "",
  });

  if (!validated.success) return { error: "Invalid tweet" };

  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) return { error: "User not found" };

  const finalTweet =
    user.user_type === "ai"
      ? await generateAITweet(user._id.toString())
      : validated.data.content;

  const tweet = await Tweet.create({
    user: user._id,
    content: finalTweet,
    type: "tweet",
  });

  return {
    success: true,
    tweet: {
      _id: tweet._id.toString(),
      user: tweet.user.toString(),
      content: tweet.content,
      type: tweet.type,
      createdAt: tweet.createdAt.toISOString(),
    },
  };
}

/* ============================
   Post Comment
============================ */
export async function postComment(
  tweetId: string,
  comment: string,
  userId: string,
) {
  await dbConnect();

  await Tweet.create({
    user: userId,
    content: comment,
    type: "comment",
    parentTweet: tweetId,
  });

  const parentTweet = await Tweet.findById(tweetId);
  if (!parentTweet) return { error: "Parent tweet not found" };

  const tweetOwner = await User.findById(parentTweet.user);

  if (tweetOwner?.user_type === "ai") {
    const replyContent = await generateAIReply(
      comment,
      tweetOwner._id.toString(),
    );

    await Tweet.create({
      user: tweetOwner._id,
      content: replyContent,
      type: "reply",
      parentTweet: parentTweet._id,
    });

    return { success: true, reply: replyContent };
  }

  return { success: true };
}

/* ============================
   Types
============================ */
export type LeanUser = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  image?: string;
  user_type: "ai" | "human";
  profession?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LeanTweet = {
  _id: Types.ObjectId;
  content: string;
  type: "tweet" | "comment" | "reply";
  user: LeanUser | Types.ObjectId;
  parentTweet?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

/* ============================
   Serializer
============================ */
function serializeDoc(doc: LeanTweet) {
  return {
    ...doc,
    _id: doc._id.toString(),
    user:
      typeof doc.user === "object" && "_id" in doc.user
        ? { ...doc.user, _id: doc.user._id.toString() }
        : (doc.user as Types.ObjectId).toString(),
    parentTweet: doc.parentTweet?.toString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/* ============================
   Fetch Tweets
============================ */
export async function fetchTweets() {
  await dbConnect();

  const tweets = await Tweet.find({ type: "tweet" })
    .populate("user")
    .sort({ createdAt: -1 })
    .lean<LeanTweet[]>();

  const tweetsWithComments = await Promise.all(
    tweets.map(async (t) => {
      const comments = await Tweet.find({ parentTweet: t._id })
        .populate("user")
        .sort({ createdAt: 1 })
        .lean<LeanTweet[]>();

      return {
        ...serializeDoc(t),
        comments: comments.map(serializeDoc),
      };
    }),
  );

  return tweetsWithComments;
}
