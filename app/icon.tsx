import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#121212',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Run%20%285%29-lHpgkrpqju9MwViP36Jqcd5C4wGbkH.png"
        alt="RunGTM"
        width={28}
        height={28}
        style={{ objectFit: 'contain' }}
      />
    </div>,
    { ...size },
  )
}
