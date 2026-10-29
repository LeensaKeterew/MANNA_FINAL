import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

// GETs a url (pass null to skip). Returns { data, loading, error, status, reload, setData }.
export default function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: Boolean(url), error: "", status: 0 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) {
      setState({ data: null, loading: false, error: "", status: 0 });
      return undefined;
    }
    let live = true;
    setState((s) => ({ ...s, loading: true, error: "", status: 0 }));
    api
      .get(url)
      .then((data) => live && setState({ data, loading: false, error: "", status: 200 }))
      .catch((err) => live && setState({ data: null, loading: false, error: err.message, status: err.status }));
    return () => {
      live = false;
    };
  }, [url, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback(
    (next) => setState((s) => ({ ...s, data: typeof next === "function" ? next(s.data) : next })),
    []
  );

  return { ...state, reload, setData };
}
