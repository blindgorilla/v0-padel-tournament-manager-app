'use client'

import { useTournamentStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Trophy, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg width="48" height="48" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="64" height="64" rx="4" stroke="#22c55e" strokeWidth="2"/>
        <line x1="36" y1="4" x2="36" y2="68" stroke="#22c55e" strokeWidth="1.5"/>
        <line x1="4" y1="36" x2="68" y2="36" stroke="#22c55e" strokeWidth="1.5"/>
        <line x1="4" y1="20" x2="68" y2="20" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5"/>
        <line x1="4" y1="52" x2="68" y2="52" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5"/>
        <circle cx="36" cy="36" r="6" stroke="#22c55e" strokeWidth="1.5"/>
        <circle cx="36" cy="36" r="2" fill="#22c55e"/>
      </svg>
      <h3 className="text-xl font-bold text-foreground mt-4">Your court is ready.</h3>
      <p className="text-muted-foreground text-sm max-w-[250px] mt-2">
        Create your first Americano tournament and let the games begin.
      </p>
      <div className="w-2 h-2 rounded-full bg-primary mx-auto mt-4 animate-pulse" />
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
        <h3 className="font-semibold text-foreground truncate pr-2">
          {tournament.status === 'completed' && (
            <Trophy className="w-3.5 h-3.5 text-yellow-400 inline mr-1" />
          )}
          {tournament.name}
        </h3>
        <Badge variant="outline" className={statusColors[tournament.status]}>
          {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          {tournament.players.length} players
        </span>
        <Badge variant="outline" className="text-xs border-border text-muted-foreground px-1.5 py-0">
          {tournament.config.pointsPerMatch}pts
        </Badge>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {formattedDate}
        </span>
      </div>
      {tournament.status === 'active' && (
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Round {tournament.currentRound} of {tournament.rounds.length}</span>
            <span>{Math.round((tournament.currentRound / tournament.rounds.length) * 100)}%</span>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(tournament.currentRound / tournament.rounds.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

export default function HomePage() {
  const tournaments = useTournamentStore(state => state.tournaments)

  const totalMatches = tournaments.reduce(
    (sum, t) => sum + t.rounds.flatMap(r => r.matches).length,
    0
  )
  const totalPlayers = tournaments.reduce((sum, t) => sum + t.players.length, 0)

  return (
    <div className="min-h-screen bg-background pb-20">
      <style>{`
        @keyframes heroPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Hero — full bleed */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 120%, rgba(34,197,94,0.15) 0%, transparent 70%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 120%, rgba(34,197,94,0.15) 0%, transparent 70%)',
            animation: 'heroPulse 4s ease-in-out infinite',
          }}
        />
        <div className="relative flex flex-col items-center text-center pt-12 pb-8 px-4">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="64" height="64" rx="4" stroke="#22c55e" strokeWidth="2"/>
            <line x1="36" y1="4" x2="36" y2="68" stroke="#22c55e" strokeWidth="1.5"/>
            <line x1="4" y1="36" x2="68" y2="36" stroke="#22c55e" strokeWidth="1.5"/>
            <line x1="4" y1="20" x2="68" y2="20" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5"/>
            <line x1="4" y1="52" x2="68" y2="52" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5"/>
            <circle cx="36" cy="36" r="6" stroke="#22c55e" strokeWidth="1.5"/>
            <circle cx="36" cy="36" r="2" fill="#22c55e"/>
          </svg>
          <h1
            className="text-5xl font-black tracking-tighter mt-4"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #22c55e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Americano
          </h1>
          <p className="text-xs tracking-[0.25em] text-muted-foreground font-medium mt-2">
            PADEL TOURNAMENT MANAGER
          </p>
        </div>
      </div>

      {/* Stats bar */}
      {tournaments.length > 0 && (
        <div className="flex border-t border-primary/20">
          <div className="flex-1 text-center py-4 border-r border-border">
            <div className="text-2xl font-bold text-primary">{tournaments.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Tournaments</div>
          </div>
          <div className="flex-1 text-center py-4 border-r border-border">
            <div className="text-2xl font-bold text-primary">{totalMatches}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Matches</div>
          </div>
          <div className="flex-1 text-center py-4">
            <div className="text-2xl font-bold text-primary">{totalPlayers}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Players</div>
          </div>
        </div>
      )}

      {/* Padded content */}
      <div className="max-w-lg mx-auto px-4 space-y-6">
        {/* CTA */}
        <div className="mt-6">
          <Link href="/setup" className="block">
            <Button className="w-full h-16 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_24px_rgba(34,197,94,0.25)] hover:shadow-[0_0_32px_rgba(34,197,94,0.4)] transition-shadow">
              <Zap className="w-5 h-5 mr-2" />
              Start New Tournament
            </Button>
          </Link>
        </div>

        {/* Tournament list */}
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

      <BottomNav />
    </div>
  )
}
