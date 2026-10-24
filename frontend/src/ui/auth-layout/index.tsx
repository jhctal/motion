import { useState, type ReactNode } from "react";
import {
  CalendarDaysIcon,
  DumbbellIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from "lucide-react";

import ThemeIconToggle from "../theme-icon-toggle";
import useTheme from "../../hooks/use-theme";
import cn from "../../utils/cn";

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

// Theme toggle bottom left, copyright bottom right. Clicks stop here so toggling the
// theme on the mobile hero doesn't also dismiss it.
function ThemeCopyright({
  className,
  toggleClassName,
}: {
  className?: string;
  toggleClassName?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn("flex items-center justify-between text-sm", className)}
    >
      <ThemeIconToggle
        theme={theme}
        onToggle={toggleTheme}
        className={cn(
          "p-1.5 -m-1.5 max-lg:m-0 max-lg:p-3 max-lg:rounded-full max-lg:[&_svg]:size-6 transition-colors",
          toggleClassName,
        )}
      />
      <span>© {new Date().getFullYear()} Motion</span>
    </div>
  );
}

// Shared by login and register, so switching between them in the same
// visit doesn't replay the hero. Resets on a full reload.
let heroSeen = false;

// Split screen on large displays: brand panel left, form right.
// Phones first get the brand panel as a full-screen hero; tapping it fades
// the hero out and the form in.
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
  const [showHero, setShowHero] = useState(!heroSeen);

  const dismissHero = () => {
    heroSeen = true;
    setShowHero(false);
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-white dark:bg-zinc-900">
      {/* Brand panel: full-screen overlay on phones, left column on desktop.
          Once dismissed on phones it goes invisible after the fade so it
          drops out of the tab order and accessibility tree. */}
      <aside
        onClick={showHero ? dismissHero : undefined}
        className={`fixed inset-0 z-10 flex flex-col justify-between overflow-hidden p-8 sm:p-12 transition-[opacity,visibility] duration-500 lg:relative lg:inset-auto lg:z-auto lg:p-12 lg:visible lg:opacity-100 lg:transition-none ${
          showHero ? "" : "max-lg:invisible max-lg:opacity-0"
        } bg-gradient-to-br from-orange-500 via-orange-500 to-orange-700 text-white`}
      >
        {/* animated background: drifting blobs, a panning dot grid and
            slow rings, all in lighter shades of the orange */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
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
          <p className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
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

        <div className="relative flex flex-col gap-6">
          <div className="lg:hidden flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissHero();
              }}
              className="w-full rounded-xl bg-white px-6 py-3.5 font-semibold text-orange-600 shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get started
            </button>
            <p className="auth-hint text-sm text-orange-100/90">
              or tap anywhere to continue
            </p>
          </div>
          <ThemeCopyright
            className="text-orange-100/80"
            toggleClassName="hover:text-white max-lg:text-white max-lg:bg-white/15 max-lg:active:bg-white/25"
          />
        </div>
      </aside>

      {/* Form: hidden behind the hero on phones until it's dismissed */}
      <main
        className={`flex flex-col max-lg:min-h-dvh transition-[opacity,translate] duration-500 delay-150 lg:opacity-100 lg:translate-y-0 lg:visible ${
          showHero
            ? "max-lg:invisible max-lg:opacity-0 max-lg:translate-y-4"
            : ""
        }`}
      >
        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10">
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
        </div>
        {/* the brand panel is hidden here on phones, so repeat the row in
            the screen's bottom corners */}
        <ThemeCopyright
          className="lg:hidden px-6 pb-6 sm:px-10 text-gray-400 dark:text-gray-500"
          toggleClassName="text-gray-700 bg-gray-100 active:bg-gray-200 dark:text-gray-200 dark:bg-zinc-800 dark:active:bg-zinc-700"
        />
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
