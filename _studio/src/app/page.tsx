import { MatchCard } from '@/components/match-card';
import { mockUsers } from '@/lib/data';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold font-headline text-center text-primary">Your Top Matches</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {mockUsers.slice(1).map((user) => (
          <MatchCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
