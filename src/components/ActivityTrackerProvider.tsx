import { useActivityTracker } from "@/hooks/useActivityTracker";

const ActivityTrackerProvider = () => {
  useActivityTracker();
  return null;
};

export default ActivityTrackerProvider;
