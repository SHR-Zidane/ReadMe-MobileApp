export interface Tag {
  id: number;
  name: string;
  color: string; // ex: "#4A635E"
}

export interface Category {
  id: number;
  name: string;
}

export interface Author {
  id: number;
  first_name: string;
  last_name: string;
}

export interface Book {
  id: number;
  title: string;
  summary: string | null;
  page_count: number | null;
  epubPath: string;
  cover_image: string | null;
  last_read_page: number;
  last_read_cfi: string | null;
  epub_content?: string;
  authorId: number | null;
  created_at: string;
  updated_at: string;
  author?: Author;
  tags: Tag[]; // toujours un tableau (normalisé côté backend)
}
