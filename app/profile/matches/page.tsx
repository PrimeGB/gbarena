export default function ProfileMatchesPage() {
  const matches = [
    {
      teamName: "Nova Elite",
      platform: "Xbox",
      result: "Win",
      xp: "+125 XP",
      opponent: "Ghost Ops",
      date: "Today",
    },
    {
      teamName: "Nova Elite",
      platform: "PlayStation",
      result: "Loss",
      xp: "-40 XP",
      opponent: "Toxic Gaming",
      date: "Yesterday",
    },
    {
      teamName: "Ghost Ops",
      platform: "PC",
      result: "Win",
      xp: "+95 XP",
      opponent: "Zero Hour",
      date: "This Week",
    },
  ];

  return (
    <>
      <style>{`
        body{
          margin:0;
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{
          text-decoration:none;
        }

        .wrapper{
          width:1040px;
          margin:0 auto;
        }

        .top-strip{
          height:22px;
          background:linear-gradient(to bottom,#c40000,#6a0000);
          border-bottom:1px solid #140000;
          display:flex;
          justify-content:flex-end;
          align-items:center;
          padding:0 12px;
        }

        .top-strip a{
          color:#fff;
          font-size:10px;
          font-weight:bold;
          margin-left:12px;
        }

        .header{
          height:86px;
          background:#0a1622;
          border-left:1px solid #3b7fc2;
          border-right:1px solid #3b7fc2;
          border-bottom:2px solid #4f93d6;
          display:flex;
          align-items:center;
          padding:0 14px;
        }

        .logo-main{
          font-size:28px;
          font-weight:bold;
          color:#eaf5ff;
        }

        .logo-sub{
          color:#f2c14e;
          font-size:10px;
          text-transform:uppercase;
          margin-top:4px;
        }

        .title-bar{
          margin-top:8px;
          height:34px;
          background:linear-gradient(to bottom,#1f4c73,#0b2438);
          border:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          padding-left:10px;
          color:#f2c14e;
          font-size:15px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .tabs{
          height:28px;
          background:#07111b;
          border-left:1px solid #3b7fc2;
          border-right:1px solid #3b7fc2;
          border-bottom:1px solid #3b7fc2;
          display:flex;
          align-items:flex-end;
          padding-left:8px;
        }

        .tab{
          height:22px;
          padding:5px 12px 0;
          background:#0f2a40;
          border:1px solid #3b7fc2;
          border-bottom:none;
          color:#d7eaff;
          font-size:10px;
          margin-right:4px;
        }

        .tab.active{
          background:#173b59;
          color:#fff;
          font-weight:bold;
        }

        .box{
          background:#07111b;
          border:1px solid #3b7fc2;
          margin-top:8px;
        }

        .box-title{
          height:23px;
          background:linear-gradient(to bottom,#1f4c73,#0b2438);
          border-bottom:1px solid #3b7fc2;
          color:#f2c14e;
          font-weight:bold;
          font-size:10px;
          text-transform:uppercase;
          display:flex;
          align-items:center;
          padding-left:8px;
        }

        .box-body{
          padding:8px;
        }

        .match-table{
          width:100%;
          border-collapse:collapse;
        }

        .match-table th{
          background:#0a1622;
          color:#f2c14e;
          font-size:10px;
          text-transform:uppercase;
          border-bottom:1px solid #3b7fc2;
          padding:8px;
          text-align:left;
        }

        .match-table td{
          border-bottom:1px solid #13293d;
          padding:8px;
          font-size:10px;
          color:#d7eaff;
        }

        .match-table tr:hover{
          background:#12324b;
        }

        .win{
          color:#00ff88;
          font-weight:bold;
        }

        .loss{
          color:#ff6b6b;
          font-weight:bold;
        }

        .xp-positive{
          color:#00ff88;
          font-weight:bold;
        }

        .xp-negative{
          color:#ff6b6b;
          font-weight:bold;
        }

        .empty-message{
          text-align:center;
          padding:30px;
          color:#d7eaff;
          font-size:13px;
        }

        .empty-message strong{
          display:block;
          color:#f2c14e;
          font-size:16px;
          margin-bottom:8px;
        }

        .footer{
          margin-top:8px;
          height:26px;
          background:#0a1622;
          border:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:10px;
        }
      `}</style>

      <div className="top-strip">
        <a href="/">Home</a>
        <a href="/profile">My Profile</a>
      </div>

      <div className="wrapper">
        <header className="header">
          <div>
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">Where Gaming Finds Its Edge</div>
          </div>
        </header>

        <div className="title-bar">My Matches</div>

        <div className="tabs">
          <a className="tab" href="/profile">Profile</a>
          <a className="tab" href="/profile/teams">Teams</a>
          <a className="tab active" href="/profile/matches">Matches</a>
          <a className="tab" href="/profile/photos">Photos</a>
          <a className="tab" href="/profile/friends">Friends</a>
        </div>

        <div className="box">
          <div className="box-title">Recent Matches</div>

          <div className="box-body">
            {matches.length === 0 ? (
              <div className="empty-message">
                <strong>No matches yet.</strong>
                Join a ladder or tournament to start building your record.
              </div>
            ) : (
              <table className="match-table">
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Opponent</th>
                    <th>Platform</th>
                    <th>Result</th>
                    <th>XP</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {matches.map((match) => (
                    <tr key={`${match.teamName}-${match.opponent}-${match.date}`}>
                      <td>{match.teamName}</td>
                      <td>{match.opponent}</td>
                      <td>{match.platform}</td>
                      <td className={match.result === "Win" ? "win" : "loss"}>
                        {match.result}
                      </td>
                      <td className={match.xp.startsWith("+") ? "xp-positive" : "xp-negative"}>
                        {match.xp}
                      </td>
                      <td>{match.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <footer className="footer">
          © 2026 Competitive Gaming Network
        </footer>
      </div>
    </>
  );
}