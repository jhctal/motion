import { useForm } from "react-hook-form";
import {
  createFileRoute,
  Link,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";

import useAuth from "#api/authentication/use-auth";
import Input from "#ui/form/input";
import PasswordInput from "#ui/form/password-input";
import Button from "#ui/button/button";
import { AuthLayout, FormError } from "#ui/auth-layout";
import { getErrorMessage } from "#utils/api-error";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
});

type FormData = {
  email: string;
  password: string;
};

function RouteComponent() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const { isPending, mutate, error } = useAuth();
  const goTo = useNavigate();
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const redirect = sp.get("redirect") || "/";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      goTo({ to: redirect });
    }
  }, [goTo, redirect]);

  const onSubmit = (formData: FormData) => {
    mutate(formData, {
      onSuccess: (res) => {
        localStorage.setItem("user", JSON.stringify(res));
        goTo({ to: redirect });
      },
    });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={
        <>
          New to Motion?{" "}
          <Link
            to="/register"
            search={{ redirect }}
            className="font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isPending}
          error={errors.email?.message}
          {...register("email", { required: "Enter your email" })}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          disabled={isPending}
          error={errors.password?.message}
          {...register("password", { required: "Enter your password" })}
        />

        <FormError message={error ? getErrorMessage(error) : undefined} />

        <Button type="submit" size="lg" disabled={isPending} className="mt-1">
          {isPending ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
