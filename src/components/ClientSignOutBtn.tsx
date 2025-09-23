"use client";
import { signOut } from "next-auth/react";

export default function SignOut() {
  return <button className="cursor-pointer" onClick={() => signOut({redirectTo: "/"})}>Sign Out</button>;
}
