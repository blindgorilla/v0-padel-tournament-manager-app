import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

// Types
export type TournamentFormat = 'americano' | 'mexicano' | 'team-americano' | 'team-mexicano'

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

export interface Team {
  id: string
  name: string
  player1Id: string
  player2Id: string
  totalPoints: number
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
  format: TournamentFormat
  targetRounds?: number
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
  teams?: Team[]
  rounds: Round[]
  currentRound: number
}

interface TournamentStore {
  tournaments: Tournament[]
  activeTournamentId: string | null

  createTournament: (
    name: string,
    playerNames: string[],
    courtNames: string[],
    pointsPerMatch: 16 | 24 | 32,
    timeLimitMinutes?: number,
    format?: TournamentFormat,
    targetRounds?: number,
    teamPairs?: Array<{ name: string; player1Name: string; player2Name: string }>
  ) => string
  setActiveTournament: (id: string | null) => void
  getActiveTournament: () => Tournament | undefined
  updateMatchScore: (tournamentId: string, roundNumber: number, matchId: string, score: MatchScore) => void
  confirmRound: (tournamentId: string, roundNumber: number) => void
  advanceToNextRound: (tournamentId: string) => void
  generateNextMexicanoRound: (tournamentId: string) => void
  deleteTournament: (id: string) => void
}

// --- Round generation helpers ---

