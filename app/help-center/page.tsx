import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getCategories, getWorkspaceInfo } from "@/lib/help-center";
import { HelpCenterSearch } from "@/components/help-center-search";

export default async function HelpCenterPage() {
  const [categoriesData, workspaceInfo] = await Promise.all([
    getCategories(),
    getWorkspaceInfo(),
  ]);

  if (!(categoriesData.ok && categoriesData.data)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 font-bold text-4xl">Help Center</h1>
          <p className="text-muted-foreground">No categories available.</p>
        </div>
      </div>
    );
  }

  const categories = categoriesData.data;
  const workspace =
    workspaceInfo.ok && workspaceInfo.data ? workspaceInfo.data : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <div className="mx-auto mb-6 max-w-3xl">
          <h1 className="mb-4 text-balance font-medium text-2xl sm:text-4xl sm:leading-[1.15]">
            {workspace?.greeting_message || "Welcome to our Help Center"}
          </h1>
          {/* <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {workspace?.description ||
              "Find answers to common questions and learn how to use our platform."}
          </p> */}
        </div>
        {/* Search Bar */}
        <div className="mx-auto max-w-2xl">
          <HelpCenterSearch />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            className="group relative flex flex-col overflow-hidden rounded-md border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
            href={`/help-center/category/${category.id}`}
            key={category.id}
          >
            {category.thumbnail_url ? (
              <div className="relative h-48 w-full overflow-hidden bg-muted">
                {/* biome-ignore lint: external image URL from API, using regular img tag */}
                <img
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  src={category.thumbnail_url}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
              </div>
            ) : (
              <div className="h-48 w-full bg-gradient-to-br from-primary/10 to-primary/5" />
            )}
            <div className="relative flex flex-1 flex-col p-6">
              <div className="mb-2 flex items-start justify-between gap-4">
                <h2 className="font-semibold text-xl leading-tight transition-colors group-hover:text-primary">
                  {category.name}
                </h2>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              {category.description && (
                <p className="line-clamp-3 flex-1 text-muted-foreground text-sm leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">No categories available yet.</p>
        </div>
      )}
    </div>
  );
}
