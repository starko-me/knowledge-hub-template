"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function ArticleToc() {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingsRef = useRef<Element[]>([]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 50; // Try for up to 5 seconds (50 * 100ms)

    const generateSlug = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    };

    const processHeadingsList = (headings: Element[]): TocItem[] => {
      const items: TocItem[] = [];
      for (const heading of headings) {
        const text = heading.textContent || "";
        const level = Number.parseInt(heading.tagName.charAt(1), 10);

        // Use the ID that was set by the Response component
        // Fallback to generating one if somehow missing
        const finalId =
          heading.id || generateSlug(text) || `heading-${items.length}`;

        items.push({ id: finalId, text, level });
      }
      return items;
    };

    const setupObserver = (headings: Element[]) => {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          }
        },
        {
          rootMargin: "-100px 0px -66%",
          threshold: 0,
        }
      );

      observerRef.current = observer;

      // Also observe the title
      const titleElement = document.getElementById("article-title");
      if (titleElement) {
        observer.observe(titleElement);
      }

      for (const heading of headings) {
        observer.observe(heading);
      }
    };

    const ensureHeadingIds = (headings: Element[]) => {
      for (const heading of headings) {
        if (!heading.id) {
          const text = heading.textContent || "";
          const slug = generateSlug(text);
          const index = headings.indexOf(heading);
          heading.id = slug || `heading-${index}`;
          heading.setAttribute("id", heading.id);
        }
      }
    };

    const processHeadings = () => {
      const contentElement = document.querySelector("[data-article-content]");
      if (!contentElement) {
        retryCount++;
        if (retryCount < maxRetries) {
          timeoutId = setTimeout(processHeadings, 100);
        }
        return;
      }

      const headings = Array.from(
        contentElement.querySelectorAll("h2, h3, h4")
      );

      if (headings.length === 0) {
        retryCount++;
        if (retryCount < maxRetries) {
          timeoutId = setTimeout(processHeadings, 100);
        }
        return;
      }

      ensureHeadingIds(headings);
      headingsRef.current = headings;
      const items = processHeadingsList(headings);
      setTocItems(items);
      setupObserver(headings);
    };

    // Start processing immediately and retry if needed
    processHeadings();

    // Also use MutationObserver to watch for when headings are added
    const contentElement = document.querySelector("[data-article-content]");
    if (contentElement) {
      const mutationObserver = new MutationObserver(() => {
        // Reset retry count when mutations occur
        retryCount = 0;
        processHeadings();
      });

      mutationObserver.observe(contentElement, {
        childList: true,
        subtree: true,
      });

      return () => {
        clearTimeout(timeoutId);
        mutationObserver.disconnect();
        if (observerRef.current) {
          for (const heading of headingsRef.current) {
            observerRef.current.unobserve(heading);
          }
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      };
    }

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        for (const heading of headingsRef.current) {
          observerRef.current.unobserve(heading);
        }
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const scrollToElement = (id: string) => {
    // Try multiple ways to find the element
    let element = document.getElementById(id);

    if (!element) {
      // Try to find it in the article content
      const contentElement = document.querySelector("[data-article-content]");
      element = (contentElement?.querySelector(`#${id}`) ||
        contentElement?.querySelector(`[id="${id}"]`)) as HTMLElement;
    }

    if (!element) {
      console.log(`Element with id "${id}" not found`);
      return;
    }

    // Update URL hash
    window.history.replaceState(null, "", `#${id}`);

    // Use scrollIntoView which works with any scroll container
    // scroll-margin-top is already set by the Response component
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollToTitle = () => {
    scrollToElement("article-title");
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop TOC */}
      <div className="sticky top-24 hidden lg:block">
        <nav className="flex flex-col">
          <button
            className={cn(
              "group relative flex items-start gap-3 py-2 pl-5 text-left transition-colors",
              "hover:text-foreground",
              activeId === "article-title" || activeId === ""
                ? "text-foreground"
                : "text-muted-foreground"
            )}
            onClick={scrollToTitle}
            type="button"
          >
            {/* Active indicator line */}
            <div
              className={cn(
                "absolute top-0 left-0 h-full w-0.5 transition-opacity",
                activeId === "article-title" || activeId === ""
                  ? "bg-primary opacity-100"
                  : "bg-transparent opacity-0"
              )}
            />
            {/* Text content */}
            <span className="font-medium text-sm">Title</span>
          </button>
          {tocItems.map((item) => (
            <button
              className={cn(
                "group relative flex items-start gap-3 py-2 pl-5 text-left transition-colors",
                "hover:text-foreground",
                activeId === item.id
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
              key={item.id}
              onClick={() => scrollToElement(item.id)}
              type="button"
            >
              {/* Active indicator line */}
              <div
                className={cn(
                  "absolute top-0 left-0 h-full w-0.5 transition-opacity",
                  activeId === item.id
                    ? "bg-primary opacity-100"
                    : "bg-transparent opacity-0"
                )}
              />
              {/* Text content */}
              <span
                className={cn(
                  "text-sm",
                  item.level === 2 && "font-medium",
                  item.level === 3 && "ml-4",
                  item.level === 4 && "ml-8 text-xs"
                )}
              >
                {item.text}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile TOC Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="fixed right-4 bottom-4 z-50 flex items-center justify-center rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 lg:hidden"
            type="button"
          >
            <span className="font-medium text-sm">Contents</span>
          </button>
        </SheetTrigger>
        <SheetContent className="w-[min(350px,85vw)] p-0" side="right">
          <div className="border-b p-4">
            <h3 className="font-semibold text-sm">Table of Contents</h3>
          </div>
          <ScrollArea className="h-[calc(100vh-80px)] p-4">
            <nav className="flex flex-col">
              <button
                className={cn(
                  "group relative flex items-start gap-3 py-2 pl-5 text-left transition-colors",
                  "hover:text-foreground",
                  activeId === "article-title" || activeId === ""
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                onClick={scrollToTitle}
                type="button"
              >
                <div
                  className={cn(
                    "absolute top-0 left-0 h-full w-0.5 transition-opacity",
                    activeId === "article-title" || activeId === ""
                      ? "bg-primary opacity-100"
                      : "bg-transparent opacity-0"
                  )}
                />
                <span className="font-medium text-sm">Title</span>
              </button>
              {tocItems.map((item) => (
                <button
                  className={cn(
                    "group relative flex items-start gap-3 py-2 pl-5 text-left transition-colors",
                    "hover:text-foreground",
                    activeId === item.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                  key={item.id}
                  onClick={() => scrollToElement(item.id)}
                  type="button"
                >
                  <div
                    className={cn(
                      "absolute top-0 left-0 h-full w-0.5 transition-opacity",
                      activeId === item.id
                        ? "bg-primary opacity-100"
                        : "bg-transparent opacity-0"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      item.level === 2 && "font-medium",
                      item.level === 3 && "ml-4",
                      item.level === 4 && "ml-8 text-xs"
                    )}
                  >
                    {item.text}
                  </span>
                </button>
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
