import { FormProvider, useForm } from "react-hook-form";
import {
  createFileRoute,
  Link,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";

import useAuth from "../api/authentication/use-auth";
import Input from "../ui/form/input";
import Button from "../ui/button/button";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
});

type FormData = {
  email: string;
  password: string;
};

function RouteComponent() {
  const methods = useForm<FormData>();
  const { isPending, mutate } = useAuth();
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
      onError: (err) => {
        console.log(err);
        // add toast
      },
      onSuccess: (res) => {
        console.log(res);
        localStorage.setItem("user", JSON.stringify(res));
        goTo({ to: redirect });
      },
    });
  };

  return (
    <div className="flex flex-col items-center h-full">
      <FormProvider {...methods}>
        <form
          className="flex flex-col items-center justify-center gap-4 h-3/4"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <div className="text-4xl italic font-bold mb-4">Motion</div>
          <div className="flex flex-col gap-2 w-full">
            <div>
              <Input
                label="Email"
                disabled={isPending}
                placeholder="email"
                {...methods.register("email")}
              />
            </div>
            <div>
              <Input
                label="Password"
                disabled={isPending}
                type="password"
                placeholder="password"
                {...methods.register("password")}
              />
            </div>
          </div>
          <Button disabled={isPending} type="submit">
            Login
          </Button>
          <div className="mt-4 flex flex-col gap-2">
            New user?
            <Link to="/register" search={redirect ? { redirect } : undefined}>
              <Button>Register</Button>
            </Link>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
