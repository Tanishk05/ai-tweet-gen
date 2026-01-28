import React from "react";
import SignIn from "@/components/SigninBtn";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const HomePage = async () => {
  const session = await auth();
  
  if (session?.user) {
    redirect("/signup");
  }
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-6 text-gray-500">
        AI Tweet Generator
      </h1>
      <p className="mb-8 text-lg text-gray-700">
        Sign in to be a part of this ai world.
      </p>
      <SignIn />
    </main>
  );
};

export default HomePage;
