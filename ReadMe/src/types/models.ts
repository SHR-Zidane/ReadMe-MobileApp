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
  epub_content?: string;
  userId: number | null;
  authorId: number | null;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  author?: Author;
  category?: Category;
  tags?: Tag[];
}
