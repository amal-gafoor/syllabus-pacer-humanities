import { redirect } from "next/navigation";

// The planner starts at student details; "/" is just the front door.
export default function Home() {
  redirect("/details");
}
