"use client";

import { useEffect, useRef } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export function Response({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    // Wait a bit for Streamdown to render
    const timeoutId = setTimeout(() => {
      // Process headings
      const headings = contentRef.current?.querySelectorAll(
        "h1, h2, h3, h4, h5, h6"
      );
      if (headings) {
        for (const [index, heading] of Array.from(headings).entries()) {
          if (!heading.id) {
            const text = heading.textContent || "";
            const slug = generateSlug(text);
            const finalId = slug || `heading-${index}`;
            heading.id = finalId;
            heading.setAttribute("id", finalId);
          }
          // Add scroll-margin-top for smooth scrolling with offset
          (heading as HTMLElement).style.scrollMarginTop = "120px";
        }
      }

      // Rewrite links to remove workspace ID and use relative paths
      const links = contentRef.current?.querySelectorAll("a[href]");
      if (links) {
        for (const link of Array.from(links)) {
          const href = link.getAttribute("href");
          if (!href) {
            continue;
          }

          // Pattern: https://v2.starko.one/help-center/{workspaceId}/article/{articleId}

          const articleMatch = href.match(
            /https?:\/\/v2\.starko\.one\/help-center\/[^/]+\/article\/([^/?]+)/
          );
          if (articleMatch) {
            const articleId = articleMatch[1];
            link.setAttribute("href", `/help-center/article/${articleId}`);
            continue;
          }

          // Pattern: https://v2.starko.one/help-center/{workspaceId}/category/{categoryId}
          const categoryMatch = href.match(
            /https?:\/\/v2\.starko\.one\/help-center\/[^/]+\/category\/([^/?]+)/
          );
          if (categoryMatch) {
            const categoryId = categoryMatch[1];
            link.setAttribute("href", `/help-center/category/${categoryId}`);
            continue;
          }

          // Pattern: https://v2.starko.one/help-center/{workspaceId}/category/{categoryId}/subcategory/{subCategoryId}
          const subCategoryMatch = href.match(
            /https?:\/\/v2\.starko\.one\/help-center\/[^/]+\/category\/([^/]+)\/subcategory\/([^/?]+)/
          );
          if (subCategoryMatch) {
            const categoryId = subCategoryMatch[1];
            const subCategoryId = subCategoryMatch[2];
            link.setAttribute(
              "href",
              `/help-center/category/${categoryId}/subcategory/${subCategoryId}`
            );
            continue;
          }

          // Pattern: https://v2.starko.one/help-center/{workspaceId} (home page)
          const homeMatch = href.match(
            /https?:\/\/v2\.starko\.one\/help-center\/[^/]+(?:\/)?$/
          );
          if (homeMatch) {
            link.setAttribute("href", "/help-center");
          }
        }
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:text-foreground",
        "prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-xl",
        "prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-lg",
        "prose-p:mb-2 prose-p:text-muted-foreground prose-p:leading-relaxed",
        "prose-strong:font-semibold prose-strong:text-foreground",
        "prose-ul:my-3 prose-ul:space-y-2",
        "prose-li:text-muted-foreground",
        "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground",
        "prose-pre:border prose-pre:border-border prose-pre:bg-muted",
        "p-0",
        className
      )}
      ref={contentRef}
    >
      <Streamdown>{children}</Streamdown>
    </div>
  );
}
