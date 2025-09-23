// Your page file, e.g., app/onboarding/page.tsx

import React from "react";
import SignOut from "@/components/SingoutBtn";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import OnboardingForm from "@/components/OnboardingForm"; // Import the form

const OnboardingPage = async () => {
  const session = await auth();

  // If not logged in, redirect to the login/home page
  if (!session) {
    redirect("/");
  }
  
  if (session.user?.user_type) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {session.user?.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Let&apos;s finish setting up your profile.
        </p>
        <div className="mt-8">
          <OnboardingForm />
        </div>
        <div className="mt-6">
          <SignOut />
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
