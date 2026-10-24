import type { ReactNode } from "react";
import {
  CalendarDaysIcon,
  DumbbellIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from "lucide-react";

const FEATURES = [
  { icon: DumbbellIcon, text: "Plan workouts and log every set as you go" },
  {
    icon: TrendingUpIcon,
    text: "See your volume, streaks and progress over time",
  },
  {
    icon: CalendarDaysIcon,
    text: "Track sleep, nutrition, weight and measurements",
  },
];

// Split screen on large displays: brand panel left, form right.
// Phones get just the logo and the form.
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-white dark:bg-zinc-900">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 bg-gradient-to-br from-orange-500 via-orange-500 to-orange-700 text-white">
        {/* animated background: drifting blobs, a panning dot grid and
            slow rings, all in lighter shades of the orange */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="auth-blob auth-blob-a absolute -right-24 -top-24 size-96 rounded-full bg-orange-300/40 blur-3xl" />
          <div className="auth-blob auth-blob-b absolute top-1/3 -left-32 size-[28rem] rounded-full bg-amber-200/25 blur-3xl" />
          <div className="auth-blob auth-blob-c absolute -bottom-32 right-1/4 size-96 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="auth-dots absolute inset-0 text-orange-100/25" />
          <div className="auth-ring absolute -right-40 top-1/4 size-[32rem] rounded-full border border-orange-100/20" />
          <div className="auth-ring auth-ring-reverse absolute -right-20 top-1/3 size-80 rounded-full border border-dashed border-orange-100/25" />
          <div className="auth-ring absolute -bottom-48 -left-24 size-[26rem] rounded-full border border-orange-100/15" />
        </div>

        <div className="relative flex items-center gap-3">
          <img
            src="/assets/logo-dark.png"
            alt=""
            className="size-10 rounded-xl shadow-lg shadow-orange-900/30"
          />
          <span className="text-2xl font-semibold italic">Motion</span>
        </div>

        <div className="relative flex flex-col gap-8 max-w-md">
          <p className="text-4xl font-semibold leading-tight tracking-tight">
            Train with intent.
            <br />
            Track every rep.
          </p>
          <ul className="flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-orange-50">
                <span className="size-9 shrink-0 grid place-items-center rounded-lg bg-white/15">
                  <Icon size={18} aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-orange-100/80">
          © {new Date().getFullYear()} Motion
        </p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="lg:hidden flex items-center gap-2.5 mb-4">
              <img
                src="/assets/logo-light.png"
                alt=""
                className="size-9 rounded-lg dark:hidden"
              />
              <img
                src="/assets/logo-dark.png"
                alt=""
                className="size-9 rounded-lg hidden dark:block"
              />
              <span className="text-xl font-semibold italic">Motion</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
          {children}
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            {footer}
          </p>
        </div>
      </main>
    </div>
  );
}

// Server error above the submit button
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
    >
      <TriangleAlertIcon
        size={16}
        aria-hidden="true"
        className="mt-0.5 shrink-0"
      />
      {message}
    </div>
  );
}
