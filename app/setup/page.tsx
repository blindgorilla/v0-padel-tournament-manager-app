'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useTournamentStore } from '@/lib/store'
import type { TournamentFormat } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Plus, X, AlertCircle, Users, MapPin, Timer, RefreshCw, Zap, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamPair {
  id: string
  player1: string
  player2: string
}

const FORMAT_CARDS = [
  {
    id: 'americano' as TournamentFormat,
    icon: RefreshCw,
    title: 'Classic Americano',
    subtitle: 'Social · Individual',
    description: "Partners rotate every round following a pre-set schedule. You'll play with and against everyone. Perfect for social events and mixed skill levels.",
    bestFor: 'Best for: Club nights & beginners',
  },
  {
    id: 'mexicano' as TournamentFormat,
    icon: Zap,
    title: 'Mexicano',
    subtitle: 'Competitive · Individual',
    description: 'Same as Americano but partners are re-paired after every round based on the live leaderboard. Top players face each other, keeping every match tight.',
    bestFor: 'Best for: Competitive groups',
  },
  {
    id: 'team-americano' as TournamentFormat,
    icon: Users,
    title: 'Team Americano',
    subtitle: 'Social · Fixed Pairs',
    description: 'You stay with your partner the whole tournament. Your pair faces every other pair at least once. Points tracked per team. Great for established duos.',
    bestFor: 'Best for: Established pairs',
  },
  {
    id: 'team-mexicano' as TournamentFormat,
    icon: Trophy,
    title: 'Team Mexicano',
    subtitle: 'Competitive · Fixed Pairs',
    description: 'Fixed pairs like Team Americano, but after each round teams are re-matched based on standings. Similar-ranked pairs always face each other.',
    bestFor: 'Best for: Competitive pairs',
  },
]

