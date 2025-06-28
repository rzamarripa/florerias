/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { Form, Modal, Spinner } from "react-bootstrap";

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
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Buscar imagen en Unsplash</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSearch}>
          <Form.Control
            type="text"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Form>
        <div
          style={{
            maxHeight: 800,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <div className="row mt-2">
            {loading && <Spinner animation="border" />}
            {results.map((img) => (
              <div
                key={img.id}
                className="col-12 col-md-4 mb-2"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 200,
                    height: 120,
                    overflow: "hidden",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => onSelect(img.urls.regular)}
                >
                  <img
                    src={img.urls.regular}
                    alt={img.alt_description || "Unsplash"}
                    style={{ width: 200, height: 120, objectFit: "cover" }}
                  />
                </div>
                <div
                  style={{ fontSize: 13, marginTop: 8, textAlign: "center" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <img
                      src={img.user.profile_image.medium}
                      alt={img.user.name}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                    <div>
                      <a
                        href={img.user.links.html}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontWeight: 500 }}
                      >
                        {img.user.name}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || loading}
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || loading}
          >
            Siguiente
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default UnsplashSelector;
