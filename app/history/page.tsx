'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useTournamentStore, getPlayerById, getCourtById } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { User, Users, ChevronDown, ChevronUp } from 'lucide-react'
import type { Player, Tournament } from '@/lib/store'

function PlayerCard({ 
  player, 
  tournament, 
  isSelected,
  onClick 
}: { 
  player: Player
  tournament: Tournament
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg transition-all',
        isSelected 
          ? 'bg-primary/20 border border-primary/50' 
          : 'bg-secondary hover:bg-secondary/80 border border-transparent'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-foreground">{player.name}</p>
            <p className="text-xs text-muted-foreground">
              {player.totalPoints} pts • {player.matchesPlayed} matches
            </p>
          </div>
        </div>
        {isSelected ? (
          <ChevronUp className="w-4 h-4 text-primary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </button>
  )
}

function PlayerMatchHistory({ player, tournament }: { player: Player, tournament: Tournament }) {
  // Get all matches where this player participated
  const playerMatches: {
    roundNumber: number
    courtName: string
    partnerId: string
    opponentIds: [string, string]
    playerPoints: number
    opponentPoints: number
    isWin: boolean
    isDraw: boolean
    wasBye: boolean
  }[] = []
  
  for (const round of tournament.rounds) {
    // Check if player was on bye
    if (round.byePlayerIds.includes(player.id)) {
      playerMatches.push({
        roundNumber: round.number,
        courtName: '',
        partnerId: '',
        opponentIds: ['', ''],
        playerPoints: 0,
        opponentPoints: 0,
        isWin: false,
        isDraw: false,
        wasBye: true,
      })
      continue
    }
    
    // Find match with this player
    for (const match of round.matches) {
      const isTeam1 = match.team1.includes(player.id)
      const isTeam2 = match.team2.includes(player.id)
      
      if (!isTeam1 && !isTeam2) continue
      
      const court = getCourtById(tournament, match.courtId)
      const team = isTeam1 ? match.team1 : match.team2
      const opponentTeam = isTeam1 ? match.team2 : match.team1
      const partnerId = team.find(id => id !== player.id) || ''
      
      const playerPoints = match.score 
        ? (isTeam1 ? match.score.team1Points : match.score.team2Points)
        : 0
      const opponentPoints = match.score
        ? (isTeam1 ? match.score.team2Points : match.score.team1Points)
        : 0
      
      playerMatches.push({
        roundNumber: round.number,
        courtName: court?.name || 'Court',
        partnerId,
        opponentIds: opponentTeam as [string, string],
        playerPoints,
        opponentPoints,
        isWin: playerPoints > opponentPoints,
        isDraw: playerPoints === opponentPoints,
        wasBye: false,
      })
    }
  }
  
  if (playerMatches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No match history available
      </p>
    )
  }
  
  return (
    <div className="space-y-2 mt-4">
      {playerMatches.map((match, i) => {
        const partner = getPlayerById(tournament, match.partnerId)
        const opponents = match.opponentIds.map(id => getPlayerById(tournament, id))
        
        if (match.wasBye) {
          return (
            <div 
              key={i}
              className="p-3 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Round {match.roundNumber}
                </span>
                <Badge variant="outline" className="text-muted-foreground border-border">
                  Bye
                </Badge>
              </div>
            </div>
          )
        }
        
        return (
          <div 
            key={i}
            className={cn(
              'p-3 rounded-lg border',
              match.isWin 
                ? 'bg-primary/10 border-primary/30' 
                : match.isDraw
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-destructive/10 border-destructive/30'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Round {match.roundNumber} • {match.courtName}
              </span>
              <Badge 
                variant="outline" 
                className={cn(
                  match.isWin 
                    ? 'bg-primary/20 text-primary border-primary/30' 
                    : match.isDraw
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-destructive/20 text-destructive border-destructive/30'
                )}
              >
                {match.isWin ? 'Won' : match.isDraw ? 'Draw' : 'Lost'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Partner:</span>
                  <span className="text-foreground">{partner?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground ml-5">vs:</span>
                  <span className="text-foreground">
                    {opponents.map(o => o?.name || 'Unknown').join(' & ')}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <span className={cn(
                  'text-lg font-bold tabular-nums',
                  match.isWin ? 'text-primary' : match.isDraw ? 'text-yellow-400' : 'text-destructive'
                )}>
                  {match.playerPoints}
                </span>
                <span className="text-muted-foreground mx-1">-</span>
                <span className="text-lg font-bold tabular-nums text-muted-foreground">
                  {match.opponentPoints}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function HistoryPage() {
  const router = useRouter()
  const tournament = useTournamentStore(state => state.getActiveTournament())
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  
  if (!tournament) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">No Active Tournament</h2>
          <p className="text-muted-foreground text-sm mb-4">Create or select a tournament to view history</p>
          <Button onClick={() => router.push('/')} variant="outline">
            Go to Home
          </Button>
        </div>
      </AppShell>
    )
  }
  
  const selectedPlayer = selectedPlayerId 
    ? getPlayerById(tournament, selectedPlayerId) 
    : null
  
  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Match History</h1>
          <p className="text-sm text-muted-foreground">{tournament.name}</p>
        </div>
        
        {/* Player Selection */}
        <Card className="p-4 border-border bg-card">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Select a player to view their match history
          </h2>
          
          <div className="space-y-2">
            {tournament.players.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                tournament={tournament}
                isSelected={selectedPlayerId === player.id}
                onClick={() => setSelectedPlayerId(
                  selectedPlayerId === player.id ? null : player.id
                )}
              />
            ))}
          </div>
        </Card>
        
        {/* Selected Player History */}
        {selectedPlayer && (
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{selectedPlayer.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedPlayer.totalPoints} total points • {selectedPlayer.wins}W {selectedPlayer.draws}D {selectedPlayer.losses}L
                </p>
              </div>
            </div>
            
            <PlayerMatchHistory player={selectedPlayer} tournament={tournament} />
          </Card>
        )}
      </div>
    </AppShell>
  )
}
