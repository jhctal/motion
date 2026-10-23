import {
  createFileRoute,
  Link,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useForm } from "react-hook-form";

import useRegister from "../api/authentication/use-register";
import Input from "../ui/form/input";
import PasswordInput from "../ui/form/password-input";
import Button from "../ui/button/button";
import { AuthLayout, FormError } from "../ui/auth-layout";
import { getErrorMessage } from "../utils/api-error";

export const Route = createFileRoute("/register")({
  component: RouteComponent,
});

type FormData = {
  email: string;
  height?: number;
  first_name: string;
  last_name: string;
  username: string;
  weight?: number;
  password: string;
};

const MIN_PASSWORD = 8;

function SectionHeading({ children }: { children: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {children}
    </p>
  );
}

function RouteComponent() {
  const goTo = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const {
    isPending,
    mutate: createAccount,
    error,
  } = useRegister({
    onSuccess: (res) => {
      localStorage.setItem("user", JSON.stringify(res));
      goTo({ to: redirect });
    },
  });

  // optional numbers arrive as NaN when left blank; send them as missing
  const optionalNumber = {
    setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
  };

  const onSubmit = (formData: FormData) => {
    createAccount(formData as Required<FormData>);
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/auth"
            search={{ redirect }}
            className="font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            Log in
          </Link>
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={handleSubmit(onSubmit)}
      >
        <fieldset className="flex flex-col gap-4" disabled={isPending}>
          <legend className="contents">
            <SectionHeading>Account</SectionHeading>
          </legend>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email", {
              required: "Enter your email",
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: "Enter a valid email address",
              },
            })}
          />
          <Input
            label="Username"
            autoComplete="username"
            placeholder="e.g. liftsjack"
            error={errors.username?.message}
            {...register("username", { required: "Choose a username" })}
          />
          <PasswordInput
            label="Password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD} characters`}
            error={errors.password?.message}
            {...register("password", {
              required: "Choose a password",
              minLength: {
                value: MIN_PASSWORD,
                message: `Use at least ${MIN_PASSWORD} characters`,
              },
            })}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4" disabled={isPending}>
          <legend className="contents">
            <SectionHeading>About you</SectionHeading>
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              autoComplete="given-name"
              error={errors.first_name?.message}
              {...register("first_name", { required: "Required" })}
            />
            <Input
              label="Last name"
              autoComplete="family-name"
              error={errors.last_name?.message}
              {...register("last_name", { required: "Required" })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Height (cm)"
              type="number"
              inputMode="decimal"
              placeholder="Optional"
              min={0}
              {...register("height", optionalNumber)}
            />
            <Input
              label="Weight (kg)"
              type="number"
              inputMode="decimal"
              placeholder="Optional"
              min={0}
              {...register("weight", optionalNumber)}
            />
          </div>
        </fieldset>

        <FormError message={error ? getErrorMessage(error) : undefined} />

        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
