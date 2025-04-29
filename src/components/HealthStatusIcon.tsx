import React from "react";

interface HealthStatusIconProps {
  status?: string;
}

const HealthStatusIcon: React.FC<HealthStatusIconProps> = ({ status }) => {
  if (status === "Progressing") {
    return (
      <i
        qe-id="utils-health-status-title"
        title="Progressing"
        className="fa fa fa-circle-notch fa-spin utils-health-status-icon"
        style={{ color: "#0dadea", marginRight: 4 }}
      ></i>
    );
  }
  if (status === "Degraded") {
    return (
      <i
        qe-id="utils-health-status-title"
        title="Degraded"
        className="fa fa-heart-broken utils-health-status-icon"
        style={{ color: "#e96d76", marginRight: 4 }}
      ></i>
    );
  }
  if (status === "Healthy") {
    return (
      <i
        qe-id="utils-health-status-title"
        title="Healthy"
        className="fa fa-heart utils-health-status-icon"
        style={{ color: "#18be94", marginRight: 4 }}
      ></i>
    );
  }
  return (
    <i
      qe-id="utils-health-status-title"
      title={status}
      className="fa fa-heart utils-health-status-icon"
      style={{ color: "#b1b1b1", marginRight: 4 }}
    ></i>
  );
};

export default HealthStatusIcon; 