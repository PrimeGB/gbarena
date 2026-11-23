type SiteNavProps = {
  ladderHref?: string;
  tournamentHref?: string;
  showLadders?: boolean;
  profileNavigation?: boolean;
  extra?: React.ReactNode;
};

export default function SiteNav({
  ladderHref = "/ladders",
  tournamentHref = "/tournaments",
  showLadders = true,
  profileNavigation = false,
  extra,
}: SiteNavProps) {
  const links = profileNavigation ? [
    { label: "Tournaments", href: tournamentHref },
    { label: "Create a Team", href: "/teams/create" },
    { label: "Find Players", href: "/players" },
    { label: "Support / Contact", href: "/support" },
  ] : [
    ...(showLadders ? [{ label: "Ladders", href: ladderHref }] : []),
    { label: "Tournaments", href: tournamentHref },
    { label: "Create a Team", href: "/teams/create" },
    { label: "Forums", href: "/forums" },
    { label: "Recruit", href: "/recruit" },
    { label: "Support / Contact", href: "/support" },
  ];

  return (
    <>
      <nav className={`site-nav-bar${profileNavigation ? " site-nav-profile" : ""}`} aria-label="Main">
        {links.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
        {extra}
      </nav>

      <style>{`
        .site-nav-bar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 4px 12px;
          padding: 0 18px;
          background: #000;
          border-top: 1px solid #1d2b3a;
          border-bottom: 1px solid #1d2b3a;
        }
        .site-nav-bar a {
          padding: 8px 4px;
          color: #f2f6fb;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          text-decoration: none;
        }
        .site-nav-bar a:hover {
          color: #5bb8ff;
        }
        .site-nav-profile {
          gap: 0 8px;
          padding: 0 12px;
        }
        .site-nav-profile a {
          padding: 11px 3px;
          white-space: nowrap;
        }
        @media (max-width: 700px) {
          .site-nav-profile {
            justify-content: center;
            gap: 0 12px;
            padding: 4px 10px;
          }
          .site-nav-profile a {
            padding: 9px 3px;
          }
        }
      `}</style>
    </>
  );
}
