import { redirect } from "next/navigation";

/**
 * @deprecated This route has been renamed to /assets/projects
 * This redirect is kept for backward compatibility
 */
export default function RepositoriesRedirect() {
  redirect("/assets/projects");
}
