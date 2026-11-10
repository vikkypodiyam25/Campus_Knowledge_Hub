import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Video } from 'lucide-react';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events.owned';

async function googleRequest(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || 'Google Calendar could not create the meeting. Check that Calendar API is enabled for your Google project.');
  return body;
}

function AuthorizedMeetButton({ title, description, date, time, duration, onCreated }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const canCreate = Boolean(title.trim() && date && time);
  const googleLogin = useGoogleLogin({
    scope: CALENDAR_SCOPE,
    onError: () => { setBusy(false); setMessage('Google authorization was cancelled. Try again when you are ready.'); },
    onSuccess: async ({ access_token: accessToken }) => {
      try {
        const start = new Date(`${date}T${time}:00`);
        const end = new Date(start.getTime() + Math.max(15, Number(duration) || 60) * 60_000);
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
        const event = await googleRequest('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all', accessToken, {
          method: 'POST',
          body: JSON.stringify({
            summary: title.trim(),
            description: description.trim(),
            start: { dateTime: start.toISOString(), timeZone },
            end: { dateTime: end.toISOString(), timeZone },
            conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
          }),
        });
        let meetLink = event.hangoutLink || event.conferenceData?.entryPoints?.find(point => point.entryPointType === 'video')?.uri;
        for (let attempt = 0; !meetLink && event.id && attempt < 8; attempt += 1) {
          await new Promise(resolve => window.setTimeout(resolve, 900));
          const updated = await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(event.id)}?conferenceDataVersion=1`, accessToken);
          meetLink = updated.hangoutLink || updated.conferenceData?.entryPoints?.find(point => point.entryPointType === 'video')?.uri;
        }
        if (!meetLink) throw new Error('Google Calendar created the event, but the Meet link is still processing. Please try again in a moment.');
        onCreated(meetLink);
        setMessage('Meet link created and added to your session. The event is also on your Google Calendar.');
      } catch (error) {
        setMessage(error.message || 'Could not create the Google Meet link.');
      } finally { setBusy(false); }
    },
  });

  return <div className="meet-link-action">
    <button className="btn btn-outline" type="button" disabled={busy || !canCreate} onClick={() => { setBusy(true); setMessage(''); googleLogin(); }}><Video size={16}/>{busy ? 'Creating Meet link…' : 'Create Google Meet link'}</button>
    <small>Google will ask permission to add this session to your calendar and create its Meet room.</small>
    {message && <small role="status" className="meet-link-message">{message}</small>}
  </div>;
}

export default function GoogleMeetLinkButton({ enabled, ...props }) {
  if (!enabled) return null;
  return <AuthorizedMeetButton {...props}/>;
}
