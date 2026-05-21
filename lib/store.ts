import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

// Types
export interface Player {
  id: string
  name: string
  totalPoints: number
  pointsConceded: number
  matchesPlayed: number
  wins: number
  losses: number
  draws: number
}

export interface Court {
  id: string
  name: string
}

export interface TournamentConfig {
  pointsPerMatch: 16 | 24 | 32
  courts: Court[]
  timeLimitMinutes?: number
}

export interface MatchScore {
  team1Points: number
  team2Points: number
}

export interface Match {
  id: string
  courtId: string
  team1: [string, string]
  team2: [string, string]
  score?: MatchScore
}

export interface Round {
  id: string
  number: number
  status: 'pending' | 'active' | 'completed'
  matches: Match[]
  byePlayerIds: string[]
}

export interface Tournament {
  id: string
  name: string
  createdAt: string
  status: 'setup' | 'active' | 'completed'
  config: TournamentConfig
  players: Player[]
  rounds: Round[]
  currentRound: number
}

interface TournamentStore {
  tournaments: Tournament[]
  activeTournamentId: string | null
  
  // Actions
  createTournament: (name: string, playerNames: string[], courtNames: string[], pointsPerMatch: 16 | 24 | 32, timeLimitMinutes?: number) => string
  setActiveTournament: (id: string | null) => void
  getActiveTournament: () => Tournament | undefined
  updateMatchScore: (tournamentId: string, roundNumber: number, matchId: string, score: MatchScore) => void
  confirmRound: (tournamentId: string, roundNumber: number) => void
  advanceToNextRound: (tournamentId: string) => void
  deleteTournament: (id: string) => void
}

