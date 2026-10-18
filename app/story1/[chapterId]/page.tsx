
import { notFound } from "next/navigation";
import StoryGame from "../../components/story1/StoryGame";
import { chapters } from "../../../lib/story1/chapters";


type PageProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

export default async function ChapterPage({ params }: PageProps) {
  const { chapterId } = await params;
  const id = Number(chapterId);

  if (!Number.isInteger(id)) {
    notFound();
  }

  const chapter = chapters.find((item) => item.id === id);

  if (!chapter) {
    notFound();
  }

  return <StoryGame chapter={chapter} />;
}
