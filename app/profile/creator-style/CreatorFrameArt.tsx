import { type CreatorTheme } from "@/lib/creatorProfileStyles";

export default function CreatorFrameArt({ theme }: { theme: CreatorTheme }) {
  if (theme === "classic") return null;
  return <svg className="creator-frame-art" viewBox="0 0 360 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {theme === "gold" && <g fill="currentColor">
      <path opacity=".2" d="M170 8 178 23 196 26 183 38 186 56 170 47 154 56 157 38 144 26 162 23Z" />
      <path opacity=".32" d="M134 15Q112 32 122 67Q127 83 145 95Q127 91 116 75Q102 51 115 26L107 32Q97 55 107 76Q119 97 145 102L148 96Q130 84 127 66Q123 37 140 18Z" />
      <path opacity=".32" d="M206 15Q228 32 218 67Q213 83 195 95Q213 91 224 75Q238 51 225 26L233 32Q243 55 233 76Q221 97 195 102L192 96Q210 84 213 66Q217 37 200 18Z" />
      <path opacity=".18" d="M15 140 69 102 121 102 65 140ZM325 140 271 102 219 102 275 140Z" />
    </g>}
    {theme === "ice" && <g fill="none" stroke="currentColor">
      <path opacity=".4" strokeWidth="2" d="M240 4 222 29 234 43 203 71 225 77 207 113 236 103 247 136 258 104 290 113 275 82 304 70 274 48 286 26 257 30Z" />
      <path opacity=".24" strokeWidth="1.5" d="M240 4 247 136M203 71 304 70M222 29 275 82M286 26 225 77M207 113 274 48" />
      <path opacity=".3" strokeWidth="3" d="M5 141 87 70 105 70 26 141M36 141 117 70 125 70 52 141" />
    </g>}
    {theme === "inferno" && <g fill="currentColor">
      <path opacity=".25" d="M354 0 265 0 191 150 232 150 264 86 274 98 286 65 296 76ZM273 0 258 0 182 150 195 150Z" />
      <path opacity=".35" d="M19 150 89 30 81 87 117 61 74 150ZM106 150 146 86 139 125 160 110 142 150Z" />
      <circle cx="142" cy="28" r="3" opacity=".5" /><circle cx="117" cy="48" r="2" opacity=".5" /><circle cx="167" cy="44" r="2" opacity=".5" />
    </g>}
    {theme === "legacy" && <g fill="none" stroke="currentColor">
      <path opacity=".34" strokeWidth="8" d="M345 0 278 0 205 73 205 150M360 16 293 16 222 85 222 150" />
      <path opacity=".28" strokeWidth="2" d="M5 8H100L131 39H181M5 17H93L124 48H181M5 141H111L143 109H181" />
      <circle cx="16" cy="26" r="4" opacity=".6" /><circle cx="16" cy="130" r="4" opacity=".6" /><circle cx="335" cy="128" r="4" opacity=".6" />
    </g>}
    {theme === "viper" && <g fill="none" stroke="currentColor" strokeWidth="2">
      <path opacity=".36" d="M0 20H80L101 41H151L170 60H219M0 54H60L82 76H133L153 96H233M0 126H70L93 103H137M360 20H291L271 40H230M360 119H291L269 97H241" />
      <g fill="currentColor" opacity=".45"><circle cx="151" cy="41" r="4" /><circle cx="219" cy="60" r="4" /><circle cx="233" cy="96" r="4" /><circle cx="230" cy="40" r="4" /><circle cx="137" cy="103" r="4" /></g>
      <path opacity=".23" d="M252 63 266 55 280 63 280 79 266 87 252 79ZM282 81 296 73 310 81 310 97 296 105 282 97Z" />
    </g>}
    {theme === "eclipse" && <g fill="none" stroke="currentColor">
      <ellipse opacity=".3" cx="241" cy="76" rx="72" ry="49" strokeWidth="2" transform="rotate(-24 241 76)" />
      <ellipse opacity=".19" cx="241" cy="76" rx="105" ry="65" transform="rotate(19 241 76)" />
      <circle opacity=".18" cx="241" cy="76" r="34" strokeWidth="10" />
      <path opacity=".4" d="M75 26v14m-7-7h14M130 90v10m-5-5h10M305 21v12m-6-6h12M323 118v14m-7-7h14" strokeWidth="2" />
    </g>}
    {theme === "champion" && <g fill="currentColor">
      <path opacity=".25" d="M0 0H120L77 36H0ZM360 150H240L283 114H360Z" />
      <path opacity=".38" d="M149 22 169 34 189 22 185 63 169 76 153 63ZM155 31 159 60 169 68 179 60 183 31 169 40Z" />
      <path opacity=".23" d="M46 150 115 81 124 81 55 150ZM76 150 145 81 151 81 82 150ZM220 0 289 69 296 69 227 0Z" />
    </g>}
    {theme === "sovereign" && <g fill="none" stroke="currentColor">
      <path opacity=".32" strokeWidth="3" d="M180 18 204 31 226 27 219 68 180 91 141 68 134 27 156 31Z" />
      <path opacity=".42" strokeWidth="2" d="M146 54Q116 43 112 72Q110 94 145 113M214 54Q244 43 248 72Q250 94 215 113" />
      <path opacity=".4" strokeWidth="2" d="m160 43 7-13 13 9 13-9 7 13-20 13Z" />
      <path opacity=".22" strokeWidth="7" d="M108 127H252" />
    </g>}
    {theme === "aftershock" && <g fill="currentColor">
      <path opacity=".4" d="m222 6-84 81h48l-33 58 112-105h-51l25-34Z" />
      <path opacity=".28" d="M25 135 94 67h20l-68 68ZM53 148l60-60h13l-48 60Z" />
      <path opacity=".5" d="M283 19h28v4h-28zM297 7h4v28h-4zM72 30h18v3H72zM80 22h3v19h-3z" />
    </g>}
    {theme === "rival" && <g fill="none" stroke="currentColor">
      <path opacity=".35" strokeWidth="3" d="m186 10 54 15-12 57-46 36-46-36-12-57 54-15Z" />
      <path opacity=".45" strokeWidth="5" d="M240 24 120 126M272 26 170 142M328 10 221 116" />
      <path opacity=".28" strokeWidth="2" d="M27 29h63M58 14v31M284 124h48M308 100v48" />
    </g>}
    {theme === "spotlight" && <g fill="none" stroke="currentColor">
      <circle opacity=".33" strokeWidth="2" cx="239" cy="73" r="44" />
      <circle opacity=".18" strokeWidth="12" cx="239" cy="73" r="67" />
      <path opacity=".4" strokeWidth="2" d="M239 4v25M239 117v25M170 73h25M283 73h25M190 24l18 18M270 104l18 18M288 24l-18 18M208 104l-18 18" />
      <path opacity=".26" strokeWidth="7" d="M18 127 96 49M44 145 126 63" />
    </g>}
  </svg>;
}
