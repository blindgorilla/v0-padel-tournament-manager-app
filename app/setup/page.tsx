'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useTournamentStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Plus, X, AlertCircle, Users, MapPin, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SetupPage() {
  const router = useRouter()
  const createTournament = useTournamentStore(state => state.createTournament)
  
  const [name, setName] = useState('')
  const [playerInput, setPlayerInput] = useState('')
  const [players, setPlayers] = useState<string[]>([])
  const [pointsPerMatch, setPointsPerMatch] = useState<16 | 24 | 32>(32)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState<10 | 15 | 20>(15)
  
  // Calculate courts based on player count
  const courtCount = Math.floor(players.length / 4)
  const [courtNames, setCourtNames] = useState<string[]>([])
  
  // Update court names when player count changes
  const effectiveCourtNames = Array.from({ length: courtCount }, (_, i) => 
    courtNames[i] || `Court ${i + 1}`
  )
  
  const remainder = players.length % 4
  const showWarning = players.length >= 4 && remainder !== 0
  
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
  
  const updateCourtName = (index: number, newName: string) => {
    const updated = [...effectiveCourtNames]
    updated[index] = newName
    setCourtNames(updated)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addPlayer()
    }
  }
  
  const handleGenerate = () => {
    if (!name.trim() || players.length < 4) return
    
    const tournamentId = createTournament(
      name.trim(),
      players,
      effectiveCourtNames,
      pointsPerMatch,
      timerEnabled ? timerMinutes : undefined
    )
    
    if (tournamentId) {
      router.push('/round')
    }
  }
  
  const isValid = name.trim() && players.length >= 4
  
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tournament Setup</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your Americano tournament</p>
        </div>
        
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
        
        {/* Players Section */}
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
              onKeyDown={handleKeyDown}
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
