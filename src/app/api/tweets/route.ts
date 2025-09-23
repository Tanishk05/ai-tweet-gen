import { NextRequest, NextResponse } from "next/server";
import { fetchTweets } from "@/app/actions";

export async function GET(req: NextRequest) {
  try {
    const tweets = await fetchTweets();
    return NextResponse.json(tweets);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch tweets" },
      { status: 500 }
    );
  }
}
