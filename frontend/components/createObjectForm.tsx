"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Upload, X, ImageIcon } from "lucide-react";
import { getApiUrl } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const createObjectSchema = z.object({
  title: z.string().min(3, "Title must contain at least 3 characters"),

  description: z
    .string()
    .min(10, "Description must contain at least 10 characters"),

  file: z
    .instanceof(File, {
      message: "An image is required",
    })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Image size must not exceed 5MB",
    })
    .refine((file) => file.type.startsWith("image/"), {
      message: "File must be an image",
    }),
});

interface CreateObjectFormProps {
  onSuccess?: () => void;
}

export default function CreateObjectForm({ onSuccess }: CreateObjectFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createObjectMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`${getApiUrl()}/objects`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create object");
      }

      return response.json();
    },

    onSuccess: () => {
      console.log('Front-end: Objet créé avec succès');
      setTitle("");
      setDescription("");
      setFile(null);
      setPreviewUrl(null);
      setErrors({});
      onSuccess?.();
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = createObjectSchema.safeParse({
      title,
      description,
      file,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};

      validation.error.issues.forEach((error) => {
        const field = error.path[0] as string;

        fieldErrors[field] = error.message;
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", description);
    formData.append("file", file!);

    createObjectMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Title</label>
        <Input
          placeholder="Enter object title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {errors.title && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            {errors.title}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <Textarea
          placeholder="Enter object description (min 10 characters)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="resize-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {errors.description && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            {errors.description}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Image</label>

        {previewUrl ? (
          <div className="relative rounded-lg overflow-hidden border bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-40 object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 shadow-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <ImageIcon className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Click to upload an image
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {errors.file && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            {errors.file}
          </p>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={createObjectMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          {createObjectMutation.isPending ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Create Object
            </span>
          )}
        </Button>
      </div>

      {createObjectMutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {(createObjectMutation.error as Error).message}
        </div>
      )}

      {createObjectMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Object created successfully!
        </div>
      )}
    </form>
  );
}