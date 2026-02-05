"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Response } from "@/components/ai-elements/response";
import { CreateTicketDialog } from "@/components/create-ticket-dialog";
import { HelpCenterAuthDialog } from "@/components/help-center-auth-dialog";
import { TicketPriorityIcon } from "@/components/ticket-priority-icon";
import { TicketStatusIcon } from "@/components/ticket-status-icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSingleTicket, getWorkspaceInfo } from "@/lib/help-center";
import { CLIENT_KEY } from "@/lib/help-center-config";
import { useUserSession } from "@/lib/help-center-session";

function SingleTicketSkeleton({
  header,
}: {
  header: { title: string; description: string };
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      data-inbox-container
    >
      <div className="shrink-0 border-b bg-background px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-lg">{header.title}</h2>
            <p className="text-muted-foreground text-sm">
              {header.description}
            </p>
          </div>
          <Button className="shrink-0" disabled>
            <Plus className="mr-2 size-4" />
            Create Ticket
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <Skeleton className="h-9 w-36" />
          </div>
          <article className="prose prose-slate dark:prose-invert">
            <Skeleton className="mb-4 h-10 w-3/4 max-w-md" />
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export default function SingleTicketPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { isAuthenticated, isLoading: isAuthLoading } = useUserSession();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: workspaceData } = useQuery({
    queryKey: ["help-center-workspace"],
    queryFn: getWorkspaceInfo,
  });

  const translations = (workspaceData?.data?.translations?.navigation ||
    {}) as Record<string, string | undefined>;
  const ticketsPageTitle = translations?.tickets_page ?? "Tickets";
  const ticketsPageDescription =
    translations?.tickets_description ?? "View and manage your support tickets";

  const { data, isLoading, error } = useQuery({
    queryKey: ["help-center-ticket", id],
    queryFn: async () => {
      const token = localStorage.getItem("starko-token");
      if (!token) {
        throw new Error("No token");
      }
      return getSingleTicket(CLIENT_KEY, token, id);
    },
    enabled: Boolean(isAuthenticated && id),
  });

  useEffect(() => {
    const shouldOpenAuth = !(isAuthLoading || isAuthenticated);
    if (shouldOpenAuth) {
      setAuthDialogOpen(true);
    }
  }, [isAuthLoading, isAuthenticated]);

  if (!id) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground text-sm">Missing ticket ID.</p>
        <Button asChild className="mt-2" variant="outline">
          <Link href="/help-center/tickets">Back to tickets</Link>
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground text-sm">
            Sign in to view this ticket.
          </p>
        </div>
        <HelpCenterAuthDialog
          onOpenChange={setAuthDialogOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["help-center-ticket", id],
            });
          }}
          open={authDialogOpen}
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <SingleTicketSkeleton
        header={{
          title: ticketsPageTitle,
          description: ticketsPageDescription,
        }}
      />
    );
  }

  if (error) {
    notFound();
  }

  if (!data?.ok || data?.data == null) {
    notFound();
  }

  const ticket = data.data as {
    id: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
    status: string;
    priority?: string;
  };

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      data-inbox-container
    >
      {/* Header – same as tickets list */}
      <div className="shrink-0 border-b bg-background px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-lg">{ticketsPageTitle}</h2>
            <p className="text-muted-foreground text-sm">
              {ticketsPageDescription}
            </p>
          </div>
          <Button
            className="shrink-0"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            Create Ticket
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <Button asChild variant="outline">
              <Link href="/help-center/tickets">← Back to tickets</Link>
            </Button>
          </div>
          <article className="prose prose-slate dark:prose-invert">
            <h1 className="mb-4 font-bold text-4xl" id="ticket-title">
              {ticket.title}
            </h1>
            <div className="mb-8 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 capitalize">
                <TicketStatusIcon status={ticket.status ?? "open"} />
                {(ticket.status ?? "open").replace(/_/g, " ")}
              </span>
              {ticket.priority != null && ticket.priority !== "" && (
                <span className="inline-flex items-center gap-1 capitalize">
                  <TicketPriorityIcon priority={ticket.priority} />
                  {(ticket.priority ?? "").replace(/_/g, " ")}
                </span>
              )}
              {ticket.created_at && (
                <time dateTime={ticket.created_at}>
                  Created {new Date(ticket.created_at).toLocaleDateString()}
                </time>
              )}
              {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                <time dateTime={ticket.updated_at}>
                  Updated {new Date(ticket.updated_at).toLocaleDateString()}
                </time>
              )}
            </div>
            <div data-article-content>
              <Response className="md:max-none max-w-none!important lg:max-w-none">
                {ticket.description ?? ""}
              </Response>
            </div>
          </article>
        </div>
      </div>

      <CreateTicketDialog
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
      />
    </div>
  );
}
