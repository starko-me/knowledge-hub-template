import Image from "next/image";
import { notFound } from "next/navigation";
import { Response } from "@/components/ai-elements/response";
import { ArticleFeedback } from "@/components/article-feedback";
import { ArticleToc } from "@/components/article-toc";
import { getSingleArticle } from "@/lib/help-center";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleData = await getSingleArticle(id);

  if (!(articleData.ok && articleData.data)) {
    notFound();
  }

  const article = articleData.data;

  return (
    <div className="px-2 py-4 sm:px-4 sm:py-8">
      <div className="container mx-auto flex flex-col gap-4 lg:flex-row lg:gap-8">
        <article className="prose prose-slate dark:prose-invert max-w-[736px] flex-1">
          {article.thumbnail && (
            <Image
              alt={article.title}
              className="mb-8 rounded-lg"
              height={100}
              src={article.thumbnail}
              width={100}
            />
          )}
          <h1 className="mb-4 font-bold text-4xl" id="article-title">
            {article.title}
          </h1>
          {(article.author_name || article.created_at) && (
            <div className="mb-8 flex items-center gap-4 text-muted-foreground text-sm">
              {article.author_name && (
                <div className="flex items-center gap-2">
                  {article.author_image && (
                    <Image
                      alt={article.author_name}
                      className="h-6 w-6 rounded-full"
                      src={article.author_image}
                    />
                  )}
                  <span>{article.author_name}</span>
                </div>
              )}
              {article.created_at && (
                <time dateTime={article.created_at}>
                  {new Date(article.created_at).toLocaleDateString()}
                </time>
              )}
            </div>
          )}
          <div data-article-content>
            <Response className="max-w-4xl">{article.content}</Response>
          </div>
          <ArticleFeedback articleId={id} />
        </article>
        <aside className="w-full shrink-0 lg:w-64">
          <ArticleToc />
        </aside>
      </div>
    </div>
  );
}
