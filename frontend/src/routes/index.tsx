import { createFileRoute, redirect } from "@tanstack/react-router";

import PageWrapper from "#ui/page-wrapper/page-wrapper";
import { LastWorkoutWidget } from "#ui/widgets/last-workout-widget";
import { WorkoutStreakWidget } from "#ui/widgets/workout-streak-widget";
import { WorkoutFrequencyWidget } from "#ui/widgets/workout-frequency-widget";
import { WeightTrendWidget } from "#ui/widgets/weight-trend-widget";
import { TotalLiftedWidget } from "#ui/widgets/total-lifted-widget";
import { TotalWorkoutsWidget } from "#ui/widgets/total-workouts-widget";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ location }) => {
    const user = localStorage.getItem("user");

    if (!user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: Homepage,
});

function Homepage() {
  return (
    <PageWrapper pageName="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
        {/* Headline numbers */}
        <TotalWorkoutsWidget />
        <TotalLiftedWidget />
        <div className="md:col-span-2 lg:col-span-1">
          <WorkoutStreakWidget />
        </div>

        <LastWorkoutWidget />
        <div className="lg:col-span-2">
          <WorkoutFrequencyWidget />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <WeightTrendWidget />
        </div>
      </div>
    </PageWrapper>
  );
}

export default Homepage;