export default function SetupPage() {
  const router = useRouter()
  const createTournament = useTournamentStore(state => state.createTournament)

  const [format, setFormat] = useState<TournamentFormat>('americano')
  const [targetRounds, setTargetRounds] = useState(7)
  const [name, setName] = useState('')
  const [pointsPerMatch, setPointsPerMatch] = useState<16 | 24 | 32>(32)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState<10 | 15 | 20>(15)

  // Individual format state
  const [playerInput, setPlayerInput] = useState('')
  const [players, setPlayers] = useState<string[]>([])

  // Team format state
  const [teamPairs, setTeamPairs] = useState<TeamPair[]>([])
  const [pairInput, setPairInput] = useState({ player1: '', player2: '' })

  const isTeamFormat = format === 'team-americano' || format === 'team-mexicano'
  const isMexicanoFormat = format === 'mexicano' || format === 'team-mexicano'

  // Court count based on active player count
  const playerCount = isTeamFormat ? teamPairs.length * 2 : players.length
  const courtCount = Math.floor(playerCount / 4)
  const [courtNames, setCourtNames] = useState<string[]>([])

  const effectiveCourtNames = Array.from({ length: courtCount }, (_, i) =>
    courtNames[i] || `Court ${i + 1}`
  )

  const remainder = playerCount % 4
  const showWarning = playerCount >= 4 && remainder !== 0

  // Individual player handlers
  const addPlayer = () => {
    const trimmed = playerInput.trim()
    if (trimmed && !players.includes(trimmed)) {
      setPlayers([...players, trimmed])
      setPlayerInput('')
    }
  }

  const removePlayer = (playerName: string) => {
    setPlayers(players.filter(p => p !== playerName))
  }

  const handlePlayerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addPlayer()
    }
  }

  // Team pair handlers
  const addPair = () => {
    const p1 = pairInput.player1.trim()
    const p2 = pairInput.player2.trim()
    if (p1 && p2) {
      setTeamPairs([...teamPairs, { id: crypto.randomUUID(), player1: p1, player2: p2 }])
      setPairInput({ player1: '', player2: '' })
    }
  }

  const removePair = (id: string) => {
    setTeamPairs(teamPairs.filter(p => p.id !== id))
  }

  const handlePairKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addPair()
    }
  }

  const updateCourtName = (index: number, newName: string) => {
    const updated = [...effectiveCourtNames]
    updated[index] = newName
    setCourtNames(updated)
  }

  const handleGenerate = () => {
    if (!name.trim()) return
    if (isTeamFormat && teamPairs.length < 2) return
    if (!isTeamFormat && players.length < 4) return

    let tournamentId: string

    if (isTeamFormat) {
      const allPlayerNames = teamPairs.flatMap(p => [p.player1, p.player2])
      tournamentId = createTournament(
        name.trim(),
        allPlayerNames,
        effectiveCourtNames,
        pointsPerMatch,
        timerEnabled ? timerMinutes : undefined,
        format,
        isMexicanoFormat ? targetRounds : undefined,
        teamPairs.map(p => ({
          name: `${p.player1} & ${p.player2}`,
          player1Name: p.player1,
          player2Name: p.player2,
        }))
      )
    } else {
      tournamentId = createTournament(
        name.trim(),
        players,
        effectiveCourtNames,
        pointsPerMatch,
        timerEnabled ? timerMinutes : undefined,
        format,
        isMexicanoFormat ? targetRounds : undefined
      )
    }

    if (tournamentId) {
      router.push('/round')
    }
  }

  const isValid = name.trim() &&
    (isTeamFormat ? teamPairs.length >= 2 : players.length >= 4)

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tournament Setup</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your tournament</p>
        </div>

        {/* Format Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Format</Label>
          <div className="flex flex-col gap-3">
            {FORMAT_CARDS.map(card => {
              const Icon = card.icon
              const selected = format === card.id
              return (
                <button
                  key={card.id}
                  onClick={() => setFormat(card.id)}
                  className={cn(
                    'text-left p-4 rounded-xl border-2 transition-all',
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  )}
                >
                  <Icon className="w-6 h-6 text-primary" />
                  <p className="font-semibold text-foreground mt-2">{card.title}</p>
                  <p className="text-xs text-muted-foreground tracking-wide uppercase mt-0.5">{card.subtitle}</p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{card.description}</p>
                  <p className="text-xs font-medium text-primary mt-3">{card.bestFor}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Rounds input for Mexicano formats */}
        {isMexicanoFormat && (
          <div className="space-y-2">
            <Label htmlFor="targetRounds" className="text-sm font-medium text-foreground">
              Number of Rounds
            </Label>
            <Input
              id="targetRounds"
              type="number"
              min={3}
              max={20}
              value={targetRounds}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) setTargetRounds(Math.min(20, Math.max(3, v)))
              }}
              className="h-12 bg-secondary border-border text-foreground w-32"
            />
            <p className="text-xs text-muted-foreground">Min 3, max 20. Default 7.</p>
          </div>
        )}

        {/* Tournament Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Tournament Name</Label>
          <Input
            id="name"
            placeholder="Friday Night Padel"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Players Section — Individual formats */}
        {!isTeamFormat && (
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Players</h2>
              {players.length > 0 && (
                <Badge variant="secondary" className="ml-auto bg-secondary text-foreground">
                  {players.length} players
                </Badge>
              )}
            </div>

            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter player name"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyDown={handlePlayerKeyDown}
                className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={addPlayer}
                size="icon"
                className="h-11 w-11 bg-primary hover:bg-primary/90"
                disabled={!playerInput.trim()}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {players.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {players.map((player) => (
                  <Badge
                    key={player}
                    variant="outline"
                    className="pl-3 pr-1 py-1.5 text-sm bg-secondary border-border text-foreground flex items-center gap-1"
                  >
                    {player}
                    <button
                      onClick={() => removePlayer(player)}
                      className="ml-1 p-0.5 hover:bg-destructive/20 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Add at least 4 players to create a tournament
              </p>
            )}

            {showWarning && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <p className="text-sm text-yellow-400">
                  {players.length} players — {remainder} will sit out each round
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Pairs Section — Team formats */}
        {isTeamFormat && (
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Pairs</h2>
              {teamPairs.length > 0 && (
                <Badge variant="secondary" className="ml-auto bg-secondary text-foreground">
                  {teamPairs.length} pairs
                </Badge>
              )}
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Player 1"
                  value={pairInput.player1}
                  onChange={e => setPairInput(p => ({ ...p, player1: e.target.value }))}
                  onKeyDown={handlePairKeyDown}
                  className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                <Input
                  placeholder="Player 2"
                  value={pairInput.player2}
                  onChange={e => setPairInput(p => ({ ...p, player2: e.target.value }))}
                  onKeyDown={handlePairKeyDown}
                  className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button
                onClick={addPair}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!pairInput.player1.trim() || !pairInput.player2.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Pair
              </Button>
            </div>

            {teamPairs.length > 0 ? (
              <div className="space-y-2 mt-3">
                {teamPairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {pair.player1} &amp; {pair.player2}
                      </p>
                    </div>
                    <button
                      onClick={() => removePair(pair.id)}
                      className="p-1 hover:bg-destructive/20 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Add at least 2 pairs to create a tournament
              </p>
            )}

            {teamPairs.length === 1 && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <p className="text-sm text-yellow-400">Add at least 2 pairs</p>
              </div>
            )}

            {showWarning && teamPairs.length >= 2 && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <p className="text-sm text-yellow-400">
                  {teamPairs.length * 2} players — {remainder} will sit out each round
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Courts Section */}
        {courtCount > 0 && (
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Courts</h2>
              <Badge variant="secondary" className="ml-auto bg-secondary text-foreground">
                {courtCount} courts
              </Badge>
            </div>
            <div className="space-y-3">
              {effectiveCourtNames.map((courtName, index) => (
                <Input
                  key={index}
                  value={courtName}
                  onChange={(e) => updateCourtName(index, e.target.value)}
                  className="h-11 bg-secondary border-border text-foreground"
                />
              ))}
            </div>
          </Card>
        )}

        {/* Points Per Match */}
        <Card className="p-4 border-border bg-card">
          <Label className="text-sm font-medium text-foreground mb-3 block">Points per Match</Label>
          <div className="flex gap-2">
            {([16, 24, 32] as const).map((points) => (
              <button
                key={points}
                onClick={() => setPointsPerMatch(points)}
                className={cn(
                  'flex-1 py-3 rounded-lg font-semibold transition-all',
                  pointsPerMatch === points
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                )}
              >
                {points}
              </button>
            ))}
          </div>
        </Card>

        {/* Timer Section */}
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              <Label className="text-sm font-medium text-foreground">Round Timer</Label>
            </div>
            <Switch
              checked={timerEnabled}
              onCheckedChange={setTimerEnabled}
            />
          </div>

          {timerEnabled && (
            <div className="flex gap-2">
              {([10, 15, 20] as const).map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => setTimerMinutes(minutes)}
                  className={cn(
                    'flex-1 py-3 rounded-lg font-semibold transition-all',
                    timerMinutes === minutes
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  )}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!isValid}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
        >
          Generate Tournament
        </Button>
      </div>
    </AppShell>
  )
}
