"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { postTweet, postComment, fetchTweets } from "../actions";
import SignOut from "@/components/ClientSignOutBtn";
import { useRouter } from "next/navigation";

interface UserType {
  name?: string;
  user_type?: "ai" | "human";
  profession?: string;
}

interface TweetType {
  _id: string;
  content: string;
  type: "tweet" | "comment" | "reply";
  user?: UserType;
  parentTweet?: string;
  comments?: TweetType[];
}

const HomePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tweet, setTweet] = useState("");
  const [tweets, setTweets] = useState<TweetType[]>([]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Load tweets from API/DB
  const loadTweets = async () => {
    const data = await fetchTweets();
    const mappedTweets: TweetType[] = (data as unknown[]).map((t) => {
      const tweetObj = t as {
        _id?: string;
        content?: string;
        type?: string;
        user?: UserType;
        parentTweet?: string;
        comments?: unknown[];
      };
      return {
        _id: tweetObj._id?.toString() ?? "",
        content: tweetObj.content ?? "",
        type: (tweetObj.type as "tweet" | "comment" | "reply") ?? "tweet",
        user: tweetObj.user
          ? {
              name: tweetObj.user.name,
              user_type: tweetObj.user.user_type,
              profession: tweetObj.user.profession,
            }
          : undefined,
        parentTweet: tweetObj.parentTweet?.toString(),
        comments: Array.isArray(tweetObj.comments)
          ? tweetObj.comments.map((c) => {
              const commentObj = c as {
                _id?: string;
                content?: string;
                type?: string;
                user?: UserType;
              };
              return {
                _id: commentObj._id?.toString() ?? "",
                content: commentObj.content ?? "",
                type:
                  (commentObj.type as "comment" | "reply" | "tweet") ??
                  "comment",
                user: commentObj.user
                  ? {
                      name: commentObj.user.name,
                      user_type: commentObj.user.user_type,
                      profession: commentObj.user.profession,
                    }
                  : undefined,
              };
            })
          : [],
      };
    });

    setTweets(mappedTweets);
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadTweets();
    }
  }, [status]);

  const handleTweet = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("content", tweet);
    await postTweet(formData);
    setTweet("");
    loadTweets();
  };

  const handleComment = async (tweetId: string, comment: string) => {
    if (!session?.user?.id) return;
    await postComment(tweetId, comment, session.user.id);
    loadTweets();
  };

  // AI auto-tweet
  useEffect(() => {
    if (!session?.user) return;
    if (session.user.user_type === "ai") {
      const interval = setInterval(async () => {
        const formData = new FormData();
        formData.append("content", ""); // triggers AI-generated tweet
        await postTweet(formData);
        loadTweets();
      }, getRandomInterval());

      return () => clearInterval(interval);
    }
  }, [session]);

  const getRandomInterval = () =>
    Math.floor(Math.random() * (5 - 2 + 1) * 60 * 1000 + 2 * 60 * 1000); // 2–5 min

  if (status === "loading") return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <SignOut />
      <h1 className="text-2xl font-bold mb-4">Welcome {session?.user.name}</h1>
      <p className="mb-6 text-gray-600">
        {session?.user.user_type === "ai"
          ? `🤖 AI (${session.user.profession})`
          : "👤 Human"}
      </p>

      {session?.user.user_type === "human" && (
        <form onSubmit={handleTweet} className="flex gap-2 mb-6">
          <input
            type="text"
            value={tweet}
            onChange={(e) => setTweet(e.target.value)}
            placeholder="What's happening?"
            className="flex-1 border rounded-lg p-2"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">
            Tweet
          </button>
        </form>
      )}

      <div className="space-y-4">
        {tweets.map((t) => (
          <div key={t._id} className="border p-3 rounded-lg bg-gray-50">
            <p className="text-black">
              <strong>{t.user?.name || "Unknown"}:</strong> {t.content}
            </p>

            {/* Nested comments */}
            {t.comments?.map((c) => (
              <div key={c._id} className="ml-4 mt-2 border-l-2 pl-2">
                <p className="text-black">
                  <strong>{c.user?.name || "Unknown"}:</strong> {c.content}
                </p>
              </div>
            ))}

            {/* Add comment for humans */}
            {session?.user.user_type === "human" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const commentInput = (
                    e.currentTarget.elements[0] as HTMLInputElement
                  ).value;
                  handleComment(t._id, commentInput);
                  (e.currentTarget.elements[0] as HTMLInputElement).value = "";
                }}
                className="flex gap-2 mt-2"
              >
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 border rounded-lg p-1 text-black"
                />
                <button className="bg-green-500 text-white px-2 py-1 rounded-lg">
                  Comment
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
