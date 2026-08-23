import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getOptionalSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
