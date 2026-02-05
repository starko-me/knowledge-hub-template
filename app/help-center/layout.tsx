import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import {
  HelpCenterNavbar,
  MobileMenuButton,
} from "@/components/help-center-navbar";
import { prefetchHelpCenterQueries } from "@/lib/help-center-prefetch";
import { UserSessionProvider } from "@/lib/help-center-session";
import Providers from "@/lib/providers";

export const metadata: Metadata = {
  title: "Help Center - Knowledge Base & Documentation",
  description:
    "Find answers to common questions about Starko's omnichannel customer support software, AI helpdesk, and knowledge base management. Browse documentation, search articles, and get support.",
  keywords: [
    "helpdesk documentation",
    "customer support knowledge base",
    "omnichannel support help",
    "ai helpdesk documentation",
  ],
  openGraph: {
    title: "Starko Help Center - Documentation & Support",
    description:
      "Find answers about our omnichannel customer support software, AI helpdesk, and knowledge base management.",
    url: "https://starko.one/help-center",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dehydratedState } = await prefetchHelpCenterQueries();

  return (
    <Providers>
      <HydrationBoundary state={dehydratedState}>
        <UserSessionProvider>
          <div className="flex">
            <HelpCenterNavbar />

            <div className="flex h-screen w-full flex-col overflow-hidden">
              {/* Mobile Menu Button */}
              <div className="flex items-center border-b bg-background p-4 lg:hidden">
                <MobileMenuButton />
              </div>

              <div className="relative h-full w-full overflow-hidden bg-background">
                <div className="h-full [has-[data-inbox-container]]:overflow-hidden">
                  <div className="h-full overflow-y-auto p-2 sm:p-4 [has-[data-inbox-container]]:overflow-hidden [has-[data-inbox-container]]:p-0">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UserSessionProvider>
      </HydrationBoundary>
    </Providers>
  );
}
