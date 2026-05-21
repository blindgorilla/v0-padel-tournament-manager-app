'use client'

import { AppShell } from '@/components/app-shell'
import { useTournamentStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trophy, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-secondary flex items-center justify-center">
        <Trophy className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No tournaments yet</h3>
      <p className="text-muted-foreground text-sm max-w-[250px]">
        Create your first Americano tournament and start tracking your matches
      </p>
    </div>
  )
}

function TournamentCard({ tournament }: { tournament: ReturnType<typeof useTournamentStore.getState>['tournaments'][0] }) {
  const router = useRouter()
  const setActiveTournament = useTournamentStore(state => state.setActiveTournament)
  
  const statusColors = {
    setup: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    active: 'bg-primary/20 text-primary border-primary/30',
    completed: 'bg-muted text-muted-foreground border-muted',
  }
  
  const handleClick = () => {
    setActiveTournament(tournament.id)
    if (tournament.status === 'active') {
      router.push('/round')
    } else if (tournament.status === 'completed') {
      router.push('/leaderboard')
    } else {
      router.push('/setup')
    }
  }
  
  const formattedDate = new Date(tournament.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  
  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors border-border"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-foreground truncate pr-2">{tournament.name}</h3>
        <Badge variant="outline" className={statusColors[tournament.status]}>
          {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          {tournament.players.length} players
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {formattedDate}
        </span>
      </div>
      {tournament.status === 'active' && (
        <div className="mt-3 text-xs text-primary font-medium">
          Round {tournament.currentRound} of {tournament.rounds.length}
        </div>
      )}
    </Card>
  )
}

export default function HomePage() {
  const tournaments = useTournamentStore(state => state.tournaments)
  
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Americano</h1>
          <p className="text-muted-foreground text-sm mt-1">Padel Tournament Manager</p>
        </div>
        
        {/* New Tournament CTA */}
        <Link href="/setup" className="block">
          <Button className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-5 h-5 mr-2" />
            New Tournament
          </Button>
        </Link>
        
        {/* Tournament List */}
        <div className="space-y-3">
          {tournaments.length > 0 && (
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Recent Tournaments
            </h2>
          )}
          
          {tournaments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {tournaments.map(tournament => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
