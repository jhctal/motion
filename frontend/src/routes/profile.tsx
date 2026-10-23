import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import PageWrapper from "../ui/page-wrapper/page-wrapper";
import Input from "../ui/form/input";
import useUserProfile from "../api/user/use-user-profile";
import useUpdateUserProfile from "../api/user/use-update-user-profile";
import useUpdateUserPreferences from "../api/user/use-update-user-preferences";
import Select from "../ui/form/select";

export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const updatePreferences = useUpdateUserPreferences();

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [units, setUnits] = useState("");

  useEffect(() => {
    if (data) {
      setHeight(String(data.height ?? ""));
      setWeight(String(data.weight ?? ""));
      setUnits(data.preferences.units ?? "");
    }
  }, [data]);

  const isPending = updateProfile.isPending || updatePreferences.isPending;

  function handleSave() {
    updateProfile.mutate({ height: Number(height), weight: Number(weight) });
    if (units !== data?.preferences.units) {
      updatePreferences.mutate({ units: units as "kg" | "lbs" });
    }
  }

  return (
    <PageWrapper pageName="Your Profile">
      <div className="flex flex-col gap-2">
        <p>Hello {data?.first_name}!</p>
        <Input
          label="Height"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="Height"
        />
        <Input
          label="Weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Weight"
        />
        <Select value={units} onChange={(e) => setUnits(e.target.value)}>
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
        </Select>
        <button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </PageWrapper>
  );
}
