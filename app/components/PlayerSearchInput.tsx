"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Suggestion = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type Props = {
  name?: string;
  placeholder?: string;
  defaultValue?: string;
};

export default function PlayerSearchInput({ name = "q", placeholder, defaultValue = "" }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = value.trim().replace(/[%_,()]/g, "");
    if (term.length < 2) {
      queueMicrotask(() => setSuggestions([]));
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `${term}%`)
        .order("username")
        .limit(8);
      let rows = (data || []) as Suggestion[];

      if (rows.length < 8) {
        const { data: more } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .ilike("username", `%${term}%`)
          .order("username")
          .limit(8);
        const seen = new Set(rows.map((row) => row.id));
        rows = [...rows, ...((more || []) as Suggestion[]).filter((row) => !seen.has(row.id))].slice(0, 8);
      }

      if (!cancelled) {
        setSuggestions(rows);
        setActive(-1);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function onClickAway(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  function choose(suggestion: Suggestion) {
    setOpen(false);
    router.push(`/profile?userId=${suggestion.id}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && suggestions.length > 0;

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <input
        name={name}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: 34,
            left: 0,
            right: 0,
            zIndex: 50,
            margin: 0,
            padding: 0,
            listStyle: "none",
            background: "#07111b",
            border: "1px solid #3b7fc2",
            boxShadow: "0 8px 20px rgba(0,0,0,.6)",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(suggestion);
              }}
              onMouseEnter={() => setActive(index)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 10px",
                cursor: "pointer",
                color: "#f2c14e",
                fontWeight: "bold",
                fontSize: 13,
                background: index === active ? "#15324b" : "transparent",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  overflow: "hidden",
                  background: "#0f2a40",
                  display: "inline-grid",
                  placeItems: "center",
                  fontSize: 10,
                  color: "#7fc0ff",
                  flex: "none",
                }}
              >
                {suggestion.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={suggestion.avatar_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (suggestion.username || "?").slice(0, 2).toUpperCase()
                )}
              </span>
              {suggestion.username || "Unnamed Player"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
