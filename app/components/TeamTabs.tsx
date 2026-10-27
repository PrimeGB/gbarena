export type TeamTabKey =
  | "team"
  | "roster"
  | "matches"
  | "edit-profile"
  | "edit-roster"
  | "tools"
  | "log";

type TeamTabsProps = {
  teamId: string;
  active: TeamTabKey;
  canEditProfile?: boolean;
  canEditRoster?: boolean;
};

export default function TeamTabs({
  teamId,
  active,
  canEditProfile = false,
  canEditRoster = false,
}: TeamTabsProps) {
  const base = `/teams/${teamId}`;

  const left: { key: TeamTabKey; label: string; href: string }[] = [
    { key: "team", label: "Team", href: base },
    { key: "roster", label: "Roster", href: `${base}#roster` },
    { key: "matches", label: "Matches", href: `${base}#matches` },
  ];

  const right: { key: TeamTabKey; label: string; href: string; show: boolean }[] = [
    { key: "edit-profile", label: "Edit Profile", href: `${base}/edit`, show: canEditProfile },
    { key: "edit-roster", label: "Edit Roster", href: `${base}/roster`, show: canEditRoster },
    { key: "tools", label: "Tools", href: `${base}/tools`, show: canEditProfile },
    { key: "log", label: "Log", href: `${base}/log`, show: canEditProfile },
  ];

  return (
    <>
      <div className="team-tabs">
        <div className="team-tabs-group">
          {left.map((tab) => (
            <a key={tab.key} href={tab.href} className={tab.key === active ? "on" : ""}>
              {tab.label}
            </a>
          ))}
        </div>
        <div className="team-tabs-group">
          {right
            .filter((tab) => tab.show)
            .map((tab) => (
              <a key={tab.key} href={tab.href} className={tab.key === active ? "on" : ""}>
                {tab.label}
              </a>
            ))}
        </div>
      </div>

      <style>{`
        .team-tabs {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 6px;
          margin: 12px 0;
        }
        .team-tabs-group {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .team-tabs a {
          padding: 7px 14px;
          border: 1px solid #2c3a4b;
          border-radius: 3px;
          background: #131c27;
          color: #c9d6e5;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }
        .team-tabs a:hover {
          border-color: #4a7db0;
          color: #fff;
        }
        .team-tabs a.on {
          background: #2a74b8;
          border-color: #3d8fd8;
          color: #fff;
        }
      `}</style>
    </>
  );
}
