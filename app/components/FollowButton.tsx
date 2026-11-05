"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../lib/useUser";

type FollowButtonProps = {
  targetType: "player" | "team";
  targetId: string;
  onChange?: (following: boolean) => void;
};

export default function FollowButton({
  targetType,
  targetId,
  onChange,
}: FollowButtonProps) {
  const { user, loading } = useUser();
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(async () => {
      if (!user?.id) {
        if (active) setFollowing(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("community_follows")
        .select("target_id")
        .eq("follower_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .maybeSingle();

      if (!active) return;
      if (loadError) {
        setError(loadError.message);
        return;
      }
      setFollowing(Boolean(data));
    });

    return () => {
      active = false;
    };
  }, [targetId, targetType, user?.id]);

  async function toggleFollow() {
    if (!user?.id || pending) return;

    setPending(true);
    setError("");
    const { data, error: followError } = await supabase.rpc(
      "gb_toggle_community_follow",
      { p_target_type: targetType, p_target_id: targetId }
    );
    setPending(false);

    if (followError) {
      setError(followError.message);
      return;
    }

    const nextFollowing = data === true;
    setFollowing(nextFollowing);
    onChange?.(nextFollowing);
  }

  if (loading) return null;

  return (
    <span className="gb-follow-wrap">
      {user?.id ? (
        <button
          className={`gb-follow-button${following ? " is-following" : ""}`}
          type="button"
          aria-pressed={following}
          disabled={pending}
          onClick={toggleFollow}
        >
          {pending ? "Updating..." : following ? "Following" : "+ Follow"}
        </button>
      ) : (
        <Link className="gb-follow-button" href="/login">
          Sign in to follow
        </Link>
      )}
      {error && <span className="gb-follow-error" role="alert">{error}</span>}
      <style>{`
        .gb-follow-wrap{display:inline-flex;align-items:center;gap:7px;flex-wrap:wrap}
        .gb-follow-button{display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:5px 11px;border:1px solid #4779a0;border-radius:999px;background:rgba(7,22,34,.86);color:#c6e5ff;font:700 11px Tahoma,Verdana,Arial,sans-serif;text-decoration:none;white-space:nowrap;cursor:pointer;transition:background .15s ease,border-color .15s ease,color .15s ease}
        .gb-follow-button:hover{border-color:#86c9ff;background:#12314a;color:#fff}
        .gb-follow-button.is-following{border-color:#536b7d;color:#d4e0e9;background:rgba(25,42,55,.8)}
        .gb-follow-button:disabled{opacity:.65;cursor:wait}
        .gb-follow-error{color:#ffb3b3;font-size:11px}
      `}</style>
    </span>
  );
}
