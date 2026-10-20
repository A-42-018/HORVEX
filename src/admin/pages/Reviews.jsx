import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "react-router";
import { Button, Card, Skeleton } from "../../components/common";
import { strings } from "../../lib/strings";
import ReviewCard from "../components/reviews/ReviewCard";
import ReviewModal from "../components/reviews/ReviewModal";
import { ACTION_STATUS, REVIEW_TABS, readReviewFilters } from "../components/reviews/reviewRules";
import { useAdminReviews, useRemoveReview, useReviewCounts, useSetReviewStatus } from "../hooks/useReviewAdmin";

const t = strings.admin.reviews;
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";
const forbidden = (error) => error?.code === "42501" || error?.code === "PGRST116";

function Reviews() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readReviewFilters(params), [params]);
  const [notice, setNotice] = useState("");
  const [problem, setProblem] = useState("");
  const [adding, setAdding] = useState(0); // 0 = closed; bumps remount the modal
  const [busyId, setBusyId] = useState(null);

  const { data, isPending, isError, isFetching, isFetchingNextPage, hasNextPage, more, refetch } = useAdminReviews(filters);
  const { data: counts } = useReviewCounts();
  const setStatus = useSetReviewStatus();
  const remove = useRemoveReview();

  const select = (status) => {
    setParams(status === "pending" ? {} : { status }, { replace: true });
    setNotice("");
    setProblem("");
  };

  const fail = (error) => setProblem(forbidden(error) ? t.messages.forbidden : t.messages.failed);

  const act = (review, action) => {
    setProblem("");
    setNotice("");
    setBusyId(review.id);
    setStatus.mutate(
      { id: review.id, status: ACTION_STATUS[action] },
      { onSuccess: () => setNotice(t.messages[action](review.name)), onError: fail, onSettled: () => setBusyId(null) },
    );
  };

  const erase = (review) => {
    setProblem("");
    setNotice("");
    setBusyId(review.id);
    remove.mutate(review, {
      onSuccess: () => setNotice(t.messages.removed(review.name)),
      onError: fail,
      onSettled: () => setBusyId(null),
    });
  };

  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | WRISTORY Admin`}</title>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h3 text-fg">{t.title}</h1>
          <p className="text-small text-muted">{counts ? t.count(counts.all, counts.pending) : t.intro}</p>
        </div>
        <Button className="gap-2" onClick={() => setAdding((n) => n + 1)}>
          <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
          {t.newItem}
        </Button>
      </div>
      {counts && <p className="-mt-3 max-w-prose text-small text-muted">{t.intro}</p>}

      <div role="group" aria-label={t.tabsLabel} className="flex flex-wrap gap-2">
        {REVIEW_TABS.map((tab) => {
          const on = tab === filters.status;
          return (
            <button
              key={tab}
              type="button"
              aria-pressed={on}
              onClick={() => select(tab)}
              className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-pill border px-4 text-small font-semibold transition-colors duration-fast ${focusRing} ${
                on ? "border-gold bg-gold text-obsidian" : "border-line text-fg hover:border-brand"
              }`}
            >
              {t.tabs[tab]}
              {counts && <span className="tabular-nums opacity-80">{counts[tab]}</span>}
            </button>
          );
        })}
      </div>

      <p role="status" className="min-h-5 text-small text-positive">
        {notice}
      </p>
      {problem && (
        <p role="alert" className="-mt-4 text-small text-danger">
          {problem}
        </p>
      )}

      {isPending && (
        <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {isError && !data && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.error}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      )}

      {data && (
        <>
          <p role="status" className="text-small text-muted">
            {isFetching ? t.updating : t.showing(items.length, data.total)}
          </p>
          {items.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-body text-fg">{t.empty[filters.status]}</p>
              {filters.status === "all" && <p className="text-small text-muted">{t.empty.allHint}</p>}
            </Card>
          ) : (
            <Card as="section" aria-label={t.title} className="overflow-hidden">
              <ul className="divide-y divide-line">
                {items.map((review) => (
                  <ReviewCard key={review.id} review={review} busy={busyId === review.id} onAction={act} onRemove={erase} />
                ))}
              </ul>
            </Card>
          )}
          {hasNextPage && (
            <Button variant="secondary" size="sm" className="self-center" loading={isFetchingNextPage} onClick={more}>
              {t.more}
            </Button>
          )}
        </>
      )}

      <ReviewModal
        key={adding}
        open={adding > 0}
        onClose={() => setAdding(0)}
        onSaved={(message) => {
          setAdding(0);
          setNotice(message);
        }}
      />
    </div>
  );
}

export default Reviews;
