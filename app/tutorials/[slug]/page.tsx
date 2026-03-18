import { getAllTutorials } from '@/lib/tutorials';
import TutorialPageClient from './TutorialPageClient';

export function generateStaticParams() {
  return getAllTutorials().map((t) => ({ slug: t.slug }));
}

export default function TutorialPage() {
  return <TutorialPageClient />;
}