// Rotation algorithm: rotate all players so byes are distributed evenly across everyone
function generateRounds(players: Player[], courts: Court[], pointsPerMatch: 16 | 24 | 32): Round[] {
  const n = players.length
  if (n < 4) return []

  const numCourts = courts.length
  const playersPerRound = numCourts * 4

  const numRounds = n - 1

  const rounds: Round[] = []

  for (let r = 0; r < numRounds; r++) {
    // Rotate all players by r positions so every player cycles through
    // the bye slot, distributing sitting-out rounds evenly across all players
    const rotated = players.map((_, i) => players[(i + r) % n])

    // Determine which players are active (on courts) vs bye
    const activeCount = Math.min(playersPerRound, n)
    const activePlayers = rotated.slice(0, activeCount)
    const byePlayers = rotated.slice(activeCount)
    
    // Create matches: pair players (0,1) vs (2,3) for Court 1, (4,5) vs (6,7) for Court 2, etc.
    const matches: Match[] = []
    for (let c = 0; c < numCourts; c++) {
      const baseIndex = c * 4
      if (baseIndex + 3 < activePlayers.length) {
        matches.push({
          id: uuidv4(),
          courtId: courts[c].id,
          team1: [activePlayers[baseIndex].id, activePlayers[baseIndex + 1].id],
          team2: [activePlayers[baseIndex + 2].id, activePlayers[baseIndex + 3].id],
        })
      }
    }
    
    rounds.push({
      id: uuidv4(),
      number: r + 1,
      status: r === 0 ? 'active' : 'pending',
      matches,
      byePlayerIds: byePlayers.map(p => p.id),
    })
  }
  
  return rounds
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      tournaments: [],
      activeTournamentId: null,
      
      createTournament: (name, playerNames, courtNames, pointsPerMatch, timeLimitMinutes) => {
        const id = uuidv4()
        
        const players: Player[] = playerNames.map(pName => ({
          id: uuidv4(),
          name: pName,
          totalPoints: 0,
          pointsConceded: 0,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
        }))
        
        const courts: Court[] = courtNames.map((cName, i) => ({
          id: uuidv4(),
          name: cName || `Court ${i + 1}`,
        }))
        
        const rounds = generateRounds(players, courts, pointsPerMatch)
        
        const tournament: Tournament = {
          id,
          name,
          createdAt: new Date().toISOString(),
          status: 'active',
          config: {
            pointsPerMatch,
            courts,
            timeLimitMinutes,
          },
          players,
          rounds,
          currentRound: 1,
        }
        
        set(state => ({
          tournaments: [tournament, ...state.tournaments],
          activeTournamentId: id,
        }))
        
        return id
      },
      
      setActiveTournament: (id) => {
        set({ activeTournamentId: id })
      },
      
      getActiveTournament: () => {
        const state = get()
        return state.tournaments.find(t => t.id === state.activeTournamentId)
      },
      
      updateMatchScore: (tournamentId, roundNumber, matchId, score) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t
            
            return {
              ...t,
              rounds: t.rounds.map(r => {
                if (r.number !== roundNumber) return r
                
                return {
                  ...r,
                  matches: r.matches.map(m => {
                    if (m.id !== matchId) return m
                    return { ...m, score }
                  }),
                }
              }),
            }
          }),
        }))
      },
      
      confirmRound: (tournamentId, roundNumber) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t
            
            // Update player stats based on round results
            const round = t.rounds.find(r => r.number === roundNumber)
            if (!round) return t
            
            const updatedPlayers = t.players.map(player => {
              const playerCopy = { ...player }
              
              for (const match of round.matches) {
                if (!match.score) continue
                
                const isTeam1 = match.team1.includes(player.id)
                const isTeam2 = match.team2.includes(player.id)
                
                if (!isTeam1 && !isTeam2) continue
                
                playerCopy.matchesPlayed += 1
                
                if (isTeam1) {
                  playerCopy.totalPoints += match.score.team1Points
                  playerCopy.pointsConceded += match.score.team2Points
                  if (match.score.team1Points > match.score.team2Points) {
                    playerCopy.wins += 1
                  } else if (match.score.team1Points < match.score.team2Points) {
                    playerCopy.losses += 1
                  } else {
                    playerCopy.draws += 1
                  }
                } else {
                  playerCopy.totalPoints += match.score.team2Points
                  playerCopy.pointsConceded += match.score.team1Points
                  if (match.score.team2Points > match.score.team1Points) {
                    playerCopy.wins += 1
                  } else if (match.score.team2Points < match.score.team1Points) {
                    playerCopy.losses += 1
                  } else {
                    playerCopy.draws += 1
                  }
                }
              }
              
              return playerCopy
            })
            
            return {
              ...t,
              players: updatedPlayers,
              rounds: t.rounds.map(r => {
                if (r.number === roundNumber) {
                  return { ...r, status: 'completed' as const }
                }
                return r
              }),
            }
          }),
        }))
      },
      
      advanceToNextRound: (tournamentId) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t
            
            const nextRoundNumber = t.currentRound + 1
            const nextRound = t.rounds.find(r => r.number === nextRoundNumber)
            
            if (!nextRound) {
              // Tournament is complete
              return { ...t, status: 'completed' as const }
            }
            
            return {
              ...t,
              currentRound: nextRoundNumber,
              rounds: t.rounds.map(r => {
                if (r.number === nextRoundNumber) {
                  return { ...r, status: 'active' as const }
                }
                return r
              }),
            }
          }),
        }))
      },
      
      deleteTournament: (id) => {
        set(state => ({
          tournaments: state.tournaments.filter(t => t.id !== id),
          activeTournamentId: state.activeTournamentId === id ? null : state.activeTournamentId,
        }))
      },
    }),
    {
      name: 'americano-tournament-storage',
    }
  )
)

// Helper functions
export function getPlayerById(tournament: Tournament, playerId: string): Player | undefined {
  return tournament.players.find(p => p.id === playerId)
}

export function getCourtById(tournament: Tournament, courtId: string): Court | undefined {
  return tournament.config.courts.find(c => c.id === courtId)
}

export function getRankedPlayers(tournament: Tournament): Player[] {
  return [...tournament.players].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    const bDiff = b.totalPoints - b.pointsConceded
    const aDiff = a.totalPoints - a.pointsConceded
    if (bDiff !== aDiff) return bDiff - aDiff
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.name.localeCompare(b.name)
  })
}
