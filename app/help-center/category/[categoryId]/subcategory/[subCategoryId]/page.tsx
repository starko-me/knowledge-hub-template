import { FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticles, getSingleCategory } from "@/lib/help-center";
import { stripMarkdown } from "@/lib/text-utils";

export default async function SubCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string; subCategoryId: string }>;
}) {
  const { categoryId, subCategoryId } = await params;

  const [categoryData, articlesData] = await Promise.all([
    getSingleCategory(categoryId),
    getArticles({ categoryid: categoryId, sub_category: subCategoryId }),
  ]);

  if (!(categoryData.ok && categoryData.data)) {
    notFound();
  }

  const subCategory = categoryData.data.sub_categories.find(
    (sub) => sub.id === subCategoryId
  );

  if (!subCategory) {
    notFound();
  }

  const articles = articlesData?.data?.articles || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <div className="mx-auto mb-6 max-w-3xl">
          <h1 className="mb-4 text-balance font-medium text-2xl sm:text-4xl sm:leading-[1.15]">
            {subCategory.name}
          </h1>
          {subCategory.description && (
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {subCategory.description}
            </p>
          )}
        </div>
      </div>

      {/* Articles Section */}
      {articles.length > 0 ? (
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
      ) : (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            No articles available in this sub-category.
          </p>
        </div>
      )}
    </div>
  );
}
