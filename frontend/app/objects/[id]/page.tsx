'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { getApiUrl } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ObjectItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt?: string;
}

export default function ObjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: object, isLoading, isError } = useQuery<ObjectItem>({
    queryKey: ['object', id],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}/objects/${id}`);
      if (!response.ok) throw new Error('Failed to fetch object');
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${getApiUrl()}/objects/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      router.push('/');
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this object?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </main>
    );
  }

  if (isError || !object) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">Object not found</p>
        <Button onClick={() => router.push('/')}>Back to list</Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </Button>

        <Card className="max-w-2xl mx-auto">
          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100">
            <Image
              src={object.imageUrl}
              alt={object.title}
              fill
              unoptimized={true}
              className="object-cover"
            />
          </div>

          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">{object.title}</CardTitle>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-[var(--destructive)] hover:opacity-90 text-black"
            >
              <Trash2 className="w-4 h-4 mr-2 text-black" />
              Delete
            </Button>
          </CardHeader>

          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{object.description}</p>
            {object.createdAt && (
              <p className="text-sm text-gray-400 mt-4">
                Created: {new Date(object.createdAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}