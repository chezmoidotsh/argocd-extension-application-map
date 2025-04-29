import { useState, useEffect } from 'react';
import { Application } from '../types';

const useApplicationSets = (interval: number = 5000) => {
  const [applicationSets, setApplicationSets] = useState<Application[]>([]);
  
  const fetchApplicationSets = () =>
    fetch('/api/v1/applicationsets')
      .then(response => {
        if (!response.ok) { throw new Error(`Failed to fetch application sets: ${response.statusText}`) }
        return response.json();
      })
      .then(data => {
        console.log(`ApplicationSets: ${JSON.stringify(data.items)}`);
        const applicationSets = (data.items || []).map((item: any): Application => ({
          kind: 'ApplicationSet',
          name: item.metadata.name,
          namespace: item.metadata.namespace,
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
        setApplicationSets(applicationSets);
      })
      .catch(error => console.error('Error fetching application sets:', error));

  useEffect(() => {
    fetchApplicationSets();
    // const intervalId = setInterval(fetchApplicationSets, interval);
    // return () => clearInterval(intervalId);
  }, []);

  return applicationSets;
};

export default useApplicationSets; 