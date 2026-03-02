import { Resend } from 'resend'
import type { Flow } from './types'

const FROM = 'RunGTM <digest@rungtm.com>'  // update to your verified domain

export async function sendDigestEmail(
  to:    string,
  flow:  Flow,
  blurb: string
): Promise<boolean> {
  try {
    const toolList = flow.tools.join(', ')
    const steps    = flow.steps
      .map((s, i) => `<li>${i + 1}. <strong>${s.app}</strong> — ${s.action || s.description}</li>`)
      .join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #111; }
    .header { background: #0f172a; color: white; padding: 24px 32px; border-radius: 8px 8px 0 0; }
    .badge { background: #6366f1; color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; }
    .content { padding: 32px; background: #f8fafc; }
    .flow-title { font-size: 24px; font-weight: 700; margin: 0 0 8px; }
    .tools { color: #6366f1; font-size: 13px; margin-bottom: 20px; }
    .blurb { color: #374151; line-height: 1.7; white-space: pre-wrap; }
    .steps { background: white; border-radius: 8px; padding: 20px 24px; margin: 24px 0; border: 1px solid #e5e7eb; }
    .steps h3 { margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; }
    .steps ol { margin: 0; padding-left: 0; list-style: none; }
    .steps li { padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #1f2937; }
    .steps li:last-child { border-bottom: none; }
    .cta { display: inline-block; background: #6366f1; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .footer { padding: 24px 32px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge">Flow of the Day</span>
    <div class="flow-title" style="margin-top:12px;">${flow.title}</div>
    <div class="tools">${toolList}</div>
  </div>
  <div class="content">
    <div class="blurb">${blurb}</div>
    <div class="steps">
      <h3>Steps</h3>
      <ol>${steps}</ol>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/flows/${flow.id}" class="cta">
      View Full Flow →
    </a>
  </div>
  <div class="footer">
    <p>You're receiving this because you subscribed to RunGTM's daily digest.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email={{email}}">Unsubscribe</a></p>
  </div>
</body>
</html>`

    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from:    FROM,
      to,
      subject: `Flow of the Day: ${flow.title}`,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('sendDigestEmail error:', err)
    return false
  }
}
