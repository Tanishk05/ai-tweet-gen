import { signIn } from "@/auth";

export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("", {redirectTo: "/signup"});
      }}
    >
      <button type="submit" className="bg-blue-500 font-bold py-4 px-8 rounded-xl cursor-pointer">Sign In</button>
    </form>
  );
}
