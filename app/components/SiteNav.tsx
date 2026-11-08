type SiteNavProps = {
  ladderHref?: string;
  tournamentHref?: string;
  showLadders?: boolean;
  profileFriendsHref?: string;
};

export default function SiteNav({
  ladderHref = "/ladders",
  tournamentHref = "/tournaments",
  showLadders = true,
  profileFriendsHref,
}: SiteNavProps) {
  const links = profileFriendsHref ? [
    { label: "Home", href: "/home" },
    { label: "Profile", href: "/profile", current: true },
    { label: "Teams", href: "/profile/teams" },
    { label: "Tournaments", href: tournamentHref },
    { label: "Friends", href: profileFriendsHref },
    { label: "Create a Team", href: "/teams/create" },
    { label: "Awards", href: "/profile/awards" },
    { label: "Forums", href: "/forums" },
    { label: "Find Players", href: "/players" },
    { label: "Recruit", href: "/recruit" },
    { label: "Support", href: "/support" },
  ] : [
    { label: "Home", href: "/home" },
    ...(showLadders ? [{ label: "Ladders", href: ladderHref }] : []),
    { label: "Tournaments", href: tournamentHref },
    { label: "Create a Team", href: "/teams/create" },
    { label: "Forums", href: "/forums" },
    { label: "Recruit", href: "/recruit" },
    { label: "Support", href: "/support" },
  ];

  return (
    <>
      <nav className={`site-nav-bar${profileFriendsHref ? " site-nav-profile" : ""}`} aria-label="Main">
        {links.map((link) => (
          <a key={link.label} href={link.href} aria-current={"current" in link && link.current ? "page" : undefined}>
            {link.label}
          </a>
        ))}
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
        .site-nav-profile a[aria-current="page"] {
          color: #67bfff;
          box-shadow: inset 0 -2px #4aa3ff;
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
