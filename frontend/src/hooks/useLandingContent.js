import { useState, useEffect } from "react";
import api from "../utils/api";

/** Client fallback if API fails — mirrors backend defaults loosely */
const FALLBACK = {
  heroTitle: "ECE. Designed to connect generations.",
  heroSubtitle:
    "A living bridge between our department and alumni who shape chips, systems, and societies.",
  heroBadge: "Department of Electronics & Communication Engineering",
  departmentEyebrow: "The department",
  departmentTitle: "Where theory meets the signal that changes the world.",
  departmentBody:
    "From solid-state devices to 5G and AI at the edge — our graduates power labs, semiconductors, and startups. MentorBridge keeps that lineage visible.",
  departmentHighlight:
    "Research that travels from the lab to industry — and back through mentorship.",
  stats: [
    { label: "Alumni on platform", value: "Growing", sublabel: "Mentors & role models" },
    { label: "Focus", value: "ECE-first", sublabel: "Circuits to careers" },
    { label: "Mentorship", value: "1:1", sublabel: "Requests & chat" },
  ],
  impactTitle: "Faces of the department",
  impactSubtitle: "Alumni whose work reflects the breadth of what we study.",
  spotlights: [],
  timelineTitle: "A short arc of impact",
  timelineSubtitle: "How the department’s story reads across decades.",
  timeline: [],
  closingTitle: "Join the line that keeps ECE human.",
  closingSubtitle: "Create an account to explore alumni, the feed, and conversations.",
};

export function useLandingContent() {
  const [landing, setLanding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/site/landing");
        if (!cancelled && data?.success && data.data) {
          setLanding(data.data);
        } else if (!cancelled) {
          setLanding(FALLBACK);
        }
      } catch {
        if (!cancelled) setLanding(FALLBACK);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { landing: landing || FALLBACK, loading };
}
