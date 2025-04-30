import { useState, useEffect } from "react";
import { ArgoCDApplication } from "../types";

const useApplications = (interval: number = 5000) => {
  const [applications, setApplications] = useState<ArgoCDApplication[]>([]);

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
      })
      .catch((error) => console.error("Error fetching applications:", error));

  useEffect(() => {
    fetchApplications();
    // const intervalId = setInterval(fetchApplications, interval);
    // return () => clearInterval(intervalId);
  }, []);

  return applications;
};

export default useApplications;
