"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CreateTicketDialog } from "@/components/create-ticket-dialog";
import { HelpCenterAuthDialog } from "@/components/help-center-auth-dialog";
import { TicketStatusIcon } from "@/components/ticket-status-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getTickets, getWorkspaceInfo } from "@/lib/help-center";
import { CLIENT_KEY } from "@/lib/help-center-config";
import { useUserSession } from "@/lib/help-center-session";
import { useDebouncedValue } from "@/lib/hooks";

interface TicketType {
  id: string;
  title: string;
  status: string;
  updated_at: string;
}

const OPEN_STATUSES = new Set(["open", "pending", "inprogress"]);
function isOpen(status: string) {
  const normalized = status.toLowerCase().replace(/_/g, "");
  return OPEN_STATUSES.has(normalized);
}

const TZ_OFFSET_PATTERN = /[+-]\d{2}:?\d{2}$/;

/** Treat DB timestamp as UTC (no Z suffix) when parsing */
function parseUtc(dateString: string): Date {
  const s = dateString.trim();
  const hasExplicitTz = s.endsWith("Z") || TZ_OFFSET_PATTERN.test(s);
  return new Date(hasExplicitTz ? s : `${s}Z`);
}

function formatRelativeTime(dateString: string): string {
  const date = parseUtc(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffDays >= 1) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }
  if (diffHours >= 1) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  if (diffMins >= 1) {
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  }
  return "Just now";
}

const LIST_GRID_CLASS =
  "grid grid-cols-[1fr_120px_100px] gap-4 border-b px-4 py-3 last:border-b-0";

function TicketsListSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <Skeleton className="mb-3 h-4 w-16" />
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="grid grid-cols-[1fr_120px_100px] gap-4 border-b bg-muted/50 px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">
            <span>Issue</span>
            <span className="text-right">Status</span>
            <span className="text-right">Created</span>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              className={LIST_GRID_CLASS}
              key={i}
            >
              <div className="flex min-w-0 flex-col gap-1">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-4 w-3/4 max-w-xs" />
              </div>
              <div className="flex items-center justify-end">
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
              <div className="flex items-center justify-end">
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function TicketsPage() {
  const { isAuthenticated, isLoading, checkAuth } = useUserSession();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data: workspaceData } = useQuery({
    queryKey: ["help-center-workspace"],
    queryFn: getWorkspaceInfo,
  });

  const translations = (workspaceData?.data?.translations?.navigation ||
    {}) as Record<string, string | undefined>;
  const ticketsPageTitle = translations?.tickets_page || "Tickets";
  const ticketsPageDescription =
    translations?.tickets_description || "View and manage your support tickets";

  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery({
    queryKey: ["help-center-tickets", debouncedSearch],
    queryFn: async () => {
      const token = localStorage.getItem("starko-token");
      if (!token) {
        throw new Error("No token");
      }
      return getTickets(CLIENT_KEY, token, {
        search: debouncedSearch.trim() || undefined,
      });
    },
    enabled: isAuthenticated,
    refetchInterval: 10_000,
  });

  const allTickets: TicketType[] = ticketsData?.data || [];
  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return allTickets;
    }
    const q = debouncedSearch.toLowerCase();
    return allTickets.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.status.toLowerCase().includes(q)
    );
  }, [allTickets, debouncedSearch]);

  const openTickets = useMemo(
    () => filtered.filter((t) => isOpen(t.status)),
    [filtered]
  );
  const closedTickets = useMemo(
    () => filtered.filter((t) => !isOpen(t.status)),
    [filtered]
  );

  useEffect(() => {
    if (!(isLoading || isAuthenticated)) {
      setAuthDialogOpen(true);
    }
  }, [isLoading, isAuthenticated]);

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
    checkAuth();
  };

  const showSkeletons = isLoading || isLoadingTickets;

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      data-inbox-container
    >
      {/* Header */}
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

      {/* Table-like list: search + Open / Closed */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets"
              type="search"
              value={search}
            />
          </div>
          {showSkeletons && <TicketsListSkeleton />}
          {!showSkeletons && filtered.length === 0 && (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground text-sm">
                {translations?.no_tickets || "No tickets found"}
              </p>
            </div>
          )}
          {!showSkeletons && filtered.length > 0 && (
            <>
            {/* Open section */}
            {openTickets.length > 0 && (
              <section>
                <h3 className="mb-3 font-medium text-muted-foreground text-sm">
                  Open ({openTickets.length})
                </h3>
                <div className="overflow-hidden rounded-lg border bg-card">
                  <div className="grid grid-cols-[1fr_120px_100px] gap-4 border-b bg-muted/50 px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">
                    <span>Issue</span>
                    <span className="text-right">Status</span>
                    <span className="text-right">Created</span>
                  </div>
                  {openTickets.map((ticket) => (
                    <Link
                      className="grid grid-cols-[1fr_120px_100px] gap-4 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50"
                      href={`/help-center/tickets/${ticket.id}`}
                      key={ticket.id}
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-muted-foreground text-xs">
                          #{ticket.id.slice(-4)}
                        </span>{" "}
                        <span className="font-medium text-sm">
                          {ticket.title}
                        </span>
                      </div>
                      <span className="flex items-center justify-end">
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs capitalize">
                          <TicketStatusIcon status={ticket.status ?? "open"} />
                          {(ticket.status ?? "open").replace(/_/g, " ")}
                        </span>
                      </span>
                      <span className="flex items-center justify-end text-muted-foreground text-xs">
                        {formatRelativeTime(ticket.updated_at)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Closed section */}
            {closedTickets.length > 0 && (
              <section>
                <h3 className="mb-3 font-medium text-muted-foreground text-sm">
                  Closed ({closedTickets.length})
                </h3>
                <div className="overflow-hidden rounded-lg border bg-card">
                  <div className="grid grid-cols-[1fr_120px_100px] gap-4 border-b bg-muted/50 px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">
                    <span>Issue</span>
                    <span className="text-right">Status</span>
                    <span className="text-right">Created</span>
                  </div>
                  {closedTickets.map((ticket) => (
                    <Link
                      className="grid grid-cols-[1fr_120px_100px] gap-4 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50"
                      href={`/help-center/tickets/${ticket.id}`}
                      key={ticket.id}
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-muted-foreground text-xs">
                          #{ticket.id.slice(-4)}
                        </span>{" "}
                        <span className="text-muted-foreground text-sm">
                          {ticket.title}
                        </span>
                      </div>
                      <span className="flex items-center justify-end">
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs capitalize">
                          <TicketStatusIcon
                            status={ticket.status ?? "closed"}
                          />
                          {(ticket.status ?? "closed").replace(/_/g, " ")}
                        </span>
                      </span>
                      <span className="flex items-center justify-end text-muted-foreground text-xs">
                        {formatRelativeTime(ticket.updated_at)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            </>
          )}
        </div>
      </div>

      <CreateTicketDialog
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
      />

      <HelpCenterAuthDialog
        closable={false}
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleAuthSuccess}
        open={authDialogOpen}
      />
    </div>
  );
}
