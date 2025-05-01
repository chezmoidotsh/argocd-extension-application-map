import { useState, useEffect } from "react";
import { ArgoCDApplicationSet } from "../types";

const useApplicationSets = (interval: number = 5000) => {
  const [applicationSets, setApplicationSets] = useState<
    ArgoCDApplicationSet[]
  >([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplicationSets = () =>
    fetch("/api/v1/applicationsets")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch application sets: ${response.statusText}`,
          );
        }
        return response.json() as Promise<{ items: ArgoCDApplicationSet[] }>;
      })
      .then((data) => {
        setApplicationSets(data.items);
        setError(null);
      })
      .catch((error) => {
        setError(error);
      });

  useEffect(() => {
    fetchApplicationSets();
    // const intervalId = setInterval(fetchApplicationSets, interval);
    // return () => clearInterval(intervalId);
  }, []);

  return { data: applicationSets, error };
};

export default useApplicationSets;
