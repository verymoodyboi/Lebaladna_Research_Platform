import React, { useEffect, useState, type FormEvent } from "react";
import {
  Home,
  HeartPulse,
  BookOpen,
  Briefcase,
  Droplet,
  ShieldCheck,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../layouts/Layout";
import {
  createCollection,
  listCollections,
  type Collection,
} from "../features/collections/collections.services";
import { useNavigate } from "react-router-dom";

type Accent = "sage" | "sky";

// The DB only stores collection_name / bg_path — icon and accent are purely
// decorative, cycled by position so cards stay visually distinct.
const ICON_CYCLE: { icon: LucideIcon; accent: Accent }[] = [
  { icon: Home, accent: "sage" },
  { icon: HeartPulse, accent: "sky" },
  { icon: BookOpen, accent: "sky" },
  { icon: Briefcase, accent: "sage" },
  { icon: Droplet, accent: "sky" },
  { icon: ShieldCheck, accent: "sage" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface CollectionCardProps {
  data: Collection;
  index: number;
  delay: number;
  onSelect: (id: string) => void;
}

function CollectionCard({
  data,
  index,
  delay,
  onSelect,
}: CollectionCardProps): React.ReactElement {
  const { icon: Icon, accent } = ICON_CYCLE[index % ICON_CYCLE.length];

  return (
    <button
      type="button"
      onClick={() => onSelect(data.collection_id)}
      style={{ animationDelay: `${delay}ms` }}
      className={`card-${accent} animate-riseIn group relative flex flex-col items-start overflow-hidden rounded-2xl bg-white p-5 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg focus-brand`}
    >
      <span className="card-bar absolute inset-x-0 top-0 h-1" />
      <span
        className={`icon-${accent} mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105`}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <h3 className="font-display text-lg font-semibold text-ink">
        {data.collection_name}
      </h3>
      <div className="mt-4 flex w-full items-center justify-between">
        <span className="text-xs font-medium text-ink-soft">
          Added {formatDate(data.created_at)}
        </span>
      </div>
    </button>
  );
}

function SkeletonCard({ delay }: { delay: number }): React.ReactElement {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-riseIn rounded-2xl border border-transparent bg-white p-5 shadow-sm"
      aria-hidden="true"
    >
      <div className="skeleton mb-4 h-11 w-11 rounded-xl" />
      <div className="skeleton mb-2 h-4 w-3/5 rounded" />
      <div className="skeleton mb-1.5 h-3 w-full rounded" />
      <div className="skeleton mb-4 h-3 w-4/5 rounded" />
      <div className="flex items-center justify-between">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-3 w-3 rounded-full" />
      </div>
    </div>
  );
}

interface CreateCollectionDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (collection: Collection) => void;
}

function CreateCollectionDialog({
  open,
  onClose,
  onCreated,
}: CreateCollectionDialogProps): React.ReactElement | null {
  const [name, setName] = useState("");
  const [bgPath, setBgPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setBgPath("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Collection name is required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { collection } = await createCollection({
        collection_name: name.trim(),
        bg_path: bgPath.trim() || undefined,
      });

      onCreated(collection);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the collection. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="auth-card animate-riseIn relative w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="focus-brand absolute right-5 top-5 rounded-full p-1 text-ink-soft transition-colors hover:bg-sage-50 hover:text-ink"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-display text-2xl font-semibold text-ink">
          New collection
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Create a new survey collection.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
          {error && (
            <div className="alert-error rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <label
            className="flex w-full flex-col gap-1.5"
            htmlFor="collection-name"
          >
            <span className="text-sm font-medium text-ink">Name</span>
            <input
              id="collection-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
              className="input-brand focus-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label
            className="flex w-full flex-col gap-1.5"
            htmlFor="collection-bg"
          >
            <span className="text-sm font-medium text-ink">
              Cover image URL <span className="text-ink-soft">(optional)</span>
            </span>
            <input
              id="collection-bg"
              value={bgPath}
              onChange={(event) => setBgPath(event.target.value)}
              disabled={loading}
              className="input-brand focus-brand w-full rounded-xl px-3.5 py-2.5 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <div className="mt-1 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary focus-brand w-full rounded-xl py-3 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary focus-brand w-full rounded-xl py-3 text-sm font-semibold"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Page-specific styles not covered by the shared Layout brand styles. */
function HomeStyle(): React.ReactElement {
  return (
    <style>{`
      .card-sage, .card-sky { border: 1px solid #EEF1E6; }
      .card-sage:hover { border-color: var(--sage-300); box-shadow: 0 14px 30px -16px rgba(168, 212, 92, 0.45); }
      .card-sky:hover { border-color: var(--sky-300); box-shadow: 0 14px 30px -16px rgba(0, 175, 240, 0.45); }
      .card-sage .card-bar { background: linear-gradient(90deg, var(--sage-500), var(--sage-200)); }
      .card-sky .card-bar { background: linear-gradient(90deg, var(--sky-500), var(--sky-200)); }
      .icon-sage { background-color: var(--sage-100); color: var(--sage-700); }
      .icon-sky { background-color: var(--sky-100); color: var(--sky-700); }

      .skeleton {
        background: linear-gradient(90deg, var(--sage-100) 0%, var(--sky-100) 50%, var(--sage-100) 100%);
        background-size: 200% 100%;
        animation: shimmer 1.6s ease-in-out infinite;
      }
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .skeleton { animation: none !important; }
      }
    `}</style>
  );
}

export default function HomePage(): React.ReactElement {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { userInfo } = useAuth();
  const isAdmin = userInfo?.role === "admin";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const { collections: data } = await listCollections();
        if (!cancelled) setCollections(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load collections.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);
  const navigate = useNavigate();

  const handleSelectCollection = (id: string): void => {
    console.log("Selected collection", id);
    navigate(`/collections/${id}`);
  };

  const handleCreated = (collection: Collection): void => {
    setCollections((prev) => [collection, ...prev]);
  };

  return (
    <Layout>
      <HomeStyle />

      <Layout.Header userInfo={userInfo} />

      <Layout.Body>
        <section className="flex items-start justify-between gap-4 pb-8 pt-4">
          <div>
            <h1
              className="animate-riseIn font-display text-3xl font-medium text-ink sm:text-4xl"
              style={{ animationDelay: "60ms" }}
            >
              {getGreeting()}, {userInfo?.first_name}
            </h1>
            <p
              className="animate-riseIn mt-2 text-ink-soft"
              style={{ animationDelay: "120ms" }}
            >
              Select a survey to begin collecting responses.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="btn-primary focus-brand flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              New collection
            </button>
          )}
        </section>

        {error && !loading && (
          <div className="alert-error mb-5 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} delay={i * 70} />
              ))
            : collections.map((collection, i) => (
                <CollectionCard
                  key={collection.collection_id}
                  data={collection}
                  index={i}
                  delay={i * 70}
                  onSelect={handleSelectCollection}
                />
              ))}
        </div>
      </Layout.Body>

      <Layout.Footer />

      <CreateCollectionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </Layout>
  );
}