function generateAmericanoRounds(players: Player[], courts: Court[]): Round[] {
  const n = players.length
  if (n < 4) return []

  const numCourts = courts.length
  const playersPerRound = numCourts * 4
  const numRounds = n - 1
  const rounds: Round[] = []

  for (let r = 0; r < numRounds; r++) {
    const rotated = players.map((_, i) => players[(i + r) % n])
    const activeCount = Math.min(playersPerRound, n)
    const activePlayers = rotated.slice(0, activeCount)
    const byePlayers = rotated.slice(activeCount)

    const matches: Match[] = []
    for (let c = 0; c < numCourts; c++) {
      const base = c * 4
      if (base + 3 < activePlayers.length) {
        matches.push({
          id: uuidv4(),
          courtId: courts[c].id,
          team1: [activePlayers[base].id, activePlayers[base + 1].id],
          team2: [activePlayers[base + 2].id, activePlayers[base + 3].id],
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

// Mexicano round 1: same pairing as Americano round 1 (no rotation)
function buildMexicanoFirstRound(players: Player[], courts: Court[]): Round {
  const numCourts = courts.length
  const activeCount = Math.min(numCourts * 4, players.length)
  const activePlayers = players.slice(0, activeCount)
  const byePlayers = players.slice(activeCount)

  const matches: Match[] = []
  for (let c = 0; c < numCourts; c++) {
    const base = c * 4
    if (base + 3 < activePlayers.length) {
      matches.push({
        id: uuidv4(),
        courtId: courts[c].id,
        team1: [activePlayers[base].id, activePlayers[base + 1].id],
        team2: [activePlayers[base + 2].id, activePlayers[base + 3].id],
      })
    }
  }

  return {
    id: uuidv4(),
    number: 1,
    status: 'active',
    matches,
    byePlayerIds: byePlayers.map(p => p.id),
  }
}

// Mexicano rounds 2+: sort by points, pair #1+#4 vs #2+#3 per court
function buildMexicanoRound(players: Player[], courts: Court[], roundNumber: number): Round {
  const sorted = [...players].sort((a, b) => b.totalPoints - a.totalPoints)
  const numCourts = courts.length
  const activeCount = Math.min(numCourts * 4, sorted.length)
  const activePlayers = sorted.slice(0, activeCount)
  const byePlayers = sorted.slice(activeCount)

  const matches: Match[] = []
  for (let c = 0; c < numCourts; c++) {
    const base = c * 4
    if (base + 3 < activePlayers.length) {
      matches.push({
        id: uuidv4(),
        courtId: courts[c].id,
        team1: [activePlayers[base].id, activePlayers[base + 3].id],
        team2: [activePlayers[base + 1].id, activePlayers[base + 2].id],
      })
    }
  }

  return {
    id: uuidv4(),
    number: roundNumber,
    status: 'active',
    matches,
    byePlayerIds: byePlayers.map(p => p.id),
  }
}

// Team Americano: full round-robin between teams
function generateTeamAmericanoRounds(teams: Team[], courts: Court[]): Round[] {
  const n = teams.length
  if (n < 2) return []

  const evenTeams: (Team | null)[] = n % 2 === 0 ? [...teams] : [...teams, null]
  const m = evenTeams.length
  const numRounds = m - 1
  const rounds: Round[] = []

  for (let r = 0; r < numRounds; r++) {
    const rotated: (Team | null)[] = [
      evenTeams[0],
      ...Array.from({ length: m - 1 }, (_, i) => evenTeams[((i + r) % (m - 1)) + 1]),
    ]

    const matches: Match[] = []
    const byePlayerIds: string[] = []

    for (let i = 0; i < m / 2; i++) {
      const teamA = rotated[i]
      const teamB = rotated[m - 1 - i]

      if (!teamA) {
        if (teamB) byePlayerIds.push(teamB.player1Id, teamB.player2Id)
        continue
      }
      if (!teamB) {
        byePlayerIds.push(teamA.player1Id, teamA.player2Id)
        continue
      }

      const courtIndex = matches.length % courts.length
      matches.push({
        id: uuidv4(),
        courtId: courts[courtIndex].id,
        team1: [teamA.player1Id, teamA.player2Id],
        team2: [teamB.player1Id, teamB.player2Id],
      })
    }

    rounds.push({
      id: uuidv4(),
      number: r + 1,
      status: r === 0 ? 'active' : 'pending',
      matches,
      byePlayerIds,
    })
  }

  return rounds
}

// Team Mexicano: sort teams by points, pair in groups of 4 (#1 vs #4, #2 vs #3)
function buildTeamMexicanoRound(teams: Team[], courts: Court[], roundNumber: number): Round {
  const sorted = [...teams].sort((a, b) => b.totalPoints - a.totalPoints)
  const matches: Match[] = []
  const byePlayerIds: string[] = []
  let courtIdx = 0

  let i = 0
  while (i + 3 < sorted.length) {
    const t0 = sorted[i], t1 = sorted[i + 1], t2 = sorted[i + 2], t3 = sorted[i + 3]
    matches.push({
      id: uuidv4(),
      courtId: courts[courtIdx % courts.length].id,
      team1: [t0.player1Id, t0.player2Id],
      team2: [t3.player1Id, t3.player2Id],
    })
    courtIdx++
    matches.push({
      id: uuidv4(),
      courtId: courts[courtIdx % courts.length].id,
      team1: [t1.player1Id, t1.player2Id],
      team2: [t2.player1Id, t2.player2Id],
    })
    courtIdx++
    i += 4
  }

  // Handle remaining teams that don't fit in a group of 4
  if (i + 1 < sorted.length) {
    matches.push({
      id: uuidv4(),
      courtId: courts[courtIdx % courts.length].id,
      team1: [sorted[i].player1Id, sorted[i].player2Id],
      team2: [sorted[i + 1].player1Id, sorted[i + 1].player2Id],
    })
    i += 2
  }

  for (; i < sorted.length; i++) {
    byePlayerIds.push(sorted[i].player1Id, sorted[i].player2Id)
  }

  return {
    id: uuidv4(),
    number: roundNumber,
    status: 'active',
    matches,
    byePlayerIds,
  }
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      tournaments: [],
      activeTournamentId: null,

      createTournament: (name, playerNames, courtNames, pointsPerMatch, timeLimitMinutes, format = 'americano', targetRounds = 7, teamPairs) => {
        const id = uuidv4()
        const fmt = format ?? 'americano'
        const isTeamFormat = fmt === 'team-americano' || fmt === 'team-mexicano'

        const courts: Court[] = courtNames.map((cName, i) => ({
          id: uuidv4(),
          name: cName || `Court ${i + 1}`,
        }))

        let players: Player[]
        let teams: Team[] | undefined
        let rounds: Round[]

        if (isTeamFormat && teamPairs && teamPairs.length > 0) {
          players = []
          teams = teamPairs.map(pair => {
            const p1: Player = {
              id: uuidv4(), name: pair.player1Name, totalPoints: 0,
              pointsConceded: 0, matchesPlayed: 0, wins: 0, losses: 0, draws: 0,
            }
            const p2: Player = {
              id: uuidv4(), name: pair.player2Name, totalPoints: 0,
              pointsConceded: 0, matchesPlayed: 0, wins: 0, losses: 0, draws: 0,
            }
            players.push(p1, p2)
            return {
              id: uuidv4(),
              name: pair.name || `${pair.player1Name} & ${pair.player2Name}`,
              player1Id: p1.id,
              player2Id: p2.id,
              totalPoints: 0,
              wins: 0,
              losses: 0,
              draws: 0,
            }
          })

          rounds = fmt === 'team-americano'
            ? generateTeamAmericanoRounds(teams, courts)
            : [buildTeamMexicanoRound(teams, courts, 1)]
        } else {
          players = playerNames.map(pName => ({
            id: uuidv4(), name: pName, totalPoints: 0,
            pointsConceded: 0, matchesPlayed: 0, wins: 0, losses: 0, draws: 0,
          }))

          rounds = fmt === 'mexicano'
            ? [buildMexicanoFirstRound(players, courts)]
            : generateAmericanoRounds(players, courts)
        }

        const tournament: Tournament = {
          id,
          name,
          createdAt: new Date().toISOString(),
          status: 'active',
          config: {
            pointsPerMatch,
            courts,
            timeLimitMinutes,
            format: fmt,
            targetRounds: (fmt === 'mexicano' || fmt === 'team-mexicano') ? targetRounds : undefined,
          },
          players,
          ...(teams && { teams }),
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

            const round = t.rounds.find(r => r.number === roundNumber)
            if (!round) return t

            const format = t.config.format ?? 'americano'
            const isTeamFormat = format === 'team-americano' || format === 'team-mexicano'

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
                  if (match.score.team1Points > match.score.team2Points) playerCopy.wins += 1
                  else if (match.score.team1Points < match.score.team2Points) playerCopy.losses += 1
                  else playerCopy.draws += 1
                } else {
                  playerCopy.totalPoints += match.score.team2Points
                  playerCopy.pointsConceded += match.score.team1Points
                  if (match.score.team2Points > match.score.team1Points) playerCopy.wins += 1
                  else if (match.score.team2Points < match.score.team1Points) playerCopy.losses += 1
                  else playerCopy.draws += 1
                }
              }
              return playerCopy
            })

            let updatedTeams = t.teams
            if (isTeamFormat && t.teams) {
              updatedTeams = t.teams.map(team => {
                const teamCopy = { ...team }
                for (const match of round.matches) {
                  if (!match.score) continue
                  // team1[0] is always player1Id of the team that owns that slot
                  const isTeam1 = match.team1[0] === team.player1Id || match.team1[0] === team.player2Id
                  const isTeam2 = match.team2[0] === team.player1Id || match.team2[0] === team.player2Id
                  if (!isTeam1 && !isTeam2) continue

                  if (isTeam1) {
                    teamCopy.totalPoints += match.score.team1Points
                    if (match.score.team1Points > match.score.team2Points) teamCopy.wins += 1
                    else if (match.score.team1Points < match.score.team2Points) teamCopy.losses += 1
                    else teamCopy.draws += 1
                  } else {
                    teamCopy.totalPoints += match.score.team2Points
                    if (match.score.team2Points > match.score.team1Points) teamCopy.wins += 1
                    else if (match.score.team2Points < match.score.team1Points) teamCopy.losses += 1
                    else teamCopy.draws += 1
                  }
                }
                return teamCopy
              })
            }

            return {
              ...t,
              players: updatedPlayers,
              ...(updatedTeams !== undefined && { teams: updatedTeams }),
              rounds: t.rounds.map(r => {
                if (r.number === roundNumber) return { ...r, status: 'completed' as const }
                return r
              }),
            }
          }),
        }))
      },

      generateNextMexicanoRound: (tournamentId) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t
            const nextRoundNumber = t.currentRound + 1
            const format = t.config.format ?? 'americano'

            if (format === 'mexicano') {
              const nextRound = buildMexicanoRound(t.players, t.config.courts, nextRoundNumber)
              return { ...t, rounds: [...t.rounds, nextRound] }
            }

            if (format === 'team-mexicano' && t.teams) {
              const nextRound = buildTeamMexicanoRound(t.teams, t.config.courts, nextRoundNumber)
              return { ...t, rounds: [...t.rounds, nextRound] }
            }

            return t
          }),
        }))
      },

      advanceToNextRound: (tournamentId) => {
        const tournament = get().tournaments.find(t => t.id === tournamentId)
        if (!tournament) return

        const format = tournament.config.format ?? 'americano'
        const nextRoundNumber = tournament.currentRound + 1
        const targetRounds = tournament.config.targetRounds ?? 7

        if (format === 'mexicano' || format === 'team-mexicano') {
          if (nextRoundNumber > targetRounds) {
            set(state => ({
              tournaments: state.tournaments.map(t =>
                t.id === tournamentId ? { ...t, status: 'completed' as const } : t
              ),
            }))
            return
          }
          get().generateNextMexicanoRound(tournamentId)
          set(state => ({
            tournaments: state.tournaments.map(t => {
              if (t.id !== tournamentId) return t
              return { ...t, currentRound: nextRoundNumber }
            }),
          }))
          return
        }

        // Americano / Team Americano: pre-generated rounds
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t
            const nextRound = t.rounds.find(r => r.number === nextRoundNumber)
            if (!nextRound) {
              return { ...t, status: 'completed' as const }
            }
            return {
              ...t,
              currentRound: nextRoundNumber,
              rounds: t.rounds.map(r =>
                r.number === nextRoundNumber ? { ...r, status: 'active' as const } : r
              ),
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

export function getTeamByPlayerIds(tournament: Tournament, playerIds: [string, string]): Team | undefined {
  return tournament.teams?.find(t =>
    (t.player1Id === playerIds[0] || t.player1Id === playerIds[1]) &&
    (t.player2Id === playerIds[0] || t.player2Id === playerIds[1])
  )
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

export function getRankedTeams(tournament: Tournament): Team[] {
  if (!tournament.teams) return []
  return [...tournament.teams].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.name.localeCompare(b.name)
  })
}

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  americano: 'Americano',
  mexicano: 'Mexicano',
  'team-americano': 'Team Americano',
  'team-mexicano': 'Team Mexicano',
}
