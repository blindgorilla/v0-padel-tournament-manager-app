'use client'

import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useTournamentStore, getRankedPlayers } from '@/lib/store'
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
  
  const rankedPlayers = getRankedPlayers(tournament)
  
  const handleShare = async () => {
    // Create a text summary of the leaderboard
    const summary = rankedPlayers
      .map((p, i) => `${i + 1}. ${p.name} - ${p.totalPoints} pts`)
      .join('\n')
    
    const text = `${tournament.name} - Final Rankings\n\n${summary}`
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers that don't support clipboard API
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
            <p className="text-sm text-muted-foreground">{tournament.name}</p>
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
            Round {tournament.currentRound} of {tournament.rounds.length} in progress
          </Badge>
        )}
        {tournament.status === 'completed' && (
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
            Tournament Complete
          </Badge>
        )}
        
        {/* Rankings Table */}
        <Card className="border-border bg-card overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_1fr_60px_80px] gap-2 px-4 py-3 bg-secondary/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="text-center">#</div>
            <div>Player</div>
            <div className="text-center">Pts</div>
            <div className="text-center">W/D/L</div>
          </div>
          
          {/* Table Body */}
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
                  {/* Rank */}
                  <div className="flex items-center justify-center">
                    {isTopThree ? (
                      <MedalIcon rank={rank} />
                    ) : (
                      <span className="text-sm text-muted-foreground font-medium">{rank}</span>
                    )}
                  </div>
                  
                  {/* Player Name */}
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
                  
                  {/* Points */}
                  <div className={cn(
                    'text-center font-bold tabular-nums',
                    isTopThree ? 'text-primary' : 'text-foreground'
                  )}>
                    {player.totalPoints}
                  </div>
                  
                  {/* Win/Draw/Loss */}
                  <div className="text-center text-sm text-muted-foreground tabular-nums">
                    {player.wins}/{player.draws}/{player.losses}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Pts = Total Points</span>
          <span>W/D/L = Wins/Draws/Losses</span>
        </div>
      </div>
    </AppShell>
  )
}
