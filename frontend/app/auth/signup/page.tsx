import { redirect } from "next/navigation";

/** Legacy URL: customer signup is the default entry for generic /auth/signup links. */
export default function SignupPage() {
  redirect("/auth/signup/customer");
}
