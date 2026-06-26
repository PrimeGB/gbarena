function MatchFinderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser() as any;

  const platform = searchParams.get("platform") || "xbox";
  const category = searchParams.get("category") || "call-of-duty";
  const game = searchParams.get("game") || "modern-warfare-4";
  const ladder = searchParams.get("ladder") || "team";
  const viewerTeamId = searchParams.get("teamId") || "";

  const platformName = prettyText(platform);
  const gameName = prettyText(game);
  const gameImage = getGameImage(game);
  const ladderName = getLadderName(ladder);
  const rosterText = getRosterText(ladder);

  const createUrl = `/matches/create?teamId=${viewerTeamId}&platform=${platform}&category=${category}&game=${game}&ladder=${ladder}`;
  const viewTeamUrl = viewerTeamId ? `/teams/${viewerTeamId}` : "/profile/teams";
  const ladderUrl = `/ladders/${platform}/${category}/${game}/${ladder}/rankings`;

  const [matches, setMatches] = useState<MatchPost[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmMatch, setConfirmMatch] = useState<MatchPost | null>(null);
  const [viewMatch, setViewMatch] = useState<MatchPost | null>(null);
  const [cancelMatch, setCancelMatch] = useState<MatchPost | null>(null);
  const [viewerRole, setViewerRole] = useState<TeamRole>("member");

  const viewerCanManageMatches = canManageMatches(viewerRole);

  async function markOldPostsExpired(posts: MatchPost[]) {
    const expiredIds = posts
      .filter((post) => shouldHidePost(post))
      .map((post) => post.id);

    if (expiredIds.length === 0) return;

    await supabase
      .from("match_posts")
      .update({ status: "expired" })
      .in("id", expiredIds)
      .eq("status", "open");
  }

  async function loadMatches() {
    setPageError("");

    const { data, error } = await supabase
      .from("match_posts")
      .select("*")
      .eq("platform", platform)
      .eq("category", category)
      .eq("game", game)
      .eq("ladder", ladder)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      setPageError("Could not load match posts: " + error.message);
      setMatches([]);
      setHasLoaded(true);
      return;
    }

    const openPosts = (data || []) as MatchPost[];
    const visiblePosts = openPosts.filter((post) => !shouldHidePost(post));

    setMatches(visiblePosts);
    setHasLoaded(true);

    markOldPostsExpired(openPosts);
  }

  useEffect(() => {
    loadMatches();
  }, [platform, category, game, ladder]);

  useEffect(() => {
    async function loadViewerRole() {
      if (!viewerTeamId || !user?.id) {
        setViewerRole("member");
        return;
      }

      const { data } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", viewerTeamId)
        .eq("user_id", user.id)
        .maybeSingle();

      setViewerRole(normalizeRole(data?.role));
    }

    loadViewerRole();
  }, [viewerTeamId, user?.id]);

  async function acceptConfirmedMatch() {
    if (!confirmMatch) return;

    setNotice("");

    if (!user?.id) {
      setNotice("You must be signed in to accept this match.");
      return;
    }

    if (!viewerTeamId) {
      setNotice("Missing your team ID. Open Match Finder from your team page.");
      return;
    }

    if (!viewerCanManageMatches) {
      setNotice("Only leaders, co-leaders, and captains can accept matches.");
      setConfirmMatch(null);
      return;
    }

    if (String(confirmMatch.team_id) === String(viewerTeamId)) {
      setNotice("You cannot accept your own match post.");
      setConfirmMatch(null);
      return;
    }

    setAcceptingId(confirmMatch.id);

    const { data: currentRow } = await supabase
      .from("match_posts")
      .select("id, status")
      .eq("id", confirmMatch.id)
      .maybeSingle();

    if (!currentRow || currentRow.status !== "open") {
      setAcceptingId(null);
      setNotice("This match is no longer available.");
      setConfirmMatch(null);
      await loadMatches();
      return;
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "accept_match_post",
      {
        post_id: confirmMatch.id,
        accepting_team: viewerTeamId,
      }
    );

    setAcceptingId(null);
    setConfirmMatch(null);

    if (rpcError) {
      setNotice("Could not accept match: " + rpcError.message);
      await loadMatches();
      return;
    }

    const matchId = rpcData?.[0]?.match_id || rpcData?.match_id;

    if (!matchId) {
      setNotice("Match could not be created.");
      await loadMatches();
      return;
    }

    router.push(`/matches/${matchId}`);
  }

  async function cancelConfirmedPost() {
    if (!cancelMatch) return;

    setNotice("");

    if (!user?.id) {
      setNotice("You must be signed in to cancel this match post.");
      return;
    }

    if (!viewerTeamId) {
      setNotice("Missing your team ID.");
      return;
    }

    if (!viewerCanManageMatches) {
      setNotice("Only leaders, co-leaders, and captains can cancel matches.");
      setCancelMatch(null);
      return;
    }

    if (String(cancelMatch.team_id) !== String(viewerTeamId)) {
      setNotice("You can only cancel your own match posts.");
      setCancelMatch(null);
      return;
    }

    setCancellingId(cancelMatch.id);

    const { error } = await supabase
      .from("match_posts")
      .update({ status: "cancelled" })
      .eq("id", cancelMatch.id)
      .eq("status", "open");

    setCancellingId(null);

    if (error) {
      setNotice("Could not cancel match post: " + error.message);
      setCancelMatch(null);
      return;
    }

    setNotice("Match post cancelled.");
    setCancelMatch(null);
    await loadMatches();
  }

  return (
    <>
      {/* KEEP ALL YOUR EXISTING JSX BELOW EXACTLY AS IT WAS */}