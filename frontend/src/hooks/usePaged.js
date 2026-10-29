import { useEffect, useState } from "react";
import { api } from "../api";

// Loads a paged list (GET url?page=&limit=) and appends the next page on loadMore().
// `field` is the key of the array in the response ("posts" or "albums").
export default function usePaged(url, field, limit = 12) {
  const fresh = { items: [], page: 0, total: 0, hasMore: false, loading: true, error: "" };
  const [state, setState] = useState(fresh);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setState(fresh);
    api
      .get(`${url}?page=1&limit=${limit}`)
      .then((d) => live && setState({ items: d[field], page: 1, total: d.total, hasMore: d.hasMore, loading: false, error: "" }))
      .catch((e) => live && setState({ ...fresh, loading: false, error: e.message }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, field, limit, tick]);

  const loadMore = async () => {
    if (state.loading || !state.hasMore) return;
    const next = state.page + 1;
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const d = await api.get(`${url}?page=${next}&limit=${limit}`);
      setState((s) => ({ ...s, items: [...s.items, ...d[field]], page: next, total: d.total, hasMore: d.hasMore, loading: false }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  };

  return { ...state, loadMore, reload: () => setTick((t) => t + 1) };
}
