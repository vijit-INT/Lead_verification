import React, { Suspense } from "react";
import Agents from "../component/Agents";

const AgentPage = () => {
  return (
    <Suspense fallback={<div>Loading AI Agent...</div>}>
      <Agents />
    </Suspense>
  );
};

export default AgentPage;
