"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  getArticles,
  getCategories,
  getSingleCategory,
} from "@/lib/help-center";

export function HelpCenterSearch() {
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);

  const { data: categories } = useQuery({
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

  // Preload articles for all sub-categories
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

  // Collect all articles for search
  const allArticles = useMemo(() => {
    const articles: Array<{
      id: string;
      title: string;
      categoryName: string;
      categoryId: string;
    }> = [];
    for (const [categoryId, categoryArticles] of articlesMap.entries()) {
      const category = categories?.data.find((c) => c.id === categoryId);
      for (const article of categoryArticles) {
        articles.push({
          id: article.id,
          title: article.title,
          categoryName: category?.name || "",
          categoryId,
        });
      }
    }
    for (const [key, subCategoryArticles] of subCategoryArticlesMap.entries()) {
      const [categoryId] = key.split("-");
      const category = categories?.data.find((c) => c.id === categoryId);
      for (const article of subCategoryArticles) {
        articles.push({
          id: article.id,
          title: article.title,
          categoryName: category?.name || "",
          categoryId,
        });
      }
    }
    return articles;
  }, [articlesMap, subCategoryArticlesMap, categories]);

  // Keyboard shortcut for command menu
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      {/* Search Bar */}
      <button
        className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-muted-foreground text-sm transition-colors hover:bg-muted"
        onClick={() => setCommandOpen(true)}
        type="button"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1">Search articles...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog modal onOpenChange={setCommandOpen} open={commandOpen}>
        <CommandInput placeholder="Search articles..." />
        <CommandList>
          <CommandEmpty>No articles found.</CommandEmpty>
          {categories?.data.map((category) => {
            const categoryArticles = allArticles.filter(
              (article) => article.categoryId === category.id
            );
            if (categoryArticles.length === 0) {
              return null;
            }

            return (
              <CommandGroup heading={category.name} key={category.id}>
                {categoryArticles.map((article) => {
                  const handleSelect = () => {
                    router.push(`/help-center/article/${article.id}`);
                    setCommandOpen(false);
                  };
                  return (
                    <CommandItem
                      key={article.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect();
                      }}
                      onSelect={handleSelect}
                      value={article.title}
                    >
                      {article.title}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
