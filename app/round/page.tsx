'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useTournamentStore, getPlayerById, getCourtById, getTeamByPlayerIds, FORMAT_LABELS } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronRight, Check, Timer, Coffee, Pencil, Share2, Loader2 } from 'lucide-react'
import type { Match, Tournament } from '@/lib/store'

function ScoreInput({
  value,
  onChange,
  maxPoints,
  disabled
}: {
  value: number
  onChange: (value: number) => void
  maxPoints: number
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
        className={cn(
          'w-10 h-10 rounded-lg font-bold text-xl transition-colors',
          'bg-secondary text-foreground hover:bg-secondary/80',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        -
      </button>
      <span className="w-12 text-center text-2xl font-bold tabular-nums text-foreground">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(maxPoints, value + 1))}
        disabled={disabled || value >= maxPoints}
        className={cn(
          'w-10 h-10 rounded-lg font-bold text-xl transition-colors',
          'bg-secondary text-foreground hover:bg-secondary/80',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        +
      </button>
    </div>
  )
}

function MatchCard({
  match,
  tournament,
  roundNumber,
  onScoreUpdate,
  onEdit,
}: {
  match: Match
  tournament: Tournament
  roundNumber: number
  onScoreUpdate: (matchId: string, team1Points: number, team2Points: number) => void
  onEdit: (matchId: string) => void
}) {
  const court = getCourtById(tournament, match.courtId)
  const isTeamFormat = tournament.config.format === 'team-americano' || tournament.config.format === 'team-mexicano'
  const maxPoints = tournament.config.pointsPerMatch

  const team1 = isTeamFormat ? getTeamByPlayerIds(tournament, match.team1) : null
  const team2 = isTeamFormat ? getTeamByPlayerIds(tournament, match.team2) : null
  const team1Players = match.team1.map(id => getPlayerById(tournament, id))
  const team2Players = match.team2.map(id => getPlayerById(tournament, id))

  const [isConfirmed, setIsConfirmed] = useState(!!match.score)
  const [team1Score, setTeam1Score] = useState(match.score?.team1Points ?? 0)
  const [team2Score, setTeam2Score] = useState(match.score?.team2Points ?? 0)

  useEffect(() => {
    if (match.score) {
      setIsConfirmed(true)
      setTeam1Score(match.score.team1Points)
      setTeam2Score(match.score.team2Points)
    }
  }, [match.score])

  const handleTeam1Change = (value: number) => {
    setTeam1Score(value)
    setTeam2Score(maxPoints - value)
  }

  const handleTeam2Change = (value: number) => {
    setTeam2Score(value)
    setTeam1Score(maxPoints - value)
  }

  const handleConfirm = () => {
    onScoreUpdate(match.id, team1Score, team2Score)
    setIsConfirmed(true)
  }

  const handleEdit = () => {
    setIsConfirmed(false)
    onEdit(match.id)
  }

  return (
    <Card className={cn(
      'p-4 border-border bg-card transition-colors',
      isConfirmed && 'border-primary/50 bg-primary/5'
    )}>
      {/* Court Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">{court?.name || 'Court'}</h3>
        {isConfirmed && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
              <Check className="w-3 h-3 mr-1" />
              Confirmed
            </Badge>
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Teams & Scores */}
      <div className="space-y-4">
        {/* Team 1 */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            {isTeamFormat && team1 ? (
              <div>
                <p className="font-semibold text-foreground text-sm">{team1.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {team1Players.map(p => p?.name ?? 'Unknown').join(' & ')}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {team1Players.map((player, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-secondary text-foreground text-sm px-2 py-1"
                  >
                    {player?.name || 'Unknown'}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <ScoreInput
            value={team1Score}
            onChange={handleTeam1Change}
            maxPoints={maxPoints}
            disabled={isConfirmed}
          />
        </div>

        {/* VS Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-medium text-muted-foreground">VS</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Team 2 */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            {isTeamFormat && team2 ? (
              <div>
                <p className="font-semibold text-foreground text-sm">{team2.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {team2Players.map(p => p?.name ?? 'Unknown').join(' & ')}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {team2Players.map((player, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-secondary text-foreground text-sm px-2 py-1"
                  >
                    {player?.name || 'Unknown'}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <ScoreInput
            value={team2Score}
            onChange={handleTeam2Change}
            maxPoints={maxPoints}
            disabled={isConfirmed}
          />
        </div>
      </div>

      {/* Confirm Button */}
      {!isConfirmed && (
        <Button
          onClick={handleConfirm}
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirm Score
        </Button>
      )}
    </Card>
  )
}

function RoundTimer({ minutes }: { minutes: number }) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return
    const interval = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, secondsLeft])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const isLow = secondsLeft < 60

  return (
    <button
      onClick={() => setIsRunning(!isRunning)}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
        isLow ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-foreground',
        !isRunning && 'opacity-70'
      )}
    >
      <Timer className="w-4 h-4" />
      <span className="font-mono font-semibold tabular-nums">
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </span>
    </button>
  )
}

function ByeSection({ playerIds, tournament }: { playerIds: string[], tournament: Tournament }) {
  if (playerIds.length === 0) return null

  const isTeamFormat = tournament.config.format === 'team-americano' || tournament.config.format === 'team-mexicano'

  // For team formats, show pairs sitting out
  const items: string[] = []
  if (isTeamFormat && tournament.teams) {
    const seenTeams = new Set<string>()
    for (const playerId of playerIds) {
      const team = tournament.teams.find(t => t.player1Id === playerId || t.player2Id === playerId)
      if (team && !seenTeams.has(team.id)) {
        seenTeams.add(team.id)
        items.push(team.name)
      }
    }
  } else {
    for (const id of playerIds) {
      const player = getPlayerById(tournament, id)
      if (player) items.push(player.name)
    }
  }

  return (
    <Card className="p-4 border-border bg-card/50">
      <div className="flex items-center gap-2 mb-3">
        <Coffee className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Sitting out this round</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge
            key={i}
            variant="outline"
            className="bg-muted/50 text-muted-foreground border-border"
          >
            {item}
          </Badge>
        ))}
      </div>
    </Card>
  )
}

export default function RoundPage() {
  const router = useRouter()
  const tournament = useTournamentStore(state => state.getActiveTournament())
  const updateMatchScore = useTournamentStore(state => state.updateMatchScore)
  const confirmRound = useTournamentStore(state => state.confirmRound)
  const advanceToNextRound = useTournamentStore(state => state.advanceToNextRound)

  const [editingMatches, setEditingMatches] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)

  if (!tournament) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">No Active Tournament</h2>
          <p className="text-muted-foreground text-sm mb-4">Create or select a tournament to view rounds</p>
          <Button onClick={() => router.push('/')} variant="outline">
            Go to Home
          </Button>
        </div>
      </AppShell>
    )
  }

  const format = tournament.config.format ?? 'americano'
  const isMexicanoFormat = format === 'mexicano' || format === 'team-mexicano'
  const totalRounds = isMexicanoFormat
    ? (tournament.config.targetRounds ?? 7)
    : tournament.rounds.length

  const currentRound = tournament.rounds.find(r => r.number === tournament.currentRound)

  if (!currentRound) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Tournament Complete</h2>
          <p className="text-muted-foreground text-sm mb-4">All rounds have been played</p>
          <Button onClick={() => router.push('/leaderboard')}>
            View Final Rankings
          </Button>
        </div>
      </AppShell>
    )
  }

  const handleScoreUpdate = (matchId: string, team1Points: number, team2Points: number) => {
    updateMatchScore(tournament.id, currentRound.number, matchId, { team1Points, team2Points })
    setEditingMatches(prev => {
      const next = new Set(prev)
      next.delete(matchId)
      return next
    })
  }

  const handleEdit = (matchId: string) => {
    setEditingMatches(prev => new Set([...prev, matchId]))
  }

  const allMatchesConfirmed =
    currentRound.matches.every(m => m.score !== undefined) &&
    editingMatches.size === 0

  const handleNextRound = async () => {
    confirmRound(tournament.id, currentRound.number)

    if (isMexicanoFormat) {
      setIsGenerating(true)
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsGenerating(false)
    }

    advanceToNextRound(tournament.id)
    setEditingMatches(new Set())

    const updatedTournament = useTournamentStore.getState().getActiveTournament()
    if (updatedTournament?.status === 'completed') {
      router.push('/leaderboard')
    }
  }

  const handleShare = async () => {
    const courtLines = currentRound.matches.map(match => {
      const court = getCourtById(tournament, match.courtId)
      const t1 = match.team1.map(id => getPlayerById(tournament, id)?.name ?? 'Unknown')
      const t2 = match.team2.map(id => getPlayerById(tournament, id)?.name ?? 'Unknown')
      return `${court?.name ?? 'Court'}: ${t1.join(' & ')} vs ${t2.join(' & ')}`
    })

    const byeNames = currentRound.byePlayerIds
      .map(id => getPlayerById(tournament, id)?.name ?? 'Unknown')

    const lines = [
      `${tournament.name} — Round ${currentRound.number} of ${totalRounds}`,
      ...courtLines,
      ...(byeNames.length > 0 ? [`Sitting out: ${byeNames.join(', ')}`] : []),
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
    } catch {
      // Fallback for environments without clipboard API
    }
  }

  const isLastRound = currentRound.number >= totalRounds

  const nextRoundButtonText = isLastRound
    ? 'Finish Tournament'
    : isMexicanoFormat
      ? 'Generate Next Round'
      : 'Next Round'

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                Round {currentRound.number} of {totalRounds}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">{tournament.name}</p>
              <Badge variant="outline" className="text-xs text-muted-foreground border-border bg-secondary/50 px-1.5 py-0">
                {FORMAT_LABELS[format]}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            {tournament.config.timeLimitMinutes && (
              <RoundTimer minutes={tournament.config.timeLimitMinutes} />
            )}
          </div>
        </div>

        {/* Generating overlay */}
        {isGenerating && (
          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Generating next round...</span>
          </div>
        )}

        {!isGenerating && (
          <>
            {/* Matches */}
            <div className="space-y-4">
              {currentRound.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  tournament={tournament}
                  roundNumber={currentRound.number}
                  onScoreUpdate={handleScoreUpdate}
                  onEdit={handleEdit}
                />
              ))}
            </div>

            {/* Bye Players */}
            <ByeSection playerIds={currentRound.byePlayerIds} tournament={tournament} />
          </>
        )}

        {/* Next Round Button */}
        <Button
          onClick={handleNextRound}
          disabled={!allMatchesConfirmed || isGenerating}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
        >
          {nextRoundButtonText}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </AppShell>
  )
}
