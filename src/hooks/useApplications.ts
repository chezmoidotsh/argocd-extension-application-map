import { useState, useEffect } from 'react';
import { Application } from '../types';

const useApplications = (interval: number = 5000) => {
  const [applications, setApplications] = useState<Application[]>([]);
  
  const fetchApplications = () =>
    fetch('/api/v1/applications')
      .then(response => {
        if (!response.ok) { throw new Error(`Failed to fetch applications: ${response.statusText}`) }
        return response.json();
      })
      .then(data => {
        console.log(`Applications: ${data.items.length}`);
        const applications = (data.items || []).map((item: any): Application => ({
          kind: 'Application',
          name: item.metadata.name,
          namespace: item.metadata.namespace,
          health: { status: item.status.health.status },
          sync: { status: item.status.sync.status },
          resources: item.status.resources?.
            filter((resource: any) => resource.kind === 'Application' || resource.kind === 'ApplicationSet').
            map((resource: any): Application => ({
              kind: resource.kind,
              name: resource.name,
              namespace: resource.namespace,
              health: {
                status: resource.health?.status,
                message: resource.health?.message,
              },
              sync: {
                status: resource.sync?.status,
              },
            }))
        }));
        setApplications(applications);
      })
      .catch(error => console.error('Error fetching applications:', error));

  useEffect(() => {
    fetchApplications();
    // const intervalId = setInterval(fetchApplications, interval);
    // return () => clearInterval(intervalId);
  }, []);

  return applications;
};

export default useApplications; 