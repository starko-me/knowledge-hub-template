import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticles, getSingleCategory } from "@/lib/help-center";
import { stripMarkdown } from "@/lib/text-utils";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  const [categoryData, articlesData] = await Promise.all([
    getSingleCategory(categoryId),
    getArticles({ categoryid: categoryId }),
  ]);

  if (!(categoryData.ok && categoryData.data)) {
    notFound();
  }

  const category = categoryData.data;
  const articles = articlesData?.data?.articles || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <div className="mx-auto mb-6 max-w-3xl">
          <h1 className="mb-4 text-balance font-medium text-2xl sm:text-4xl sm:leading-[1.15]">
            {category.name}
          </h1>
          {category.description && (
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Sub-categories Section */}
      {category.sub_categories && category.sub_categories.length > 0 && (
        <div className="mb-16">
          <h2 className="mb-6 font-semibold text-2xl">Sub-categories</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {category.sub_categories.map((subCategory) => (
              <Link
                className="group relative flex flex-col overflow-hidden rounded-md border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
                href={`/help-center/category/${categoryId}/subcategory/${subCategory.id}`}
                key={subCategory.id}
              >
                {subCategory.thumbnail_url ? (
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    {/* biome-ignore lint: external image URL from API, using regular img tag */}
                    <img
                      alt={subCategory.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      src={subCategory.thumbnail_url}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-primary/10 to-primary/5" />
                )}
                <div className="relative flex flex-1 flex-col p-6">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-xl leading-tight transition-colors group-hover:text-primary">
                      {subCategory.name}
                    </h3>
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  {subCategory.description && (
                    <p className="line-clamp-3 flex-1 text-muted-foreground text-sm leading-relaxed">
                      {subCategory.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Articles Section */}
      {articles.length > 0 && (
        <div className="mt-1.5 flex flex-col gap-8">
          <h2 className="font-semibold text-lg">Articles</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
            {articles.map((article) => (
              <Link
                className="flex cursor-pointer flex-col rounded-lg border border-neutral-200 p-4 transition-all duration-200 hover:shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)]"
                href={`/help-center/article/${article.id}`}
                key={article.id}
              >
                <div className="mb-2 shrink-0 text-neutral-400">
                  <div className="flex size-6 items-center justify-center">
                    <FileText className="h-full w-full" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
                  <h3 className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-neutral-900">
                    {article.title}
                  </h3>
                  {article.text_content && (
                    <div className="line-clamp-2 text-neutral-800 text-sm">
                      {stripMarkdown(article.text_content)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {category.sub_categories.length === 0 && articles.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            No content available in this category.
          </p>
        </div>
      )}
    </div>
  );
}
