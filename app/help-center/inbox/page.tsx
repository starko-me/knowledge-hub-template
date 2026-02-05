"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Response } from "@/components/ai-elements/response";
import { HelpCenterAuthDialog } from "@/components/help-center-auth-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { formatDateString, formatTimeString } from "@/lib/date-utils";
import { getMessages, getWorkspaceInfo, sendMessage } from "@/lib/help-center";
import { CLIENT_KEY } from "@/lib/help-center-config";
import { useUserSession } from "@/lib/help-center-session";
import { supabase } from "@/lib/supabase";

interface MessageType {
  id: string;
  message: {
    id: string;
    threadId: string;
    content: string;
    timestamp: string;
    role: "client" | "assistant" | "user";
    blocks: unknown[];
  };
  user: {
    name: string;
    email: string | null;
    avatar: string;
  };
}

function MessageItem({
  message,
  prevMessage,
  workspaceLogo,
}: {
  message: MessageType;
  prevMessage: MessageType | null;
  workspaceLogo?: string | null;
}) {
  const isClientMessage = message.message.role === "client";
  const isAssistantMessage = message.message.role === "assistant";
  const isHumanAgentMessage = message.message.role === "user";

  const currentDate = new Date(message.message.timestamp).toDateString();
  const prevDate = prevMessage
    ? new Date(prevMessage.message.timestamp).toDateString()
    : null;
  const showDate = !prevMessage || currentDate !== prevDate;

  const getSenderIdentifier = (msg: MessageType) => {
    const role = msg.message.role;
    if (role === "assistant") {
      return "assistant";
    }
    if (role === "client") {
      return "client";
    }
    if (role === "user") {
      return `user-${msg.user?.email || msg.user?.name || msg.user?.avatar || "unknown"}`;
    }
    return role;
  };

  const shouldShowSenderMeta =
    !prevMessage ||
    getSenderIdentifier(prevMessage) !== getSenderIdentifier(message);

  return (
    <div>
      {showDate && (
        <div className="my-4 text-center">
          <span className="text-muted-foreground text-xs">
            {formatDateString(message.message.timestamp)}
          </span>
        </div>
      )}
      <div
        className={`flex w-full gap-2 ${
          isClientMessage ? "justify-end" : "justify-start"
        } ${shouldShowSenderMeta ? "mt-2" : "mt-0"}`}
      >
        <div
          className={`flex flex-col gap-2 overflow-hidden rounded-lg px-3 py-2 text-sm ${
            isClientMessage
              ? "bg-secondary text-primary-foreground"
              : "bg-transparent text-foreground"
          }`}
        >
          {/* Show avatar and name/email for AI and human agent messages */}
          {(isAssistantMessage || isHumanAgentMessage) &&
            shouldShowSenderMeta && (
              <div className="mb-1 flex items-center gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {(() => {
                    if (isAssistantMessage) {
                      if (workspaceLogo) {
                        return (
                          // biome-ignore lint: external image URL from API, using regular img tag
                          <img
                            alt="AI"
                            className="size-full object-contain"
                            src={workspaceLogo}
                          />
                        );
                      }
                      return (
                        <span className="text-muted-foreground text-xs">
                          AI
                        </span>
                      );
                    }
                    if (message.user?.avatar) {
                      return (
                        // biome-ignore lint: external image URL from API, using regular img tag
                        <img
                          alt={
                            message.user?.name || message.user?.email || "Agent"
                          }
                          className="size-full object-cover"
                          src={message.user.avatar}
                        />
                      );
                    }
                    const initial = (message.user?.name ||
                      message.user?.email ||
                      "A")[0];
                    return (
                      <span className="text-muted-foreground text-xs">
                        {initial.toUpperCase()}
                      </span>
                    );
                  })()}
                </div>
                <span className="text-muted-foreground text-xs">
                  {isAssistantMessage
                    ? "AI Assistant"
                    : message.user?.name || message.user?.email || "Agent"}
                </span>
              </div>
            )}
          <div className={isClientMessage ? "**:text-white" : ""}>
            <Response>{message.message.content}</Response>
          </div>
          {shouldShowSenderMeta ? null : (
            <span className="text-muted-foreground text-xs">
              {formatTimeString(message.message.timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const { isAuthenticated, isLoading, checkAuth, user } = useUserSession();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get workspace info for translations
  const { data: workspaceData } = useQuery({
    queryKey: ["help-center-workspace"],
    queryFn: getWorkspaceInfo,
  });

  const translations = workspaceData?.data?.translations?.navigation || {};
  const messagesPageTitle = translations.messages_page || "Messages";

  // Get messages
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["help-center-messages"],
    queryFn: async () => {
      const token = localStorage.getItem("starko-token");
      if (!token) {
        throw new Error("No token");
      }
      return getMessages(CLIENT_KEY, token);
    },
    enabled: isAuthenticated,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const messages: MessageType[] = messagesData?.data?.messages || [];
  const thread = messagesData?.data?.thread;
  const isLoadingResponse =
    messages.length > 0 &&
    messages.at(-1)?.message.role === "client" &&
    thread?.is_handled_by_ai === true;
  const prevMessagesLengthRef = useRef(0);

  // Real-time subscription for thread updates
  useEffect(() => {
    const token = localStorage.getItem("starko-token");
    if (!token) {
      return;
    }
    if (!user?.id) {
      return;
    }
    if (!isAuthenticated) {
      return;
    }

    const channel = supabase
      .channel("new-message")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "threads",
          filter: `clientId=eq.${user.id}`,
        },
        (payload: unknown) => {
          try {
            console.log("Thread update received:", payload);
            queryClient.invalidateQueries({
              queryKey: ["help-center-messages"],
            });
          } catch (error) {
            console.error("Error handling thread update:", error);
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Unsubscribing from channel");
      channel.unsubscribe();
    };
  }, [user?.id, isAuthenticated, queryClient]);

  // Auto-scroll to bottom when messages change or loading indicator appears
  useEffect(() => {
    if (
      messages.length !== prevMessagesLengthRef.current ||
      isLoadingResponse
    ) {
      prevMessagesLengthRef.current = messages.length;
      const timeoutId = setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  });

  useEffect(() => {
    if (!(isLoading || isAuthenticated)) {
      setAuthDialogOpen(true);
    }
  }, [isAuthenticated, isLoading]);

  const handleAuthSuccess = async () => {
    await checkAuth();
    setAuthDialogOpen(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending) {
      return;
    }

    const token = localStorage.getItem("starko-token");
    if (!token) {
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(CLIENT_KEY, token, messageText, []);
      setMessageText("");
      // Refetch messages
      await queryClient.invalidateQueries({
        queryKey: ["help-center-messages"],
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="mb-2 font-bold text-2xl">{messagesPageTitle}</h1>
            <p className="text-muted-foreground text-sm">
              Please sign in to access your messages.
            </p>
          </div>
        </div>
        <HelpCenterAuthDialog
          closable={false}
          onOpenChange={setAuthDialogOpen}
          onSuccess={handleAuthSuccess}
          open={authDialogOpen}
        />
      </>
    );
  }

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      data-inbox-container
    >
      <div className="hidden shrink-0 border-b bg-background px-4 py-3 lg:block">
        <h1 className="font-semibold text-lg">{messagesPageTitle}</h1>
      </div>
      <ScrollArea className="min-h-0 flex-1 overflow-hidden px-4">
        <div className="mx-auto max-w-3xl py-4">
          {isLoadingMessages && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">
                Loading messages...
              </div>
            </div>
          )}
          {!isLoadingMessages && messages.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  No messages yet.
                </p>
                <p className="mt-2 text-muted-foreground text-sm">
                  Start a conversation by sending a message below.
                </p>
              </div>
            </div>
          )}
          {!isLoadingMessages && messages.length > 0 && (
            <div className="space-y-0">
              {messages.map((message: MessageType, index: number) => {
                const prevMessage = index > 0 ? messages[index - 1] : null;
                return (
                  <MessageItem
                    key={message.message.id || message.id || index}
                    message={message}
                    prevMessage={prevMessage}
                    workspaceLogo={workspaceData?.data?.logo}
                  />
                );
              })}
              {/* Loading indicator */}
              {isLoadingResponse && (
                <div className="flex w-full justify-start gap-2 py-4">
                  <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {workspaceData?.data?.logo ? (
                      // biome-ignore lint: external image URL from API, using regular img tag
                      <img
                        alt={workspaceData.data.name || "AI"}
                        className="size-full object-cover"
                        src={workspaceData.data.logo}
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">AI</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 overflow-hidden rounded-lg bg-secondary px-4 py-3 text-foreground text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex items-end gap-1">
                        {[0, 1, 2].map((dot) => (
                          <span
                            className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                            key={dot}
                            style={{ animationDelay: `${dot * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t bg-background px-4 py-4">
        <form className="mx-auto max-w-3xl" onSubmit={handleSendMessage}>
          <div className="relative flex gap-2">
            <Textarea
              className="min-h-[60px] flex-1 resize-none md:min-h-[100px] md:text-sm"
              disabled={isSending || isLoadingResponse}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isLoadingResponse) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={
                isLoadingResponse
                  ? "AI is generating a response..."
                  : "Type your message..."
              }
              value={messageText}
            />
            <Button
              className="absolute right-2 bottom-2"
              disabled={isSending || isLoadingResponse || !messageText.trim()}
              type="submit"
            >
              <Send className="h-4 w-4 md:h-6 md:w-6" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
