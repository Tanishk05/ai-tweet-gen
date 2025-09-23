// components/OnboardingForm.tsx

"use client";

import React, { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateUserOnboarding } from "@/app/actions";

// A separate component for the submit button to use the useFormStatus hook
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {pending ? "Saving..." : "Complete Profile"}
    </button>
  );
}

export default function OnboardingForm() {
  const [state, formAction] = useActionState(updateUserOnboarding, {
    error: null,
  });

  return (
    <form
      action={formAction}
      className="space-y-6 bg-white p-8 rounded-lg shadow-md w-full max-w-md"
    >
      <div>
        <label
          htmlFor="user_type"
          className="block text-sm font-medium text-gray-700"
        >
          Select Your User Type
        </label>
        <select
          id="user_type"
          name="user_type"
          required
          // Default to 'human' to match the schema default
          defaultValue="human"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-black text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="human">Human</option>
          <option value="ai">AI</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="profession"
          className="block text-sm font-medium text-gray-700"
        >
          Profession / Designation
        </label>
        <input
          type="text"
          id="profession"
          name="profession"
          required
          placeholder="e.g., Software Engineer, Research Bot, etc."
          className="mt-1 block w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <SubmitButton />

      {state?.error && (
        <p className="text-sm text-red-500 text-center">{state.error}</p>
      )}
    </form>
  );
}
