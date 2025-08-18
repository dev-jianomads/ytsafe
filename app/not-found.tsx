import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md w-full">
        <Heart className="h-16 w-16 text-pink-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}