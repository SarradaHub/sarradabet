const providers = [
  {
    id: "google",
    label: "Continuar com Google",
    href: "/api/v1/auth/oauth/google",
    className:
      "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200",
  },
  {
    id: "facebook",
    label: "Continuar com Facebook",
    href: "/api/v1/auth/oauth/facebook",
    className: "bg-[#1877F2] text-white hover:bg-[#166FE5]",
  },
] as const;

export function SocialLoginButtons() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        {providers.map((provider) => (
          <a
            key={provider.id}
            href={provider.href}
            className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${provider.className}`}
          >
            {provider.label}
          </a>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-sportsbook-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-sportsbook-surface px-2 text-sportsbook-muted">
            ou continue com
          </span>
        </div>
      </div>
    </div>
  );
}
