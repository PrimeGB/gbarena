type SiteNavProps = {
  ladderHref?: string;
};

export default function SiteNav({ ladderHref = "/ladders/xbox" }: SiteNavProps) {
  const links = [
    { label: "Home", href: "/home" },
    { label: "Ladders", href: ladderHref },
    { label: "Tournaments", href: "/coming-soon" },
    { label: "Create a Team", href: "/teams/create" },
    { label: "Forums", href: "/forums" },
    { label: "Leaderboards", href: "/teams/top" },
    { label: "Support", href: "/support" },
  ];

  return (
    <>
      <nav className="site-nav-bar" aria-label="Main">
        {links.map((link) => (
          <a key={link.label} href={link.href}>
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
      `}</style>
    </>
  );
}
