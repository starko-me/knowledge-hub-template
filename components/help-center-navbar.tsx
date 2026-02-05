"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  getArticles,
  getCategories,
  getSingleCategory,
  getWorkspaceInfo,
} from "@/lib/help-center";
import { useUserSession } from "@/lib/help-center-session";
import { cn } from "@/lib/utils";

const NAME_WORDS_SEP = /\s+/;

function SidebarUserBlock() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useUserSession();

  const showUser = isAuthenticated && user;
  if (!showUser) {
    return null;
  }

  const name: string = user.name ?? user.email ?? "User";
  const email: string = user.email ?? "";
  const avatarUrl: string =
    [user.image, user.avatar, user.picture].find(
      (v): v is string => typeof v === "string" && v.length > 0
    ) ?? "";
  const initials = name
    .split(NAME_WORDS_SEP)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("starko-token");
    }
    checkAuth();
    router.push("/help-center");
  };

  return (
    <div className="shrink-0 bg-sidebar p-2" data-sidebar="header">
      <ul className="flex w-full min-w-0 flex-col gap-1" data-sidebar="menu">
        <li
          className="group/menu-item relative flex items-center gap-2 text-xs"
          data-sidebar="menu-item"
        >
          <div
            className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-md p-2 text-left"
            data-sidebar="menu-button"
          >
            <Avatar className="size-8 shrink-0">
              {avatarUrl && <AvatarImage alt={name} src={avatarUrl} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-xs leading-tight">
              <span className="truncate font-semibold">{name}</span>
              {email && (
                <span className="truncate text-[11px] text-muted-foreground">
                  {email}
                </span>
              )}
            </div>
          </div>
          <Button
            aria-label="Log out"
            className="size-8 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleLogout}
            size="icon"
            variant="ghost"
          >
            <LogOut className="size-4" />
          </Button>
        </li>
      </ul>
    </div>
  );
}

function NavbarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [expandedSubCategories, setExpandedSubCategories] = useState<
    Set<string>
  >(new Set());

  const { data: workspaceInfo } = useQuery({
    queryKey: ["help-center-workspace"],
    queryFn: () => getWorkspaceInfo(),
  });

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["help-center-categories"],
    queryFn: () => getCategories(),
  });

  // Preload all category details
  const categoryQueries = useQueries({
    queries:
      categories?.data.map((category) => ({
        queryKey: ["help-center-single-category", category.id],
        queryFn: () => getSingleCategory(category.id),
        enabled: !!categories?.data.length,
      })) || [],
  });

  // Preload all articles for all categories
  const articleQueries = useQueries({
    queries:
      categories?.data.map((category) => ({
        queryKey: ["help-center-articles", category.id],
        queryFn: () => getArticles({ categoryid: category.id }),
        enabled: !!categories?.data.length,
      })) || [],
  });

  // Create a map of category data for easy access
  const categoryDataMap = useMemo(() => {
    const map = new Map();
    categoryQueries.forEach((query, index) => {
      if (query.data?.data && categories?.data[index]) {
        map.set(categories.data[index].id, query.data.data);
      }
    });
    return map;
  }, [categoryQueries, categories]);

  // Create a map of articles for easy access by category
  const articlesMap = useMemo(() => {
    const map = new Map();
    articleQueries.forEach((query, index) => {
      if (query.data?.data.articles && categories?.data[index]) {
        map.set(categories.data[index].id, query.data.data.articles);
      }
    });
    return map;
  }, [articleQueries, categories]);

  // Preload articles for all sub-categories (after we have category data)
  const subCategoryArticleQueries = useQueries({
    queries:
      categories?.data.flatMap((category, categoryIndex) => {
        const categoryQuery = categoryQueries[categoryIndex];
        const categoryData = categoryQuery?.data?.data;
        return (
          categoryData?.sub_categories.map(
            (subCategory: { id: string; name: string }) => ({
              queryKey: ["help-center-articles", category.id, subCategory.id],
              queryFn: () =>
                getArticles({
                  categoryid: category.id,
                  sub_category: subCategory.id,
                }),
              enabled: !!categories?.data.length && !!categoryData,
            })
          ) || []
        );
      }) || [],
  });

  // Create a map of articles by sub-category
  const subCategoryArticlesMap = useMemo(() => {
    const map = new Map();
    let queryIndex = 0;
    for (const category of categories?.data || []) {
      const categoryData = categoryDataMap.get(category.id);
      for (const subCategory of categoryData?.sub_categories || []) {
        const query = subCategoryArticleQueries[queryIndex];
        if (query?.data?.data.articles) {
          map.set(`${category.id}-${subCategory.id}`, query.data.data.articles);
        }
        queryIndex++;
      }
    }
    return map;
  }, [subCategoryArticleQueries, categories, categoryDataMap]);

  const isLoading =
    isCategoriesLoading ||
    categoryQueries.some((q) => q.isLoading) ||
    articleQueries.some((q) => q.isLoading) ||
    subCategoryArticleQueries.some((q) => q.isLoading);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleSubCategory = (categoryId: string, subCategoryId: string) => {
    const key = `${categoryId}-${subCategoryId}`;
    setExpandedSubCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div
        className="hidden lg:flex lg:h-screen lg:flex-col lg:border-r lg:bg-sidebar lg:p-4"
        style={{ width: "min(350px, 30vw)" }}
      >
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  const isHomeActive = pathname === "/help-center";

  const navContent = (
    <nav className="flex flex-col gap-1">
      {/* Welcome Message */}
      {workspaceInfo?.data && (
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-2">
            {workspaceInfo.data.logo && (
              // biome-ignore lint: external image URL from API, using regular img tag
              <img
                alt={workspaceInfo.data.name || "Workspace logo"}
                className="h-6 w-auto"
                height={32}
                src={workspaceInfo.data.logo}
                width={120}
              />
            )}
            <div className="flex flex-col">
              <span className="text-balance text-base">
                {workspaceInfo.data.name}
              </span>
            </div>
          </div>
          <span className="text-muted-foreground text-sm">
            {workspaceInfo.data.greeting_message}
          </span>
        </div>
      )}

      {/* Home Link */}
      <div className="z-10 bg-sidebar">
        <Link
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 font-medium text-sm transition-colors hover:bg-muted",
            isHomeActive
              ? "bg-primary/10 text-primary"
              : "text-foreground hover:text-foreground"
          )}
          href="/help-center"
          onClick={onLinkClick}
        >
          <Home className="h-4 w-4 shrink-0" />
          <span>Home</span>
        </Link>
      </div>
      <div className="z-10 bg-sidebar">
        <Link
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 font-medium text-sm transition-colors hover:bg-muted",
            pathname.includes("/help-center/inbox")
              ? "bg-primary/10 text-primary"
              : "text-foreground hover:text-foreground"
          )}
          href="/help-center/inbox"
          onClick={onLinkClick}
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span>Inbox</span>
        </Link>
      </div>
      <div className="z-10 bg-sidebar">
        <Link
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 font-medium text-sm transition-colors hover:bg-muted",
            pathname.includes("/help-center/tickets")
              ? "bg-primary/10 text-primary"
              : "text-foreground hover:text-foreground"
          )}
          href="/help-center/tickets"
          onClick={onLinkClick}
        >
          <Ticket className="h-4 w-4 shrink-0" />
          <span>Tickets</span>
        </Link>
      </div>

      <div className="border-border border-t" />

      {/* Categories */}
      {categories?.data.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const categoryData = categoryDataMap.get(category.id);
        const categoryArticles = articlesMap.get(category.id) || [];
        const subCategories = categoryData?.sub_categories || [];

        return (
          <div className="flex flex-col" key={category.id}>
            {/* Category Header */}
            <div className="sticky top-0 z-10 bg-sidebar">
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium text-sm transition-colors hover:bg-muted"
                onClick={() => toggleCategory(category.id)}
                type="button"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" />
                )}
                <span className="flex-1 text-xs">{category.name}</span>
              </button>
            </div>

            {/* Expanded Content */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="mt-1 ml-6 flex flex-col gap-2">
                {/* Sub-categories */}
                {subCategories.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {subCategories.map(
                      (subCategory: { id: string; name: string }) => {
                        const subCategoryKey = `${category.id}-${subCategory.id}`;
                        const isSubCategoryExpanded =
                          expandedSubCategories.has(subCategoryKey);
                        // Check if any article in this sub-category is active
                        const subCategoryArticles =
                          subCategoryArticlesMap.get(subCategoryKey) || [];
                        const isSubCategoryActive = subCategoryArticles.some(
                          (article: { id: string }) =>
                            pathname === `/help-center/article/${article.id}`
                        );

                        return (
                          <div className="flex flex-col" key={subCategory.id}>
                            {/* Sub-category Header */}
                            <button
                              className={cn(
                                "flex items-center gap-1 rounded-md px-2 py-1 text-left font-medium text-xs transition-colors hover:bg-muted",
                                isSubCategoryActive
                                  ? "bg-primary/10 text-primary"
                                  : "text-foreground hover:text-foreground"
                              )}
                              onClick={() =>
                                toggleSubCategory(category.id, subCategory.id)
                              }
                              type="button"
                            >
                              {isSubCategoryExpanded ? (
                                <ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200" />
                              ) : (
                                <ChevronRight className="h-3 w-3 shrink-0 transition-transform duration-200" />
                              )}
                              <span className="flex-1">{subCategory.name}</span>
                            </button>

                            {/* Sub-category Articles */}
                            {subCategoryArticles.length > 0 && (
                              <div
                                className={cn(
                                  "overflow-hidden transition-all duration-300 ease-in-out",
                                  isSubCategoryExpanded
                                    ? "max-h-none opacity-100"
                                    : "max-h-0 opacity-0"
                                )}
                              >
                                <div className="mt-0.5 ml-4 flex flex-col gap-0.5">
                                  {subCategoryArticles.map(
                                    (article: {
                                      id: string;
                                      title: string;
                                    }) => {
                                      const articlePath = `/help-center/article/${article.id}`;
                                      const isArticleActive =
                                        pathname === articlePath;
                                      return (
                                        <Link
                                          className={cn(
                                            "rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted",
                                            isArticleActive
                                              ? "bg-primary/10 font-medium text-primary"
                                              : "text-foreground/80 hover:text-foreground"
                                          )}
                                          href={articlePath}
                                          key={article.id}
                                          onClick={onLinkClick}
                                        >
                                          {article.title}
                                        </Link>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                {/* Articles without sub-category */}
                {(() => {
                  // Get all articles that belong to sub-categories
                  const subCategoryArticleIds = new Set<string>();
                  for (const subCategory of subCategories) {
                    const subCategoryKey = `${category.id}-${subCategory.id}`;
                    const articles =
                      subCategoryArticlesMap.get(subCategoryKey) || [];
                    for (const article of articles) {
                      subCategoryArticleIds.add(article.id);
                    }
                  }

                  // Filter out articles that belong to sub-categories
                  const articlesWithoutSubCategory = categoryArticles.filter(
                    (article: { id: string }) =>
                      !subCategoryArticleIds.has(article.id)
                  );

                  if (articlesWithoutSubCategory.length === 0) {
                    return null;
                  }

                  return (
                    <div className="flex flex-col gap-0.5">
                      {articlesWithoutSubCategory.map(
                        (article: { id: string; title: string }) => {
                          const articlePath = `/help-center/article/${article.id}`;
                          const isArticleActive = pathname === articlePath;
                          return (
                            <Link
                              className={cn(
                                "rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted",
                                isArticleActive
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "text-foreground/80 hover:text-foreground"
                              )}
                              href={articlePath}
                              key={article.id}
                              onClick={onLinkClick}
                            >
                              {article.title}
                            </Link>
                          );
                        }
                      )}
                    </div>
                  );
                })()}

                {/* Empty state */}
                {subCategories.length === 0 &&
                  categoryArticles.length === 0 && (
                    <div className="text-muted-foreground text-xs">
                      {category.description || "No content available"}
                    </div>
                  )}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );

  return navContent;
}

export function HelpCenterNavbar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className="hidden lg:flex lg:h-screen lg:flex-col lg:border-r lg:bg-sidebar"
        style={{ width: "min(350px, 30vw)" }}
      >
        <ScrollArea className="max-h-[calc(100vh-55px)] flex-1 p-4">
          <NavbarContent />
        </ScrollArea>
        {/* Logged-in user - above footer */}
        <SidebarUserBlock />
        {/* Made with Starko - Sticky Footer */}
        <div className="shrink-0 border-border border-t bg-sidebar p-4">
          <Link
            className="flex items-center justify-center rounded-md px-2 py-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
            href="https://starko.one"
            rel="noopener noreferrer"
            target="_blank"
          >
            Made with starko.one
          </Link>
        </div>
      </div>
    </>
  );
}

export function MobileMenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <button
          className="flex items-center justify-center rounded-md p-2 transition-colors hover:bg-muted"
          type="button"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </button>
      </SheetTrigger>
      <SheetContent
        className="flex h-full w-[min(350px,85vw)] flex-col p-0"
        side="left"
      >
        <ScrollArea className="flex-1 p-4">
          <NavbarContent onLinkClick={() => setOpen(false)} />
        </ScrollArea>
        {/* Logged-in user - above footer */}
        <SidebarUserBlock />
        {/* Made with Starko - Sticky Footer */}
        <div className="shrink-0 border-border border-t bg-sidebar p-4">
          <Link
            className="flex items-center justify-center rounded-md px-2 py-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
            href="https://starko.one"
            onClick={() => setOpen(false)}
            rel="noopener noreferrer"
            target="_blank"
          >
            Made with starko.one
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
