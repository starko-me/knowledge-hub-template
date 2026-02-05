"use client";

import { useState } from "react";
import { submitArticleFeedback } from "@/lib/help-center";

type FeedbackValue = "negative" | "neutral" | "positive" | null;

export function ArticleFeedback({ articleId }: { articleId: string }) {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackValue>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (value: FeedbackValue) => {
    if (selectedFeedback || !value) {
      console.log("Already submitted");
      return;
    }

    setSelectedFeedback(value);
    setSubmitted(true);

    // Send feedback to API
    try {
      await submitArticleFeedback(articleId, value);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  if (submitted) {
    return (
      <div className="mt-12 w-full rounded-md border bg-muted/30 px-6 py-4 text-center">
        <p className="text-muted-foreground text-sm">
          Thank you for your feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12 w-full rounded-md border bg-muted/30 px-6 py-4">
      <p className="mb-4 text-center font-medium text-foreground">
        Did this answer your question?
      </p>
      <div className="flex items-center justify-center gap-4">
        <button
          className="flex size-10 items-center justify-center rounded-md text-2xl transition-transform hover:scale-110 active:scale-95"
          onClick={() => handleFeedback("negative")}
          type="button"
        >
          😡
        </button>
        <button
          className="flex size-10 items-center justify-center rounded-md text-2xl transition-transform hover:scale-110 active:scale-95"
          onClick={() => handleFeedback("neutral")}
          type="button"
        >
          😐
        </button>
        <button
          className="flex size-10 items-center justify-center rounded-md text-2xl transition-transform hover:scale-110 active:scale-95"
          onClick={() => handleFeedback("positive")}
          type="button"
        >
          😃
        </button>
      </div>
    </div>
  );
}
