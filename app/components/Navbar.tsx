export default function Navbar() {

  return (

    <div

      style={{

        display: "flex",

        justifyContent: "space-between",

        padding: "15px 30px",

        background: "#111",

        color: "white",

        alignItems: "center",

      }}

    >

      <div style={{ fontWeight: "bold" }}>GameBattles</div>

      <div style={{ display: "flex", gap: "20px" }}>

        <span>Home</span>

        <span>Matches</span>

        <span>Leaderboard</span>

        <span>Profile</span>

      </div>

    </div>

  );

}