import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormProvider, useForm } from "react-hook-form";

import useRegister from "../api/authentication/use-register";
import Input from "../ui/form/input";
import Button from "../ui/button/button";

export const Route = createFileRoute("/register")({
  component: RouteComponent,
});

type FormData = {
  email: string;
  height: number;
  first_name: string;
  last_name: string;
  username: string;
  weight: number;
  password: string;
};

function RouteComponent() {
  const goTo = useNavigate();
  const methods = useForm<FormData>();

  const { isPending, mutate: register } = useRegister({
    onError: (err) => {
      console.log(err);
    },
    onSuccess: (res) => {
      console.log(res);
      localStorage.setItem("user", JSON.stringify(res));
      goTo({ to: "/" });
      // add toast
    },
  });

  const onSubmit = (formData: FormData) => {
    register(formData);
  };

  return (
    <div className="flex flex-col gap-2 items-center justify-center ">
      <div className="text-xl font-semibold mb-4">Let's get started...</div>
      <FormProvider {...methods}>
        <form
          className="flex flex-col items-center"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <div className="flex flex-col items-center gap-2 mb-3">
            <Input
              label="Email"
              disabled={isPending}
              placeholder="email"
              {...methods.register("email")}
            />
            <Input
              label="First Name"
              disabled={isPending}
              placeholder="name"
              {...methods.register("first_name")}
            />
            <Input
              label="Last Name"
              disabled={isPending}
              placeholder="name"
              {...methods.register("last_name")}
            />
            <Input
              label="Username"
              disabled={isPending}
              placeholder="name"
              {...methods.register("username")}
            />
            <Input
              label="Height"
              disabled={isPending}
              placeholder="height"
              type="number"
              {...methods.register("height")}
            />
            <Input
              label="Weight"
              disabled={isPending}
              placeholder="weight"
              type="number"
              {...methods.register("weight")}
            />

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
            Let's go!
          </Button>
        </form>
      </FormProvider>
      <div className="flex flex-col items-center gap-2 mt-6">
        Already a user?
        <Link to="/auth">
          <Button>Login</Button>
        </Link>
      </div>
    </div>
  );
}
