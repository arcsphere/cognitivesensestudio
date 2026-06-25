export type BoardItem = { id: string; text: string; x: number; y: number; threadId: string; createdAt: string }

export type ActionRoomData = {
  threadId: string
  context: string
  world: string
  trust: string
  cannotTrust: string
  swot: { strengths: string; weaknesses: string; opportunities: string; threats: string }
  smart: { specific: string; measurable: string; achievable: string; relevant: string; timeBound: string }
  updatedAt: string
}
