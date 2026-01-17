/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || "";

interface UnsplashSelectorProps {
  show: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const UnsplashSelector: React.FC<UnsplashSelectorProps> = ({
  show,
  onClose,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const search = async (q: string, pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: q,
        orientation: "landscape",
        per_page: "12",
        page: pageNum.toString(),
      });

      const response = await fetch(
        `https://api.unsplash.com/search/photos?${params}`,
        {
          headers: {
            Authorization: `Client-ID ${ACCESS_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results);
      setTotalPages(data.total_pages);
    } catch (e: any) {
      console.error(e);
      setResults([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (query) search(query, page);
  }, [page]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    search(query, 1);
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Buscar imagen en Unsplash</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSearch}>
          <Input
            type="text"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        <div className="max-h-[500px] overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {loading && (
              <div className="col-span-full flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {results.map((img) => (
              <div
                key={img.id}
                className="flex flex-col items-center"
              >
                <div
                  className="w-[200px] h-[120px] overflow-hidden rounded-lg cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => onSelect(img.urls.regular)}
                >
                  <img
                    src={img.urls.regular}
                    alt={img.alt_description || "Unsplash"}
                    className="w-[200px] h-[120px] object-cover"
                  />
                </div>
                <div className="text-sm mt-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <img
                      src={img.user.profile_image.medium}
                      alt={img.user.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <a
                      href={img.user.links.html}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      {img.user.name}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || loading}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || loading}
          >
            Siguiente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnsplashSelector;
