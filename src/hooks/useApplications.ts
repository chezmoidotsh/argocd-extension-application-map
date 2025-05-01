import { useState, useEffect } from "react";
import { ArgoCDApplication } from "../types";

const useApplications = (interval: number = 5000) => {
  const [applications, setApplications] = useState<ArgoCDApplication[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplications = () =>
    fetch("/api/v1/applications")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch applications: ${response.statusText}`,
          );
        }
        return response.json() as Promise<{ items: ArgoCDApplication[] }>;
      })
      .then((data) => {
        setApplications(data.items);
        setError(null);
      })
      .catch((error) => {
        setError(error);
      });

  useEffect(() => {
    fetchApplications();
    // const intervalId = setInterval(fetchApplications, interval);
    // return () => clearInterval(intervalId);
  }, []);

  return { data: applications, error };
};

export default useApplications;
