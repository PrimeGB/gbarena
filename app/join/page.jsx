"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

const regionsByCountry = {
  Canada: [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Nova Scotia",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Northwest Territories",
    "Nunavut",
    "Yukon",
  ],
  "United States": [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
  Australia: [
    "Australian Capital Territory",
    "New South Wales",
    "Northern Territory",
    "Queensland",
    "South Australia",
    "Tasmania",
    "Victoria",
    "Western Australia",
  ],
  Ireland: ["Connacht", "Leinster", "Munster", "Ulster"],
  "New Zealand": [
    "Auckland",
    "Bay of Plenty",
    "Canterbury",
    "Gisborne",
    "Hawke's Bay",
    "Manawatu-Wanganui",
    "Marlborough",
    "Nelson",
    "Northland",
    "Otago",
    "Southland",
    "Taranaki",
    "Tasman",
    "Waikato",
    "Wellington",
    "West Coast",
  ],
  Mexico: [
    "Aguascalientes",
    "Baja California",
    "Baja California Sur",
    "Campeche",
    "Chiapas",
    "Chihuahua",
    "Coahuila",
    "Colima",
    "Durango",
    "Guanajuato",
    "Guerrero",
    "Hidalgo",
    "Jalisco",
    "Mexico City",
    "Michoacán",
    "Morelos",
    "Nayarit",
    "Nuevo León",
    "Oaxaca",
    "Puebla",
    "Querétaro",
    "Quintana Roo",
    "San Luis Potosí",
    "Sinaloa",
    "Sonora",
    "Tabasco",
    "Tamaulipas",
    "Tlaxcala",
    "Veracruz",
    "Yucatán",
    "Zacatecas",
  ],
  Brazil: [
    "Acre",
    "Alagoas",
    "Amapá",
    "Amazonas",
    "Bahia",
    "Ceará",
    "Distrito Federal",
    "Espírito Santo",
    "Goiás",
    "Maranhão",
    "Mato Grosso",
    "Mato Grosso do Sul",
    "Minas Gerais",
    "Pará",
    "Paraíba",
    "Paraná",
    "Pernambuco",
    "Piauí",
    "Rio de Janeiro",
    "Rio Grande do Norte",
    "Rio Grande do Sul",
    "Rondônia",
    "Roraima",
    "Santa Catarina",
    "São Paulo",
    "Sergipe",
    "Tocantins",
  ],
  France: [
    "Auvergne-Rhône-Alpes",
    "Bourgogne-Franche-Comté",
    "Brittany",
    "Centre-Val de Loire",
    "Corsica",
    "Grand Est",
    "Hauts-de-France",
    "Île-de-France",
    "Normandy",
    "Nouvelle-Aquitaine",
    "Occitanie",
    "Pays de la Loire",
    "Provence-Alpes-Côte d'Azur",
  ],
  Germany: [
    "Baden-Württemberg",
    "Bavaria",
    "Berlin",
    "Brandenburg",
    "Bremen",
    "Hamburg",
    "Hesse",
    "Lower Saxony",
    "Mecklenburg-Vorpommern",
    "North Rhine-Westphalia",
    "Rhineland-Palatinate",
    "Saarland",
    "Saxony",
    "Saxony-Anhalt",
    "Schleswig-Holstein",
    "Thuringia",
  ],
  Spain: [
    "Andalusia",
    "Aragon",
    "Asturias",
    "Balearic Islands",
    "Basque Country",
    "Canary Islands",
    "Cantabria",
    "Castile and León",
    "Castilla-La Mancha",
    "Catalonia",
    "Extremadura",
    "Galicia",
    "La Rioja",
    "Madrid",
    "Murcia",
    "Navarre",
    "Valencian Community",
  ],
  Italy: [
    "Abruzzo",
    "Aosta Valley",
    "Apulia",
    "Basilicata",
    "Calabria",
    "Campania",
    "Emilia-Romagna",
    "Friuli Venezia Giulia",
    "Lazio",
    "Liguria",
    "Lombardy",
    "Marche",
    "Molise",
    "Piedmont",
    "Sardinia",
    "Sicily",
    "Trentino-Alto Adige",
    "Tuscany",
    "Umbria",
    "Veneto",
  ],
  Japan: [
    "Hokkaido",
    "Tohoku",
    "Kanto",
    "Chubu",
    "Kansai",
    "Chugoku",
    "Shikoku",
    "Kyushu",
    "Okinawa",
  ],
  "South Korea": [
    "Seoul",
    "Busan",
    "Daegu",
    "Incheon",
    "Gwangju",
    "Daejeon",
    "Ulsan",
    "Gyeonggi",
    "Gangwon",
    "Chungbuk",
    "Chungnam",
    "Jeonbuk",
    "Jeonnam",
    "Gyeongbuk",
    "Gyeongnam",
    "Jeju",
  ],
  India: [
    "Andhra Pradesh",
    "Assam",
    "Bihar",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Punjab",
    "Rajasthan",
    "Tamil Nadu",
    "Telangana",
    "Uttar Pradesh",
    "West Bengal",
  ],
  "South Africa": [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape",
  ],
  Other: ["Other / Not Listed"],
};

const countries = Object.keys(regionsByCountry);

const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function JoinPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");

  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");

  const [usernameStatus, setUsernameStatus] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementScrolled, setAgreementScrolled] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const dayOptions = Array.from({ length: 31 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  const regionOptions = country ? regionsByCountry[country] || [] : [];

  useEffect(() => {
    const checkUsername = async () => {
      const cleanUsername = username.trim();

      setUsernameStatus("");

      if (cleanUsername.length < 3) return;

      setCheckingUsername(true);

      const { data } = await supabase
        .from("profiles")
        .select("username")
        .ilike("username", cleanUsername)
        .maybeSingle();

      setUsernameStatus(data ? "taken" : "available");
      setCheckingUsername(false);
    };

    const timer = setTimeout(checkUsername, 450);
    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    const checkEmail = async () => {
      const cleanEmail = email.trim().toLowerCase();

      setEmailStatus("");

      if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) return;

      setCheckingEmail(true);

      const { data } = await supabase
        .from("profiles")
        .select("email")
        .ilike("email", cleanEmail)
        .maybeSingle();

      setEmailStatus(data ? "taken" : "available");
      setCheckingEmail(false);
    };

    const timer = setTimeout(checkEmail, 450);
    return () => clearTimeout(timer);
  }, [email]);

  async function validateBeforeAgreement() {
    setLoading(true);
    setError("");
    setSuccess(false);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCountry = country.trim();
    const cleanRegion = region.trim();

    if (
      !cleanUsername ||
      !cleanEmail ||
      !password ||
      !confirmPassword ||
      !birthMonth ||
      !birthDay ||
      !birthYear ||
      !cleanCountry ||
      !cleanRegion
    ) {
      setError(
        "Please fill out username, email, password, confirm password, date of birth, country, and region."
      );
      setLoading(false);
      return;
    }

    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      setLoading(false);
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("username")
      .ilike("username", cleanUsername)
      .maybeSingle();

    if (existingUsername) {
      setError("That username is already taken.");
      setUsernameStatus("taken");
      setLoading(false);
      return;
    }

    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("email")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (existingEmail) {
      setError("That email is already in use.");
      setEmailStatus("taken");
      setLoading(false);
      return;
    }

    setAgreementScrolled(false);
    setShowAgreement(true);
    setLoading(false);
  }

  async function createAccountAfterAgreement() {
    setLoading(true);
    setError("");
    setSuccess(false);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCountry = country.trim();
    const cleanRegion = region.trim();
    const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`;

    const { data, error: signupError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
          display_name: cleanUsername,
          date_of_birth: dateOfBirth,
          country: cleanCountry,
          location: cleanRegion,
          agreed_to_rules: true,
          agreed_to_rules_at: new Date().toISOString(),
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setShowAgreement(false);
      setLoading(false);
      return;
    }

    if (!data.user?.id) {
      setError("Account could not be created. Try again.");
      setShowAgreement(false);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        username: cleanUsername,
        email: cleanEmail,
        date_of_birth: dateOfBirth,
        country: cleanCountry,
        location: cleanRegion,
        agreed_to_rules: true,
        agreed_to_rules_at: new Date().toISOString(),
        xbox_gt: null,
        psn_gt: null,
        nintendo_gt: null,
        pc_gt: null,
      },
    ]);

    if (profileError) {
      setError("That username or email is already in use.");
      setShowAgreement(false);
      setLoading(false);
      return;
    }

    setShowAgreement(false);
    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 1600);
  }

  return (
    <>
      <style>{`
        *{
          margin:0;
          padding:0;
          box-sizing:border-box;
        }

        body{
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{
          text-decoration:none;
        }

        .join-page{
          min-height:100vh;
          background:
            radial-gradient(circle at center, rgba(20,70,115,.34), transparent 46%),
            #000;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:24px;
        }

        .join-box{
          width:820px;
          background:#07111b;
          border:1px solid #4b95d8;
          box-shadow:
            0 0 34px rgba(0,90,160,.65),
            inset 0 0 28px rgba(0,0,0,.8);
        }

        .join-header{
          min-height:108px;
          background:linear-gradient(to bottom,#184368,#07111b);
          border-bottom:2px solid #4b95d8;
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
          padding:0 32px;
        }

        .logo-main{
          color:#f4f8ff;
          font-size:52px;
          font-weight:bold;
          font-style:italic;
          text-transform:uppercase;
          line-height:50px;
          text-shadow:0 2px 4px #000;
        }

        .logo-sub{
          color:#67bdff;
          font-size:13px;
          font-weight:bold;
          letter-spacing:3px;
          text-transform:uppercase;
          margin-top:9px;
        }

        .join-title{
          min-height:50px;
          background:linear-gradient(to bottom,#205077,#0a1724);
          border-top:1px solid rgba(255,255,255,.08);
          border-bottom:1px solid #2f638f;
          display:flex;
          align-items:center;
          padding-left:34px;
          color:#f2c14e;
          font-size:19px;
          font-weight:bold;
          text-transform:uppercase;
          text-shadow:0 1px 2px #000;
        }

        .join-body{
          padding:28px 40px 24px;
        }

        .join-note{
          color:#cfe2f2;
          font-size:16px;
          line-height:26px;
          margin-bottom:22px;
        }

        .join-label{
          display:block;
          color:#f2c14e;
          font-size:14px;
          font-weight:bold;
          text-transform:uppercase;
          margin-bottom:8px;
        }

        .username-warning{
          color:#ff7777;
          font-size:13px;
          font-weight:bold;
          text-transform:none;
        }

        .status{
          margin-top:-10px;
          margin-bottom:14px;
          font-size:14px;
          font-weight:bold;
        }

        .available{
          color:#00ff88;
        }

        .taken{
          color:#ff5555;
        }

        .checking{
          color:#8cccff;
        }

        .join-input,
        .join-select{
          width:100%;
          height:54px;
          background:#000;
          border:1px solid #4b95d8;
          color:#fff;
          padding:0 16px;
          margin-bottom:18px;
          font-size:16px;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          outline:none;
        }

        .join-input.good{
          border-color:#00ff88;
          box-shadow:0 0 12px rgba(0,255,136,.45);
        }

        .join-input.bad{
          border-color:#ff5555;
          box-shadow:0 0 12px rgba(255,85,85,.45);
        }

        .join-input::placeholder{
          color:#7891a8;
        }

        .join-input:focus,
        .join-select:focus{
          border-color:#8cccff;
          box-shadow:0 0 12px rgba(127,192,255,.65);
        }

        .form-row{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px;
        }

        .dob-row{
          display:grid;
          grid-template-columns:1.3fr .8fr .9fr;
          gap:10px;
        }

        .join-button{
          width:100%;
          height:56px;
          background:linear-gradient(to bottom,#d60000,#700000);
          border:1px solid #ff4b4b;
          color:#fff;
          font-weight:bold;
          text-transform:uppercase;
          cursor:pointer;
          font-size:17px;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          text-shadow:0 1px 2px #000;
          margin-top:6px;
        }

        .join-button:hover{
          background:linear-gradient(to bottom,#f00000,#870000);
        }

        .join-button:disabled{
          opacity:.6;
          cursor:not-allowed;
        }

        .error{
          color:#ff7777;
          font-size:15px;
          margin-top:16px;
          line-height:23px;
          font-weight:bold;
        }

        .success{
          color:#00ff88;
          font-size:15px;
          margin-top:16px;
          line-height:23px;
          font-weight:bold;
        }

        .bottom-links{
          margin-top:22px;
          padding-top:18px;
          border-top:1px solid #1f3e58;
          display:grid;
          grid-template-columns:1fr auto 1fr;
          align-items:center;
          gap:18px;
          font-size:15px;
        }

        .bottom-links a{
          color:#8cccff;
          font-weight:bold;
        }

        .bottom-links a:hover{
          color:#f2c14e;
        }

        .bottom-left{
          text-align:left;
        }

        .bottom-middle{
          text-align:center;
        }

        .bottom-right{
          text-align:right;
        }

        .agreement-overlay{
          position:fixed;
          inset:0;
          background:rgba(0,0,0,.82);
          display:flex;
          align-items:center;
          justify-content:center;
          z-index:9999;
          padding:24px;
        }

        .agreement-box{
          width:820px;
          max-width:100%;
          max-height:90vh;
          background:#07111b;
          border:1px solid #4b95d8;
          box-shadow:0 0 40px rgba(0,100,180,.75);
          display:flex;
          flex-direction:column;
        }

        .agreement-header{
          background:linear-gradient(to bottom,#205077,#0a1724);
          border-bottom:1px solid #4b95d8;
          padding:18px 24px;
          color:#f2c14e;
          font-size:20px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .agreement-scroll{
          padding:24px;
          overflow-y:auto;
          max-height:58vh;
          color:#d7e2ee;
          font-size:14px;
          line-height:23px;
        }

        .agreement-scroll h3{
          color:#f2c14e;
          margin:18px 0 8px;
          font-size:16px;
        }

        .agreement-scroll p{
          margin-bottom:12px;
        }

        .agreement-scroll ul{
          padding-left:22px;
          margin-bottom:14px;
        }

        .agreement-actions{
          border-top:1px solid #1f3e58;
          padding:18px 24px;
          display:flex;
          justify-content:space-between;
          gap:14px;
        }

        .agreement-cancel,
        .agreement-accept{
          height:46px;
          padding:0 22px;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          font-weight:bold;
          text-transform:uppercase;
          cursor:pointer;
        }

        .agreement-cancel{
          background:#0b1724;
          border:1px solid #4b95d8;
          color:#8cccff;
        }

        .agreement-accept{
          background:linear-gradient(to bottom,#d60000,#700000);
          border:1px solid #ff4b4b;
          color:#fff;
        }

        .agreement-accept:disabled{
          opacity:.55;
          cursor:not-allowed;
        }

        .scroll-note{
          color:#ff7777;
          font-size:13px;
          font-weight:bold;
          margin-top:8px;
        }

        @media(max-width:780px){
          .join-box{
            width:100%;
          }

          .logo-main{
            font-size:40px;
            line-height:40px;
          }

          .logo-sub{
            font-size:11px;
          }

          .join-body{
            padding:24px;
          }

          .form-row,
          .dob-row{
            grid-template-columns:1fr;
            gap:0;
          }

          .bottom-links{
            grid-template-columns:1fr;
            text-align:center;
          }

          .bottom-left,
          .bottom-middle,
          .bottom-right{
            text-align:center;
          }

          .agreement-actions{
            flex-direction:column;
          }
        }
      `}</style>

      <main className="join-page">
        <section className="join-box">
          <header className="join-header">
            <div>
              <div className="logo-main">GameBattles</div>
              <div className="logo-sub">Where Gaming Finds Its Edge</div>
            </div>
          </header>

          <div className="join-title">Create Account</div>

          <div className="join-body">
            <p className="join-note">
              Create your player account, lock in your username, choose your
              region, and get ready to build your profile, join teams, and
              compete on ladders.
            </p>

            <label className="join-label">
              Username{" "}
              <span className="username-warning">
                - This name will be displayed throughout the site and cannot be changed later.
              </span>
            </label>

            <input
              className={`join-input ${
                usernameStatus === "available"
                  ? "good"
                  : usernameStatus === "taken"
                  ? "bad"
                  : ""
              }`}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete="off"
            />

            {checkingUsername && username.trim().length >= 3 && (
              <div className="status checking">Checking username...</div>
            )}

            {!checkingUsername && usernameStatus === "available" && (
              <div className="status available">Username is available.</div>
            )}

            {!checkingUsername && usernameStatus === "taken" && (
              <div className="status taken">Username is already taken.</div>
            )}

            <label className="join-label">Email</label>

            <input
              className={`join-input ${
                emailStatus === "available"
                  ? "good"
                  : emailStatus === "taken"
                  ? "bad"
                  : ""
              }`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="off"
            />

            {checkingEmail && (
              <div className="status checking">Checking email...</div>
            )}

            {!checkingEmail && emailStatus === "available" && (
              <div className="status available">Email is available.</div>
            )}

            {!checkingEmail && emailStatus === "taken" && (
              <div className="status taken">Email is already in use.</div>
            )}

            <div className="form-row">
              <div>
                <label className="join-label">Password</label>

                <input
                  className="join-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="join-label">Confirm Password</label>

                <input
                  className={`join-input ${
                    confirmPassword.length > 0 && password === confirmPassword
                      ? "good"
                      : confirmPassword.length > 0 && password !== confirmPassword
                      ? "bad"
                      : ""
                  }`}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label className="join-label">Date of Birth</label>

                <div className="dob-row">
                  <select
                    className="join-select"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                  >
                    <option value="">Month</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>

                  <select
                    className="join-select"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                  >
                    <option value="">Day</option>
                    {dayOptions.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>

                  <select
                    className="join-select"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                  >
                    <option value="">Year</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="join-label">Country</label>

                <select
                  className="join-select"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setRegion("");
                  }}
                >
                  <option value="">Choose your country</option>
                  {countries.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                {country && (
                  <>
                    <label className="join-label">Region / Location</label>

                    <select
                      className="join-select"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    >
                      <option value="">Choose your region</option>
                      {regionOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>

            <button
              className="join-button"
              type="button"
              onClick={validateBeforeAgreement}
              disabled={
                loading ||
                usernameStatus === "taken" ||
                emailStatus === "taken" ||
                checkingUsername ||
                checkingEmail
              }
            >
              {loading ? "Checking Account..." : "Join GameBattles"}
            </button>

            {error && <div className="error">{error}</div>}

            {success && (
              <div className="success">
                Account created. Check your email if confirmation is required.
                Redirecting to login...
              </div>
            )}

            <div className="bottom-links">
              <div className="bottom-left">
                <a href="/login">Already have an account?</a>
              </div>

              <div className="bottom-middle">
                <a href="/disclaimer">Disclaimer</a>
              </div>

              <div className="bottom-right">
                <a href="/home">Back to Home</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showAgreement && (
        <div className="agreement-overlay">
          <div className="agreement-box">
            <div className="agreement-header">
              GameBattles Rules, Disclaimer, and User Agreement
            </div>

            <div
              className="agreement-scroll"
              onScroll={(e) => {
                const element = e.currentTarget;
                const atBottom =
                  element.scrollTop + element.clientHeight >=
                  element.scrollHeight - 12;

                if (atBottom) {
                  setAgreementScrolled(true);
                }
              }}
            >
              <p>
                Before creating your account, you must read and agree to the
                rules, disclaimer, and community expectations below. By clicking
                “I Agree,” you confirm that you understand these rules and agree
                to follow them while using this site.
              </p>

              <h3>1. General Community Rules</h3>
              <ul>
                <li>Respect other players, teams, staff, and community members.</li>
                <li>No harassment, bullying, hate speech, threats, stalking, or targeted abuse.</li>
                <li>No sexual content, sexual harassment, or inappropriate sexual messages.</li>
                <li>No racism, sexism, homophobia, religious hate, or attacks based on identity.</li>
                <li>No impersonating other players, staff, teams, sponsors, or platforms.</li>
                <li>No posting private information about yourself or others.</li>
                <li>No encouraging self-harm, violence, illegal activity, or dangerous behavior.</li>
                <li>No spam, scams, phishing, fake links, malicious links, or misleading posts.</li>
              </ul>

              <h3>2. Age and Location Rules</h3>
              <p>
                All ages are welcome to create an account and use community
                features. However, some features, tournaments, ladders, events,
                prizes, rewards, chats, or competitions may be age-restricted,
                location-restricted, or both. Your country, region, and date of
                birth may be used to decide which features or events you are
                allowed to access.
              </p>

              <h3>3. Account Rules</h3>
              <ul>
                <li>One account per person.</li>
                <li>No selling, buying, trading, lending, sharing, or giving away accounts.</li>
                <li>No creating extra accounts to avoid bans, suspensions, limits, or penalties.</li>
                <li>No fake information, fake identities, or pretending to be another player.</li>
                <li>You are responsible for keeping your login information safe.</li>
                <li>Do not give your password, email access, private information, or recovery details to anyone.</li>
              </ul>

              <h3>4. Fair Play Rules</h3>
              <ul>
                <li>No cheating, hacking, exploiting, boosting, match fixing, or manipulating results.</li>
                <li>No using unauthorized software, scripts, bots, macros, or tools to gain an unfair advantage.</li>
                <li>No abusing bugs, glitches, reporting systems, ladder systems, or tournament systems.</li>
                <li>No false match reports, fake screenshots, fake evidence, or dishonest disputes.</li>
                <li>Players and teams must follow match, ladder, tournament, and event rules.</li>
              </ul>

              <h3>5. Team, Match, and Prize Rules</h3>
              <p>
                Match results, ladder records, profile points, trophies, awards,
                badges, rankings, prizes, and rewards may be reviewed, adjusted,
                removed, delayed, denied, or reversed if cheating, abuse, rule
                breaking, fraud, false reporting, or suspicious behavior is
                found.
              </p>

              <h3>6. Moderation and Enforcement</h3>
              <p>
                We reserve the right to warn, mute, limit, restrict, suspend,
                delete, or permanently remove accounts, teams, posts, match
                results, trophies, awards, rankings, points, prizes, or access
                to site features when rules are broken or when we believe action
                is needed to protect the community, the site, or fair play.
              </p>

              <p>
                If enforcement action is taken, there may be an appeal system.
                Appeals do not guarantee that penalties will be removed. Abuse
                of the appeal system may lead to further restrictions.
              </p>

              <h3>7. Privacy and Safety</h3>
              <p>
                We will not sell your personal information. We will not share
                your personal information except when needed to operate the
                service, protect users, follow the law, prevent fraud, enforce
                rules, or provide account/security features.
              </p>

              <p>
                Do not share private information in public areas. Do not give
                out your address, passwords, payment information, personal
                documents, private messages, account recovery details, or other
                sensitive information to other users.
              </p>

              <h3>8. Security</h3>
              <p>
                We use security systems and account protections to help protect
                users and the site. No website can promise perfect security.
                You are responsible for using a strong password, protecting your
                email account, and reporting suspicious activity.
              </p>

              <h3>9. Content and Posting Rules</h3>
              <ul>
                <li>No illegal content.</li>
                <li>No stolen content.</li>
                <li>No copyrighted content unless you have permission to use it.</li>
                <li>No graphic sexual content.</li>
                <li>No threats, doxxing, blackmail, extortion, or harassment campaigns.</li>
                <li>No posting content meant to damage, exploit, or disrupt the site.</li>
              </ul>

              <h3>10. Disclaimer</h3>
              <p>
                This site is a community project inspired by old-school
                competitive gaming platforms. It is not affiliated with,
                sponsored by, endorsed by, or officially connected to any
                company, publisher, console platform, esports organization, or
                previous competitive gaming website unless clearly stated.
              </p>

              <p>
                Features, ladders, rankings, events, prizes, awards, badges,
                profiles, and site systems may change, pause, reset, or be
                removed at any time while the site is being built and improved.
              </p>

              <h3>11. Final Agreement</h3>
              <p>
                By clicking “I Agree,” you confirm that you have read this
                agreement, understand the rules, and agree to follow them. You
                also understand that breaking the rules may lead to account
                restrictions, loss of points, loss of awards, loss of prizes,
                suspension, deletion, or removal from the platform.
              </p>

              {!agreementScrolled && (
                <div className="scroll-note">
                  Scroll to the bottom to unlock the I Agree button.
                </div>
              )}
            </div>

            <div className="agreement-actions">
              <button
                className="agreement-cancel"
                type="button"
                onClick={() => {
                  setShowAgreement(false);
                  setAgreementScrolled(false);
                }}
              >
                Cancel
              </button>

              <button
                className="agreement-accept"
                type="button"
                disabled={!agreementScrolled || loading}
                onClick={createAccountAfterAgreement}
              >
                {loading ? "Creating Account..." : "I Agree - Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}