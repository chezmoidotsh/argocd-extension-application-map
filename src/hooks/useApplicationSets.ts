import { useState, useEffect } from "react";
import { Application, ArgoCDApplicationSet } from "../types";
import { convertArgoCDApplicationSetToApplication } from "../utils/converters";

const useApplicationSets = (interval: number = 5000) => {
  const [applicationSets, setApplicationSets] = useState<Application[]>([]);

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
        console.debug(`ApplicationSets:`, data.items);
        setApplicationSets(
          (data.items || []).map(convertArgoCDApplicationSetToApplication),
        );
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
