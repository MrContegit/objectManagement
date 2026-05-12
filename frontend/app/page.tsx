'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { socket } from '@/lib/socket';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import Image from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import CreateObjectForm from '@/components/createObjectForm';

interface ObjectItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt?: string;
}

interface PaginatedResponse {
  data: ObjectItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ObjectsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 12;

  const {
    data,
    isLoading,
    isError,
  } = useQuery<PaginatedResponse>({
    queryKey: ['objects', page],
    queryFn: async () => {
      const apiUrl = typeof window === 'undefined' ? 'http://backend:3000' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
      const response = await fetch(`${apiUrl}?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch objects');
      }
      console.log('Front-end: Objets appelés (fetched) avec succès');
      return response.json();
    },
  });

  const objects = data?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const apiUrl = typeof window === 'undefined' ? 'http://backend:3000' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
      const response = await fetch(`${apiUrl}/objects/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      console.log('Front-end: Objet supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
  });

  useEffect(() => {
    socket.on('objectCreated', (newObject: ObjectItem) => {
      queryClient.setQueryData<PaginatedResponse>(['objects', page], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: [newObject, ...old.data],
          total: old.total + 1,
        };
      });
    });

    socket.on('objectDeleted', ({ _id }: { _id: string }) => {
      queryClient.setQueryData<PaginatedResponse>(['objects', page], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((obj) => obj._id !== _id),
          total: old.total - 1,
        };
      });
    });

    return () => {
      socket.off('objectCreated');
      socket.off('objectDeleted');
    };
  }, [queryClient, page]);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Object Management</h1>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">+ Add New Object</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Object</DialogTitle>
                </DialogHeader>
                <CreateObjectForm onSuccess={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-8 py-8">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Failed to load objects
          </div>
        )}

        {objects.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No objects found</p>
            <p className="text-sm">Click &quot;Add New Object&quot; to create one</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {objects.map((obj) => (
            <Card
              key={obj._id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => router.push(`/objects/${obj._id}`)}
            >
              <div className="aspect-video overflow-hidden bg-gray-100 relative">
                <Image
                  src={obj.imageUrl}
                  alt={obj.title}
                  fill
                  unoptimized={true}
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold line-clamp-1">{obj.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this object?')) {
                      deleteMutation.mutate(obj._id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{obj.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {data && data.totalPages > 1 && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4 text-sm text-muted-foreground">
                  Page {data.page} of {data.totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  className={page === data.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </main>
  );
}
