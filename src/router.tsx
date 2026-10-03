import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ({ error }) => {
      const msg = String((error as Error)?.message ?? error);
      const offline = (typeof navigator !== "undefined" && !navigator.onLine) || /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(msg);
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-lg text-foreground">
          {offline ? "This part of the app isn't saved on this phone yet — open it once online." : "This page didn't load. Please go back and try again."}
        </div>
      );
    },
  });

  return router;
};
