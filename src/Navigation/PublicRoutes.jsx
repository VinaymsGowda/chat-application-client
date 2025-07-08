import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { selectIsAuthenticated } from "../redux/features/Auth/User";

function PublicRoutes({ element }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }
  return element;
}

export default PublicRoutes;
