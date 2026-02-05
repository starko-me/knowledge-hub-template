"use server";

import { dehydrate, QueryClient } from "@tanstack/react-query";
import {
  getArticles,
  getCategories,
  getSingleCategory,
  getWorkspaceInfo,
} from "@/lib/help-center";

export const prefetchHelpCenterQueries = async () => {
  const queryClient = new QueryClient();

  try {
    // Prefetch workspace info
    await queryClient.prefetchQuery({
      queryKey: ["help-center-workspace"],
      queryFn: getWorkspaceInfo,
    });

    // Prefetch categories
    const categoriesData = await getCategories();
    
    if (categoriesData.ok && categoriesData.data) {
      await queryClient.prefetchQuery({
        queryKey: ["help-center-categories"],
        queryFn: getCategories,
      });

      // Prefetch all category details
      const categoryPromises = categoriesData.data.map((category) =>
        queryClient.prefetchQuery({
          queryKey: ["help-center-single-category", category.id],
          queryFn: () => getSingleCategory(category.id),
        })
      );

      // Prefetch all articles for categories
      const articlePromises = categoriesData.data.map((category) =>
        queryClient.prefetchQuery({
          queryKey: ["help-center-articles", category.id],
          queryFn: () => getArticles({ categoryid: category.id }),
        })
      );

      await Promise.all([...categoryPromises, ...articlePromises]);

      // Now prefetch articles for sub-categories
      // We need to wait for category details first
      const categoryDetailsPromises = categoriesData.data.map((category) =>
        getSingleCategory(category.id)
      );
      const categoryDetailsResults = await Promise.all(categoryDetailsPromises);

      const subCategoryArticlePromises: Promise<unknown>[] = [];
      
      for (let i = 0; i < categoriesData.data.length; i++) {
        const category = categoriesData.data[i];
        const categoryDetails = categoryDetailsResults[i];
        
        if (categoryDetails.ok && categoryDetails.data?.sub_categories) {
          for (const subCategory of categoryDetails.data.sub_categories) {
            subCategoryArticlePromises.push(
              queryClient.prefetchQuery({
                queryKey: ["help-center-articles", category.id, subCategory.id],
                queryFn: () =>
                  getArticles({
                    categoryid: category.id,
                    sub_category: subCategory.id,
                  }),
              })
            );
          }
        }
      }

      if (subCategoryArticlePromises.length > 0) {
        await Promise.all(subCategoryArticlePromises);
      }
    }
  } catch (error) {
    console.error("Error prefetching help center queries:", error);
  }

  return { dehydratedState: dehydrate(queryClient) };
};

