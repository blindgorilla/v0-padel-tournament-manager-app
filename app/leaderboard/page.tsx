'use client'

import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useTournamentStore, getRankedPlayers, getRankedTeams, FORMAT_LABELS } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Share2, Trophy, Medal } from 'lucide-react'
import { useState } from 'react'

function MedalIcon({ rank }: { rank: number }) {
  if (rank > 3) return null

  const colors = {
    1: 'text-gold',
    2: 'text-silver',
    3: 'text-bronze',
  }

  return <Medal className={cn('w-5 h-5', colors[rank as 1 | 2 | 3])} />
}

export default function LeaderboardPage() {
  const router = useRouter()
  const tournament = useTournamentStore(state => state.getActiveTournament())
  const [copied, setCopied] = useState(false)

  if (!tournament) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">No Active Tournament</h2>
          <p className="text-muted-foreground text-sm mb-4">Create or select a tournament to view rankings</p>
          <Button onClick={() => router.push('/')} variant="outline">
            Go to Home
          </Button>
        </div>
      </AppShell>
    )
  }

  const format = (tournament.config.format ?? 'americano') as import('@/lib/store').TournamentFormat
  const isTeamFormat = format === 'team-americano' || format === 'team-mexicano'
  const isMexicanoFormat = format === 'mexicano' || format === 'team-mexicano'

  const rankedPlayers = getRankedPlayers(tournament)
  const rankedTeams = getRankedTeams(tournament)

  const totalRounds = isMexicanoFormat
    ? (tournament.config.targetRounds ?? 7)
    : tournament.rounds.length

  const handleShare = async () => {
    let summary: string

    if (isTeamFormat) {
      summary = rankedTeams
        .map((team, i) => `${i + 1}. ${team.name} - ${team.totalPoints} pts`)
        .join('\n')
    } else {
      summary = rankedPlayers
        .map((p, i) => `${i + 1}. ${p.name} - ${p.totalPoints} pts`)
        .join('\n')
    }

    const text = `${tournament.name} - Final Rankings\n\n${summary}`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.log('Copy not supported')
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Leaderboard
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">{tournament.name}</p>
              <Badge variant="outline" className="text-xs text-muted-foreground border-border bg-secondary/50 px-1.5 py-0">
                {FORMAT_LABELS[format]}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="border-border text-foreground hover:bg-secondary"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Share'}
          </Button>
        </div>

        {/* Status Badge */}
        {tournament.status === 'active' && (
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
            Round {tournament.currentRound} of {totalRounds} in progress
          </Badge>
        )}
        {tournament.status === 'completed' && (
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
            Tournament Complete
          </Badge>
        )}

        {/* Team Rankings */}
        {isTeamFormat && (
          <Card className="border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_60px_80px] gap-2 px-4 py-3 bg-secondary/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="text-center">#</div>
              <div>Team</div>
              <div className="text-center">Pts</div>
              <div className="text-center">W/D/L</div>
            </div>

            <div className="divide-y divide-border">
              {rankedTeams.map((team, index) => {
                const rank = index + 1
                const isTopThree = rank <= 3
                const player1 = tournament.players.find(p => p.id === team.player1Id)
                const player2 = tournament.players.find(p => p.id === team.player2Id)

                return (
                  <div
                    key={team.id}
                    className={cn(
                      'grid grid-cols-[40px_1fr_60px_80px] gap-2 px-4 py-3 items-center transition-colors',
                      isTopThree && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-center justify-center">
                      {isTopThree ? (
                        <MedalIcon rank={rank} />
                      ) : (
                        <span className="text-sm text-muted-foreground font-medium">{rank}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className={cn(
                        'font-bold truncate',
                        isTopThree ? 'text-foreground' : 'text-foreground/80'
                      )}>
                        {team.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {player1?.name ?? '?'} &amp; {player2?.name ?? '?'}
                      </p>
                    </div>

                    <div className={cn(
                      'text-center font-bold tabular-nums',
                      isTopThree ? 'text-primary' : 'text-foreground'
                    )}>
                      {team.totalPoints}
                    </div>

                    <div className="text-center text-sm text-muted-foreground tabular-nums">
                      {team.wins}/{team.draws}/{team.losses}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Individual Rankings */}
        {!isTeamFormat && (
          <Card className="border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_60px_80px] gap-2 px-4 py-3 bg-secondary/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="text-center">#</div>
              <div>Player</div>
              <div className="text-center">Pts</div>
              <div className="text-center">W/D/L</div>
            </div>

            <div className="divide-y divide-border">
              {rankedPlayers.map((player, index) => {
                const rank = index + 1
                const isTopThree = rank <= 3

                return (
                  <div
                    key={player.id}
                    className={cn(
                      'grid grid-cols-[40px_1fr_60px_80px] gap-2 px-4 py-3 items-center transition-colors',
                      isTopThree && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-center justify-center">
                      {isTopThree ? (
                        <MedalIcon rank={rank} />
                      ) : (
                        <span className="text-sm text-muted-foreground font-medium">{rank}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        'font-medium truncate',
                        isTopThree ? 'text-foreground' : 'text-foreground/80'
                      )}>
                        {player.name}
                      </span>
                      {player.matchesPlayed > 0 && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({player.matchesPlayed})
                        </span>
                      )}
                    </div>

                    <div className={cn(
                      'text-center font-bold tabular-nums',
                      isTopThree ? 'text-primary' : 'text-foreground'
                    )}>
                      {player.totalPoints}
                    </div>

                    <div className="text-center text-sm text-muted-foreground tabular-nums">
                      {player.wins}/{player.draws}/{player.losses}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Pts = Total Points</span>
          <span>W/D/L = Wins/Draws/Losses</span>
        </div>
      </div>
    </AppShell>
  )
}
