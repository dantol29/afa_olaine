import type { Metadata } from "next";
import { ClubDesignLab } from "./club-design-lab";

export const metadata: Metadata = {
  title: "Football design lab | AFA Olaine",
  description: "A visual reference lab exploring Watford, Wolves and Hull City for AFA Olaine.",
  robots: { index: false, follow: false },
};

export default function LabPage() {
  return <ClubDesignLab />;
}
