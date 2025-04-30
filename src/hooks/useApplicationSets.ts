import { useState, useEffect } from "react";
import { ArgoCDApplicationSet } from "../types";

const useApplicationSets = (interval: number = 5000) => {
  const [applicationSets, setApplicationSets] = useState<
    ArgoCDApplicationSet[]
  >([]);

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
      })
      .catch((error) =>
        console.error("Error fetching application sets:", error),
      );

  useEffect(() => {
    fetchApplicationSets();
    // const intervalId = setInterval(fetchApplicationSets, interval);
    // return () => clearInterval(intervalId);
  }, []);

  return applicationSets;
};

export default useApplicationSets;
