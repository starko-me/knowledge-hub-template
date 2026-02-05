"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TicketPriorityIcon } from "@/components/ticket-priority-icon";
import { createTicket, getWorkspaceInfo } from "@/lib/help-center";
import { CLIENT_KEY } from "@/lib/help-center-config";
import { cn } from "@/lib/utils";
import { UploadDropzone } from "@/lib/utHelpers";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function ticketTranslations(data: unknown): Record<string, string> {
  const d = data as { data?: { translations?: { ticketPage?: Record<string, string> } } } | undefined;
  return d?.data?.translations?.ticketPage ?? {};
}

// biome-ignore lint: ticket form with upload, mutations, and translations
export function CreateTicketDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTicketDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("low");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [displayAttachments, setDisplayAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ] as const;

  const { data: workspaceData } = useQuery({
    queryKey: ["help-center-workspace"],
    queryFn: getWorkspaceInfo,
  });

  const t = ticketTranslations(workspaceData);

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      description: string;
      priority: string;
      attachments: string[];
    }) => {
      const token = localStorage.getItem("starko-token");
      if (!token) {
        throw new Error("Not authenticated");
      }
      return createTicket(
        CLIENT_KEY,
        token,
        payload.title,
        payload.description,
        payload.attachments,
        payload.priority
      );
    },
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setPriority("low");
      setAttachments([]);
      setDisplayAttachments([]);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["help-center-tickets"] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!(trimmedTitle && trimmedDescription)) {
      return;
    }
    createMutation.mutate({
      title: trimmedTitle,
      description: trimmedDescription,
      priority,
      attachments,
    });
  };

  const handleAttachmentRemove = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setDisplayAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadComplete = (fileIds: string[], fileNames: string[]) => {
    setIsUploading(false);
    setAttachments((prev) => [...prev, ...fileIds]);
    setDisplayAttachments((prev) => [...prev, ...fileNames]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!(next || createMutation.isPending)) {
      setTitle("");
      setDescription("");
      setPriority("low");
      setAttachments([]);
      setDisplayAttachments([]);
      createMutation.reset();
    }
    onOpenChange(next);
  };

  const token =
    typeof window !== "undefined" ? localStorage.getItem("starko-token") : null;
  const workspaceColor = workspaceData?.data?.color ?? "#1E1E71";

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title ?? "Report a Problem"}</DialogTitle>
          <DialogDescription>
            {t.sub_title ??
              "Describe your issue and we'll get back to you as soon as possible."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="ticket-title">{t.input_title ?? "Title"}</Label>
            <Input
              className="h-10"
              id="ticket-title"
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                t.input_placeholder ?? "Brief description of the issue"
              }
              required
              value={title}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-priority">
              {t.priority_title ?? "Priority"}
            </Label>
            <Select
              onValueChange={setPriority}
              value={priority}
            >
              <SelectTrigger className="h-10 w-full" id="ticket-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <TicketPriorityIcon priority={opt.value} />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">
              {t.description_title ?? "Description"}
            </Label>
            <Textarea
              className="resize-none"
              id="ticket-description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                t.description_placeholder ??
                "Please provide as much detail as possible..."
              }
              required
              rows={5}
              value={description}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {t.attachment_title ?? "Attachments"}
              {isUploading && (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              )}
            </Label>
            {displayAttachments.length > 0 ? (
              <UploadDropzone
                config={{ appendOnPaste: true, mode: "auto" }}
                content={{
                  button({ isUploading: uploading }: { isUploading: boolean }) {
                    return uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>Add more files</span>
                    );
                  },
                }}
                endpoint="clientUploader"
                headers={{
                  Authorization: `Bearer ${token ?? ""}`,
                  "x-starko-workspace-id": CLIENT_KEY,
                }}
                onBeforeUploadBegin={(files: File[]) => {
                  setIsUploading(true);
                  return files;
                }}
                onClientUploadComplete={(files: Array<{ name: string; serverData?: { file?: { id: string } } }>) => {
                  const ids = files
                    .map((f) => f.serverData?.file?.id ?? "")
                    .filter(Boolean);
                  const names = files.map((f) => f.name);
                  handleUploadComplete(ids, names);
                }}
                onUploadAborted={() => {
                  setIsUploading(false);
                }}
                appearance={{
                  allowedContent: "hidden",
                  button: ({ uploadProgress }: { uploadProgress: number }) =>
                    cn(
                      "flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm",
                      "cursor-pointer transition-colors hover:bg-accent disabled:opacity-50",
                      uploadProgress > 0 &&
                        "after:absolute after:inset-0 after:rounded-md after:bg-accent/50 after:content-['']"
                    ),
                  container: "p-0",
                  label: "hidden",
                }}
              />
            ) : (
              <div
                className="upload-dropzone-wrapper"
                style={{ "--upload-button-bg": workspaceColor } as React.CSSProperties}
              >
                <style>{`
                  .upload-dropzone-wrapper [data-ut-element="button"] {
                    background-color: var(--upload-button-bg) !important;
                  }
                  .upload-dropzone-wrapper [data-ut-element="button"]:hover {
                    opacity: 0.9;
                  }
                `}</style>
                <UploadDropzone
                  config={{ appendOnPaste: true, mode: "auto" }}
                  endpoint="clientUploader"
                  headers={{
                    Authorization: `Bearer ${token ?? ""}`,
                    "x-starko-workspace-id": CLIENT_KEY,
                  }}
                onBeforeUploadBegin={(files: File[]) => {
                  setIsUploading(true);
                  return files;
                }}
                onClientUploadComplete={(files: Array<{ name: string; serverData?: { file?: { id: string } } }>) => {
                  const ids = files
                    .map((f) => f.serverData?.file?.id ?? "")
                    .filter(Boolean);
                  const names = files.map((f) => f.name);
                  handleUploadComplete(ids, names);
                }}
                onUploadAborted={() => {
                  setIsUploading(false);
                }}
                appearance={{
                  allowedContent: "Supports images, documents, and videos up to 10MB",
                  button: ({ uploadProgress }: { uploadProgress: number }) => {
                    const base =
                      "flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border p-2 text-sm text-white transition-colors disabled:opacity-50";
                    const progress =
                      uploadProgress > 0
                        ? "after:absolute after:inset-0 after:rounded-md after:bg-black/20 after:content-['']"
                        : "";
                    return `${base} ${progress}`;
                  },
                    container:
                      "border-2 border-dashed rounded-md p-4 hover:bg-accent/50 transition-colors",
                    label: "text-sm text-muted-foreground",
                  }}
                />
              </div>
            )}
          </div>

          {displayAttachments.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm">
                Attached files ({displayAttachments.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {displayAttachments.map((name, index) => (
                  <div
                    className="flex max-w-full items-center gap-2 rounded-md border bg-secondary px-3 py-1.5"
                    key={attachments[index] ?? `att-${index}-${name}`}
                  >
                    <span className="truncate text-sm">{name}</span>
                    <button
                      aria-label={`Remove ${name}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      onClick={() => handleAttachmentRemove(index)}
                      type="button"
                    >
                      <Trash className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {createMutation.isSuccess && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-800 text-sm dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
              {t.success_text ??
                "Ticket submitted successfully! We'll get back to you soon."}
            </div>
          )}

          {createMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800 text-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              Failed to submit ticket. Please try again.
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              disabled={createMutation.isPending}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={
                createMutation.isPending ||
                isUploading ||
                title.trim() === "" ||
                description.trim() === ""
              }
              type="submit"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t.submiting_btn ?? "Submitting..."}
                </>
              ) : (
                (t.submit_btn ?? "Submit Ticket")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
