export default function ProfileTeamsPage() {
  const teams = [];

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
          padding:18px;
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

        <div className="title-bar">My Teams</div>

        <div className="tabs">
          <a className="tab" href="/profile">Profile</a>
          <a className="tab active" href="/profile/teams">Teams</a>
          <a className="tab" href="/profile/matches">Matches</a>
          <a className="tab" href="/profile/photos">Photos</a>
          <a className="tab" href="/profile/friends">Friends</a>
        </div>

        <div className="box">
          <div className="box-title">Teams</div>

          <div className="box-body">
            {teams.length === 0 ? (
              <div className="empty-message">
                <strong>Looks lonely in here.</strong>
                Create or join a team to get started.
              </div>
            ) : null}
          </div>
        </div>

        <footer className="footer">
          © 2026 Competitive Gaming Network
        </footer>
      </div>
    </>
  );
}