import { useState, useEffect } from "react";
import { Application, ArgoCDApplication } from "../types";
import { convertArgoCDApplicationToApplication } from "../utils/converters";

const useApplications = (interval: number = 5000) => {
  const [applications, setApplications] = useState<Application[]>([]);

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
        console.debug(`Applications:`, data.items);
        setApplications(
          (data.items || []).map(convertArgoCDApplicationToApplication),
        );
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
