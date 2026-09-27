import { SpeedInsights } from "@vercel/speed-insights/react";
import SiteApp from "./SiteApp";

export default function App() {
  return (
    <>
      <SiteApp />
      <SpeedInsights />
    </>
  );
}
