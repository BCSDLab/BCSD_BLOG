import React from "react";
import { Redirect } from "@docusaurus/router";

export default function NotFoundWrapper() {
  return <Redirect to="/front-end" />;
}
