"use client";

import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { supabase } from "../../../lib/supabase";

type Player = { id: string; username: string };

export default function StaffPlayerPicker({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [results, setResults] = useState<Player[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState("");
  const listId = useId();

  useEffect(() => {
    const term = value.trim().replace(/[%_,()]/g, "");
    if (!open || term.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.from("profiles")
        .select("id, username").ilike("username", `%${term}%`).order("username").limit(8);
      if (cancelled) return;
      if (error) {
        setResults([]);
        setStatus(`Player search failed: ${error.message}`);
      } else {
        setResults((data || []).filter((player): player is Player => typeof player.username === "string"));
        setStatus(data?.length ? "" : "No players found.");
      }
      setActive(-1);
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [value, open]);

  function choose(player: Player) {
    onChange(player.username);
    setOpen(false);
    setResults([]);
    setStatus("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || !results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => index <= 0 ? results.length - 1 : index - 1);
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showResults = open && value.trim().length >= 2;
  return (
    <div className="staff-player-picker">
      <input
        role="combobox"
        aria-label="Find a player"
        aria-autocomplete="list"
        aria-expanded={showResults && results.length > 0}
        aria-controls={listId}
        aria-activedescendant={showResults && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        placeholder="Start typing a username..."
        onChange={(event) => {
          onChange(event.target.value);
          setResults([]);
          setStatus("");
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        required
      />
      {showResults && results.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Matching players">
          {results.map((player, index) => (
            <li
              key={player.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => { event.preventDefault(); choose(player); }}
              onMouseEnter={() => setActive(index)}
            >{player.username}</li>
          ))}
        </ul>
      )}
      {showResults && status && <p className="staff-player-status" role="status">{status}</p>}
    </div>
  );
}
