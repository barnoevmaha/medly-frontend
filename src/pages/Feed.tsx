import { PageHeader } from "@/components/layout/PageHeader";
import { ArticleFeed } from "@/components/feed/ArticleFeed";

/** Your Feed — the full article stream, with search over article bodies. */
export default function Feed() {
  return (
    <>
      <PageHeader
        title="Your Feed"
        subtitle="Medical news, study technique and events — searchable to the last word"
      />
      <ArticleFeed />
    </>
  );
}
