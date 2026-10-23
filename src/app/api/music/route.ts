import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  MusicValidationError,
  normalizeMusicSettings,
  settingsFromRecord,
} from '@/lib/music'

export async function GET() {
  try {
    const record = await prisma.musicSettings.findUnique({ where: { id: 'default' } })
    return NextResponse.json(settingsFromRecord(record), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: '获取音乐设置失败' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    const settings = normalizeMusicSettings(await req.json())
    const record = await prisma.musicSettings.upsert({
      where: { id: 'default' },
      update: {
        enabled: settings.enabled,
        autoplay: settings.autoplay,
        loopPlaylist: settings.loopPlaylist,
        defaultVolume: settings.defaultVolume,
        defaultTrackId: settings.defaultTrackId,
        tracks: JSON.stringify(settings.tracks),
      },
      create: {
        id: 'default',
        enabled: settings.enabled,
        autoplay: settings.autoplay,
        loopPlaylist: settings.loopPlaylist,
        defaultVolume: settings.defaultVolume,
        defaultTrackId: settings.defaultTrackId,
        tracks: JSON.stringify(settings.tracks),
      },
    })
    return NextResponse.json(settingsFromRecord(record))
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存音乐设置失败'
    const status = error instanceof MusicValidationError ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
