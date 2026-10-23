import { prisma } from '@/lib/prisma'
import { settingsFromRecord } from '@/lib/music'
import { MusicSettingsForm } from './MusicSettingsForm'

export const revalidate = 0

export default async function MusicSettingsPage() {
  const record = await prisma.musicSettings.findUnique({ where: { id: 'default' } })
  return <MusicSettingsForm initialSettings={settingsFromRecord(record)} />
}
