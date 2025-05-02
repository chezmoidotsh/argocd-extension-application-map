import { useEffect, useState } from "react";

const isAuthenticated = (...deps: any[]): boolean | null => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/v1/session/userinfo");
        if (!response.ok) {
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated((await response.json()).loggedIn ?? false);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuthStatus();
  }, deps);

  return isAuthenticated;
};

export default isAuthenticated;
